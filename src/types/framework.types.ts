import { Browser, BrowserContext, Page } from '@playwright/test';
import { EnvironmentConfig } from '@config/config.manager';

// ============ World Context Types ============
export interface IWorld {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  scenarioName: string;
  startTime: Date;
  testData: Record<string, unknown>;
  feature: string;
  scenario: string;
  tags: string[];
  config: EnvironmentConfig;
}

// ============ JIRA Types ============
export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  issueType: string;
  assignee: string;
  reporter: string;
  labels: string[];
  acceptanceCriteria: string;
  epicLink?: string;
  sprint?: string;
}

export interface JiraTestResult {
  testKey: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'ABORTED';
  comment: string;
  executionTime?: number;
  evidence?: string[];
}

export interface JiraCreateIssue {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
  priority?: string;
  labels?: string[];
  assignee?: string;
}

// ============ Test Data Types ============
export interface LoginCredentials {
  username: string;
  password: string;
  expectedRole?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
  message?: string;
}

// ============ Page Object Types ============
export interface TableRow {
  [columnName: string]: string;
}

export interface FormField {
  name: string;
  value: string;
  type?: 'text' | 'password' | 'email' | 'select' | 'checkbox' | 'radio';
}

export interface NavigationItem {
  label: string;
  url?: string;
  selector: string;
}

// ============ Reporting Types ============
export interface AllureStep {
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  start: number;
  stop: number;
  attachments?: AllureAttachment[];
}

export interface AllureAttachment {
  name: string;
  type: 'image/png' | 'application/json' | 'text/plain' | 'video/webm';
  content: string;
}

// ============ Framework Types ============
export interface ScenarioResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  feature: string;
  tags: string[];
  error?: string;
  screenshot?: Buffer;
}

export interface ExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  environment: string;
  startTime: Date;
  endTime: Date;
  scenarios: ScenarioResult[];
}

// ============ MCP Server Types ============
export interface McpResource {
  name: string;
  uri: string;
  mimeType?: string;
  description?: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface TestGenerationRequest {
  jiraKey?: string;
  userStory?: string;
  acceptanceCriteria?: string[];
  pageName?: string;
  outputPath?: string;
}

export interface TestGenerationResult {
  featureFile?: string;
  stepDefinitions?: string;
  pageObject?: string;
  playwrightTest?: string;
  jiraTaskKey?: string;
}
