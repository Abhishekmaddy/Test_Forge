import { IConfiguration } from '@cucumber/cucumber/api';

// cucumber-js merges config `paths` additively with any CLI-provided path
// (see node_modules/@cucumber/cucumber/lib/configuration/merge_configurations.js),
// so a hardcoded default here would always run alongside an explicit file
// argument instead of being replaced by it. Only fall back to the full glob
// when no feature path was given on the CLI.
const cliPathGiven = process.argv
  .slice(2)
  .some((arg) => !arg.startsWith('-') && (arg.endsWith('.feature') || arg.includes('features/') || arg.includes('features\\')));

const config: Partial<IConfiguration> = {
  paths: cliPathGiven ? [] : ['features/**/*.feature'],
  import: [],
  require: [
    'src/hooks/*.ts',
    'src/steps/**/*.ts'
  ],
  requireModule: ['ts-node/register', 'tsconfig-paths/register'],
  format: [
    'progress-bar',
    `json:reports/cucumber-report.json`,
    `html:reports/cucumber-report.html`,
    'allure-cucumberjs/reporter'
  ],
  formatOptions: {
    resultsDir: 'reports/allure-results'
  },
  parallel: parseInt(process.env.PARALLEL || '1'),
  retry: parseInt(process.env.RETRY || '0'),
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
