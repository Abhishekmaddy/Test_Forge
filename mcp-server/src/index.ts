#!/usr/bin/env node
/**
 * Enterprise Automation MCP Server
 * Provides AI-powered tools for test generation, JIRA integration,
 * and framework maintenance via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { FileSystemTools } from './tools/filesystem.tools';
import { JiraTools } from './tools/jira.tools';
import { TestGenerationTools } from './tools/test-generation.tools';
import { AnalysisTools } from './tools/analysis.tools';

dotenv.config();

const VERSION = '1.0.0';
const SERVER_NAME = 'enterprise-automation-mcp';

class AutomationMcpServer {
  private server: Server;
  private fsTools: FileSystemTools;
  private jiraTools: JiraTools;
  private testGenTools: TestGenerationTools;
  private analysisTools: AnalysisTools;

  constructor() {
    this.server = new Server(
      { name: SERVER_NAME, version: VERSION },
      { capabilities: { tools: {}, resources: {} } }
    );

    this.fsTools = new FileSystemTools();
    this.jiraTools = new JiraTools();
    this.testGenTools = new TestGenerationTools();
    this.analysisTools = new AnalysisTools();

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getAllTools()
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      console.error(`[MCP] Tool called: ${name}`);

      return await this.dispatchTool(name, args as Record<string, unknown>);
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.getAllResources()
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;
      return await this.readResource(uri);
    });
  }

  private getAllTools(): Tool[] {
    return [
      // File System Tools
      {
        name: 'read_project_files',
        description: 'Read and list project files for context and analysis',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory or file path relative to project root' },
            pattern: { type: 'string', description: 'Glob pattern to filter files (e.g., "**/*.feature")' },
            include_content: { type: 'boolean', description: 'Include file contents in response' }
          },
          required: ['path']
        }
      },
      {
        name: 'write_project_file',
        description: 'Write a new file to the project',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path relative to project root' },
            content: { type: 'string', description: 'File content to write' },
            overwrite: { type: 'boolean', description: 'Whether to overwrite existing file' }
          },
          required: ['path', 'content']
        }
      },

      // JIRA Tools
      {
        name: 'get_jira_story',
        description: 'Fetch a JIRA user story with acceptance criteria',
        inputSchema: {
          type: 'object',
          properties: {
            issue_key: { type: 'string', description: 'JIRA issue key (e.g., PROJ-123)' }
          },
          required: ['issue_key']
        }
      },
      {
        name: 'get_jira_sprint_stories',
        description: 'Get all stories in a JIRA sprint',
        inputSchema: {
          type: 'object',
          properties: {
            sprint_id: { type: 'number', description: 'Sprint ID' },
            project_key: { type: 'string', description: 'JIRA project key' }
          },
          required: ['sprint_id']
        }
      },
      {
        name: 'create_jira_automation_task',
        description: 'Create a JIRA task for automation work',
        inputSchema: {
          type: 'object',
          properties: {
            parent_story: { type: 'string', description: 'Parent story key to link to' },
            summary: { type: 'string', description: 'Task summary' },
            description: { type: 'string', description: 'Task description' },
            assignee: { type: 'string', description: 'Assignee username' }
          },
          required: ['parent_story', 'summary']
        }
      },
      {
        name: 'update_jira_test_result',
        description: 'Update JIRA issue with test execution results',
        inputSchema: {
          type: 'object',
          properties: {
            issue_key: { type: 'string', description: 'JIRA issue key' },
            status: { type: 'string', enum: ['PASS', 'FAIL', 'BLOCKED'], description: 'Test status' },
            comment: { type: 'string', description: 'Execution comment with details' },
            execution_time_ms: { type: 'number', description: 'Execution time in milliseconds' }
          },
          required: ['issue_key', 'status']
        }
      },

      // Test Generation Tools
      {
        name: 'generate_feature_file',
        description: 'Generate a Cucumber BDD feature file from a user story or requirements',
        inputSchema: {
          type: 'object',
          properties: {
            jira_key: { type: 'string', description: 'JIRA key to generate from' },
            user_story: { type: 'string', description: 'User story text' },
            acceptance_criteria: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of acceptance criteria'
            },
            output_path: { type: 'string', description: 'Output path for the feature file' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags to add to feature' }
          }
        }
      },
      {
        name: 'generate_page_object',
        description: 'Generate a TypeScript Page Object class for a given page',
        inputSchema: {
          type: 'object',
          properties: {
            page_name: { type: 'string', description: 'Name of the page (e.g., "LoginPage")' },
            page_url: { type: 'string', description: 'URL path for the page' },
            elements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  selector: { type: 'string' },
                  type: { type: 'string', enum: ['input', 'button', 'link', 'text', 'dropdown', 'checkbox'] }
                }
              },
              description: 'UI elements on the page'
            },
            output_path: { type: 'string', description: 'Output file path' }
          },
          required: ['page_name']
        }
      },
      {
        name: 'generate_step_definitions',
        description: 'Generate Cucumber step definitions from a feature file',
        inputSchema: {
          type: 'object',
          properties: {
            feature_file_path: { type: 'string', description: 'Path to the feature file' },
            page_objects: { type: 'array', items: { type: 'string' }, description: 'Page objects to import' },
            output_path: { type: 'string', description: 'Output file path for step definitions' }
          },
          required: ['feature_file_path']
        }
      },
      {
        name: 'generate_playwright_test',
        description: 'Generate a standalone Playwright test file',
        inputSchema: {
          type: 'object',
          properties: {
            test_name: { type: 'string', description: 'Name of the test suite' },
            test_cases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  steps: { type: 'array', items: { type: 'string' } },
                  assertions: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            page_object: { type: 'string', description: 'Page object class to use' },
            output_path: { type: 'string', description: 'Output file path' }
          },
          required: ['test_name']
        }
      },
      {
        name: 'full_automation_workflow',
        description: 'Complete workflow: JIRA Story → Feature File → Steps → Test → Results',
        inputSchema: {
          type: 'object',
          properties: {
            jira_key: { type: 'string', description: 'JIRA story key to automate' },
            output_dir: { type: 'string', description: 'Output directory for generated files' }
          },
          required: ['jira_key']
        }
      },

      // Analysis Tools
      {
        name: 'analyze_test_failures',
        description: 'Analyze test failure reports and provide root cause analysis with fix suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            report_path: { type: 'string', description: 'Path to test report (JSON/HTML)' },
            failure_log: { type: 'string', description: 'Failure log content to analyze' },
            include_suggestions: { type: 'boolean', description: 'Include fix suggestions' }
          }
        }
      },
      {
        name: 'analyze_test_coverage',
        description: 'Analyze test coverage against JIRA stories',
        inputSchema: {
          type: 'object',
          properties: {
            project_key: { type: 'string', description: 'JIRA project key' },
            features_dir: { type: 'string', description: 'Directory containing feature files' }
          },
          required: ['project_key']
        }
      },
      {
        name: 'generate_test_report_summary',
        description: 'Generate a human-readable test execution summary',
        inputSchema: {
          type: 'object',
          properties: {
            report_path: { type: 'string', description: 'Path to Allure or Cucumber JSON report' },
            format: { type: 'string', enum: ['markdown', 'html', 'text'], description: 'Output format' },
            send_to_jira: { type: 'boolean', description: 'Whether to post summary to JIRA' }
          },
          required: ['report_path']
        }
      }
    ];
  }

  private getAllResources(): Resource[] {
    return [
      {
        uri: 'file://framework/architecture',
        name: 'Framework Architecture',
        description: 'Complete framework structure and component overview',
        mimeType: 'text/markdown'
      },
      {
        uri: 'file://framework/features',
        name: 'Feature Files',
        description: 'All BDD feature files in the framework',
        mimeType: 'text/plain'
      },
      {
        uri: 'file://framework/pages',
        name: 'Page Objects',
        description: 'All Page Object Model files',
        mimeType: 'text/plain'
      },
      {
        uri: 'file://framework/test-results',
        name: 'Test Results',
        description: 'Latest test execution results',
        mimeType: 'application/json'
      }
    ];
  }

  private async dispatchTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    switch (name) {
      // File System
      case 'read_project_files':
        return await this.fsTools.readProjectFiles(args);
      case 'write_project_file':
        return await this.fsTools.writeProjectFile(args);

      // JIRA
      case 'get_jira_story':
        return await this.jiraTools.getStory(args);
      case 'get_jira_sprint_stories':
        return await this.jiraTools.getSprintStories(args);
      case 'create_jira_automation_task':
        return await this.jiraTools.createAutomationTask(args);
      case 'update_jira_test_result':
        return await this.jiraTools.updateTestResult(args);

      // Test Generation
      case 'generate_feature_file':
        return await this.testGenTools.generateFeatureFile(args);
      case 'generate_page_object':
        return await this.testGenTools.generatePageObject(args);
      case 'generate_step_definitions':
        return await this.testGenTools.generateStepDefinitions(args);
      case 'generate_playwright_test':
        return await this.testGenTools.generatePlaywrightTest(args);
      case 'full_automation_workflow':
        return await this.testGenTools.runFullWorkflow(args);

      // Analysis
      case 'analyze_test_failures':
        return await this.analysisTools.analyzeFailures(args);
      case 'analyze_test_coverage':
        return await this.analysisTools.analyzeCoverage(args);
      case 'generate_test_report_summary':
        return await this.analysisTools.generateReportSummary(args);

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }]
        };
    }
  }

  private async readResource(
    uri: string
  ): Promise<{ contents: { uri: string; mimeType: string; text: string }[] }> {
    switch (uri) {
      case 'file://framework/architecture':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: await this.fsTools.getArchitectureOverview()
            }
          ]
        };
      case 'file://framework/features':
        const features = await this.fsTools.listFeatureFiles();
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: features
            }
          ]
        };
      default:
        return {
          contents: [{ uri, mimeType: 'text/plain', text: 'Resource not found' }]
        };
    }
  }

  private setupErrorHandling(): void {
    this.server.onerror = error => {
      console.error('[MCP Server Error]:', error);
    };

    process.on('SIGINT', async () => {
      console.error('[MCP] Shutting down...');
      await this.server.close();
      process.exit(0);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`[MCP] ${SERVER_NAME} v${VERSION} started on stdio`);
  }
}

const server = new AutomationMcpServer();
server.start().catch(err => {
  console.error('[MCP] Fatal error:', err);
  process.exit(1);
});
