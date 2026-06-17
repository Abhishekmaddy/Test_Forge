import { IConfiguration } from '@cucumber/cucumber/api';

const config: Partial<IConfiguration> = {
  paths: ['features/**/*.feature'],
  import: [],
  require: [
    'src/hooks/*.ts',
    'src/steps/**/*.ts'
  ],
  requireModule: ['ts-node/register', 'tsconfig-paths/register'],
  format: [
    'progress-bar',
    `json:reports/cucumber-report.json`,
    `html:reports/cucumber-report.html`
  ],
  formatOptions: {
    resultsDir: 'reports/allure-results'
  },
  parallel: parseInt(process.env.PARALLEL || '1'),
  retry: parseInt(process.env.RETRY || '1'),
  // Cucumber IConfiguration does not include a top-level `timeout` property.
  // If you need to control step timeouts, set them in the step definitions or
  // via the testing framework (e.g., Mocha/Jest) you use alongside Cucumber.
  tags: process.env.TAGS || '',
  dryRun: false,
  failFast: false,
  strict: true,
  worldParameters: {
    baseUrl: process.env.BASE_URL || 'https://your-app.com',
    env: process.env.ENV || 'staging'
  }
};

export default config;
