import axios from 'axios';

export class JiraTools {
  private baseUrl: string;
  private token: string;
  private projectKey: string;

  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || '';
    this.token = process.env.JIRA_API_TOKEN || '';
    this.projectKey = process.env.JIRA_PROJECT_KEY || 'AUTO';
  }

  private getClient() {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`
      }
    });
  }

  private isConfigured(): boolean {
    return !!(this.baseUrl && this.token);
  }

  async getStory(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    if (!this.isConfigured()) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              mock: true,
              warning: 'JIRA not configured. Set JIRA_BASE_URL and JIRA_API_TOKEN environment variables.',
              ...this.getMockStory(args.issue_key as string)
            }, null, 2)
          }
        ]
      };
    }

    try {
      const client = this.getClient();
      const response = await client.get(`/rest/api/3/issue/${args.issue_key}`, {
        params: { fields: 'summary,description,status,priority,issuetype,assignee,labels,customfield_10014' }
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(this.formatStory(response.data), null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: `Error fetching JIRA story: ${err instanceof Error ? err.message : String(err)}`
            })
          }
        ]
      };
    }
  }

  async getSprintStories(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    if (!this.isConfigured()) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ JIRA not configured. Set environment variables to enable JIRA integration.'
          }
        ]
      };
    }

    try {
      const client = this.getClient();
      const jql = `sprint = ${args.sprint_id} AND issuetype = Story AND project = ${args.project_key || this.projectKey}`;
      const response = await client.post('/rest/api/3/search', {
        jql,
        maxResults: 50,
        fields: ['summary', 'description', 'status', 'priority']
      });

      const stories = response.data.issues.map((i: Record<string, unknown>) => this.formatStory(i));
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ stories, count: stories.length }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching sprint stories: ${err instanceof Error ? err.message : String(err)}`
          }
        ]
      };
    }
  }

  async createAutomationTask(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    if (!this.isConfigured()) {
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ JIRA not configured. Would create task:\n- Summary: ${args.summary}\n- Parent: ${args.parent_story}`
          }
        ]
      };
    }

    try {
      const client = this.getClient();
      const response = await client.post('/rest/api/3/issue', {
        fields: {
          project: { key: this.projectKey },
          summary: args.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: (args.description as string) || 'Auto-generated automation task' }]
              }
            ]
          },
          issuetype: { name: 'Task' },
          labels: ['automation', 'auto-generated'],
          parent: { key: args.parent_story }
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Created JIRA task: ${response.data.key}\nURL: ${this.baseUrl}/browse/${response.data.key}`
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating JIRA task: ${err instanceof Error ? err.message : String(err)}`
          }
        ]
      };
    }
  }

  async updateTestResult(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    if (!this.isConfigured()) {
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ JIRA not configured. Would update ${args.issue_key} with status: ${args.status}`
          }
        ]
      };
    }

    try {
      const client = this.getClient();
      const emoji = args.status === 'PASS' ? '✅' : '❌';
      const comment = `${emoji} **Automated Test Result: ${args.status}**\n\n${args.comment || ''}\n\nExecution Time: ${args.execution_time_ms || 'N/A'}ms\nEnvironment: ${process.env.ENV || 'staging'}\nTimestamp: ${new Date().toISOString()}`;

      await client.post(`/rest/api/3/issue/${args.issue_key}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }]
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Updated JIRA issue ${args.issue_key} with test result: ${args.status}`
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating JIRA: ${err instanceof Error ? err.message : String(err)}`
          }
        ]
      };
    }
  }

  private formatStory(data: Record<string, unknown>): Record<string, unknown> {
    const fields = (data.fields as Record<string, unknown>) || {};
    return {
      key: data.key,
      summary: fields.summary,
      status: (fields.status as Record<string, unknown>)?.name,
      priority: (fields.priority as Record<string, unknown>)?.name,
      issueType: (fields.issuetype as Record<string, unknown>)?.name,
      assignee: (fields.assignee as Record<string, unknown>)?.displayName || 'Unassigned',
      labels: fields.labels,
      acceptanceCriteria: fields.customfield_10014
    };
  }

  private getMockStory(key: string): Record<string, unknown> {
    return {
      key: key || 'PROJ-123',
      summary: 'User can log in with valid credentials',
      status: 'In Progress',
      priority: 'High',
      issueType: 'Story',
      assignee: 'SDET Engineer',
      labels: ['authentication', 'login'],
      acceptanceCriteria: `
Given I am on the login page
When I enter valid email and password
Then I should be redirected to the dashboard
And I should see my name in the header

Given I am on the login page  
When I enter invalid credentials
Then I should see an error message
And I should remain on the login page
      `.trim()
    };
  }
}
