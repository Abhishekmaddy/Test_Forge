import dotenv from 'dotenv';
import path from 'path';

export type Environment = 'local' | 'dev' | 'staging' | 'prod';

export interface EnvironmentConfig {
  baseUrl: string;
  apiBaseUrl: string;
  jiraBaseUrl: string;
  jiraApiToken: string;
  jiraProjectKey: string;
  username: string;
  password: string;
  headless: boolean;
  timeout: number;
  retries: number;
  parallel: number;
  browser: string;
  logLevel: string;
}

const defaultConfig: Partial<EnvironmentConfig> = {
  headless: true,
  timeout: 30000,
  retries: 1,
  parallel: 1,
  browser: 'chromium',
  logLevel: 'info'
};

const environmentConfigs: Record<Environment, Partial<EnvironmentConfig>> = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiBaseUrl: 'http://localhost:3001/api',
    headless: false,
    timeout: 60000,
    retries: 0
  },
  dev: {
    baseUrl: 'https://dev.your-app.com',
    apiBaseUrl: 'https://dev-api.your-app.com',
    timeout: 30000,
    retries: 1
  },
  staging: {
    baseUrl: 'https://staging.your-app.com',
    apiBaseUrl: 'https://staging-api.your-app.com',
    timeout: 30000,
    retries: 2,
    parallel: 4
  },
  prod: {
    baseUrl: 'https://your-app.com',
    apiBaseUrl: 'https://api.your-app.com',
    timeout: 45000,
    retries: 3,
    parallel: 2
  }
};

class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvironmentConfig;

  private constructor() {
    const env = (process.env.ENV || 'staging') as Environment;
    const envFile = path.resolve(process.cwd(), `.env.${env}`);

    // Load environment-specific .env file
    dotenv.config({ path: envFile });
    // Load base .env as fallback
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });

    this.config = this.buildConfig(env);
  }

  private buildConfig(env: Environment): EnvironmentConfig {
    const envSpecific = environmentConfigs[env] || {};

    return {
      ...defaultConfig,
      ...envSpecific,
      // Override with environment variables
      baseUrl: process.env.BASE_URL || envSpecific.baseUrl || 'https://your-app.com',
      apiBaseUrl: process.env.API_BASE_URL || envSpecific.apiBaseUrl || '',
      jiraBaseUrl: process.env.JIRA_BASE_URL || '',
      jiraApiToken: process.env.JIRA_API_TOKEN || '',
      jiraProjectKey: process.env.JIRA_PROJECT_KEY || 'AUTO',
      username: process.env.TEST_USERNAME || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'password123',
      headless: process.env.HEADED !== 'true',
      timeout: parseInt(process.env.TIMEOUT || String(envSpecific.timeout || 30000)),
      retries: parseInt(process.env.RETRY || String(envSpecific.retries || 1)),
      parallel: parseInt(process.env.PARALLEL || String(envSpecific.parallel || 1)),
      browser: process.env.BROWSER || 'chromium',
      logLevel: process.env.LOG_LEVEL || 'info'
    } as EnvironmentConfig;
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  getEnv(): Environment {
    return (process.env.ENV || 'staging') as Environment;
  }
}

export const configManager = ConfigManager.getInstance();
export const config = configManager.getAll();
