import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { JiraIssue, JiraTestResult, JiraCreateIssue } from '@app-types/framework.types';
import { Logger } from './logger';
import { config } from '@config/config.manager';

export class JiraClient {
  private client: AxiosInstance;
  private logger: Logger;
  private baseUrl: string;
  private projectKey: string;

  constructor() {
    this.logger = new Logger('JiraClient');
    this.baseUrl = config.jiraBaseUrl;
    this.projectKey = config.jiraProjectKey;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.jiraApiToken}`,
        'X-Atlassian-Token': 'no-check'
      },
      timeout: 30000
    });

    // Request interceptor
    this.client.interceptors.request.use(req => {
      this.logger.debug(`JIRA API: ${req.method?.toUpperCase()} ${req.url}`);
      return req;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      res => {
        this.logger.debug(`JIRA Response: ${res.status}`);
        return res;
      },
      error => {
        this.logger.error(`JIRA Error: ${error.response?.status} - ${error.message}`);
        throw error;
      }
    );
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && config.jiraApiToken);
  }

  // ============ Issue Operations ============
  async getIssue(issueKey: string): Promise<JiraIssue> {
    const response = await this.client.get(`/rest/api/3/issue/${issueKey}`, {
      params: {
        fields: 'summary,description,status,priority,issuetype,assignee,reporter,labels,customfield_10014'
      }
    });

    return this.mapToJiraIssue(response.data);
  }

  async searchIssues(jql: string, maxResults = 50): Promise<JiraIssue[]> {
    const response = await this.client.post('/rest/api/3/search', {
      jql,
      maxResults,
      fields: ['summary', 'description', 'status', 'priority', 'issuetype', 'assignee', 'labels']
    });

    return response.data.issues.map((issue: Record<string, unknown>) => this.mapToJiraIssue(issue));
  }

  async getStoriesInSprint(sprintId: number): Promise<JiraIssue[]> {
    const jql = `sprint = ${sprintId} AND issuetype = Story AND project = ${this.projectKey}`;
    return this.searchIssues(jql);
  }

  async getUnautomatedStories(): Promise<JiraIssue[]> {
    const jql = `project = ${this.projectKey} AND issuetype = Story AND labels != automated AND status != Done`;
    return this.searchIssues(jql);
  }

  async createIssue(issueData: JiraCreateIssue): Promise<string> {
    const response = await this.client.post('/rest/api/3/issue', {
      fields: {
        project: { key: issueData.projectKey },
        summary: issueData.summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: issueData.description }]
            }
          ]
        },
        issuetype: { name: issueData.issueType },
        priority: issueData.priority ? { name: issueData.priority } : undefined,
        labels: issueData.labels || [],
        assignee: issueData.assignee ? { name: issueData.assignee } : undefined
      }
    });

    this.logger.info(`Created JIRA issue: ${response.data.key}`);
    return response.data.key;
  }

  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.client.post(`/rest/api/3/issue/${issueKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: comment }]
          }
        ]
      }
    });
    this.logger.info(`Added comment to ${issueKey}`);
  }

  async updateIssueLabel(issueKey: string, label: string): Promise<void> {
    await this.client.put(`/rest/api/3/issue/${issueKey}`, {
      update: {
        labels: [{ add: label }]
      }
    });
    this.logger.info(`Added label "${label}" to ${issueKey}`);
  }

  async transitionIssue(issueKey: string, transitionName: string): Promise<void> {
    // Get available transitions
    const transRes = await this.client.get(`/rest/api/3/issue/${issueKey}/transitions`);
    const transition = transRes.data.transitions.find(
      (t: { name: string }) => t.name.toLowerCase() === transitionName.toLowerCase()
    );

    if (!transition) {
      throw new Error(
        `Transition "${transitionName}" not found for issue ${issueKey}`
      );
    }

    await this.client.post(`/rest/api/3/issue/${issueKey}/transitions`, {
      transition: { id: transition.id }
    });
    this.logger.info(`Transitioned ${issueKey} to "${transitionName}"`);
  }

  async updateTestResult(issueKey: string, result: JiraTestResult): Promise<void> {
    const statusEmoji = result.status === 'PASS' ? '✅' : '❌';
    const commentText = `
${statusEmoji} **Automated Test Execution Result: ${result.status}**

**Test:** ${result.testKey}
**Status:** ${result.status}
**Execution Time:** ${result.executionTime ? `${result.executionTime}ms` : 'N/A'}
**Environment:** ${process.env.ENV || 'staging'}
**Timestamp:** ${new Date().toISOString()}

**Comment:** ${result.comment}

${result.evidence?.length ? `**Evidence:**\n${result.evidence.join('\n')}` : ''}
    `.trim();

    await this.addComment(issueKey, commentText);

    // Add automated label
    await this.updateIssueLabel(issueKey, 'automated');

    this.logger.info(`Updated test result for ${issueKey}: ${result.status}`);
  }

  async attachFile(issueKey: string, filePath: string, fileName: string): Promise<void> {
    const fs = await import('fs');
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), fileName);

    await this.client.post(`/rest/api/3/issue/${issueKey}/attachments`, form, {
      headers: {
        ...form.getHeaders(),
        'X-Atlassian-Token': 'no-check'
      }
    } as AxiosRequestConfig);

    this.logger.info(`Attached file "${fileName}" to ${issueKey}`);
  }

  // ============ Private Helpers ============
  private mapToJiraIssue(data: Record<string, unknown>): JiraIssue {
    const fields = data.fields as Record<string, unknown> || {};

    const getDescription = (): string => {
      const desc = fields.description as Record<string, unknown> | null;
      if (!desc) return '';
      if (typeof desc === 'string') return desc;
      // Extract text from Atlassian Document Format
      return this.extractTextFromAdf(desc);
    };

    return {
      id: data.id as string,
      key: data.key as string,
      summary: (fields.summary as string) || '',
      description: getDescription(),
      status: ((fields.status as Record<string, unknown>)?.name as string) || '',
      priority: ((fields.priority as Record<string, unknown>)?.name as string) || 'Medium',
      issueType: ((fields.issuetype as Record<string, unknown>)?.name as string) || '',
      assignee: ((fields.assignee as Record<string, unknown>)?.displayName as string) || 'Unassigned',
      reporter: ((fields.reporter as Record<string, unknown>)?.displayName as string) || '',
      labels: (fields.labels as string[]) || [],
      acceptanceCriteria: (fields.customfield_10014 as string) || '',
      epicLink: (fields.customfield_10008 as string) || undefined,
      sprint: undefined
    };
  }

  private extractTextFromAdf(doc: Record<string, unknown>): string {
    const texts: string[] = [];
    const content = doc.content as Record<string, unknown>[] || [];

    const extractFromNode = (node: Record<string, unknown>): void => {
      if (node.type === 'text') {
        texts.push(node.text as string);
      }
      const nodeContent = node.content as Record<string, unknown>[];
      if (nodeContent) {
        nodeContent.forEach(extractFromNode);
      }
    };

    content.forEach(extractFromNode);
    return texts.join(' ');
  }
}
