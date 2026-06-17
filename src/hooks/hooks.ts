import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  BeforeStep,
  AfterStep,
  Status,
  ITestCaseHookParameter,
  ITestStepHookParameter,
  setDefaultTimeout
} from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { Logger } from '@utils/logger';
import { AllureHelper } from '@utils/allure.helper';
import { JiraClient } from '@utils/jira.client';
import fs from 'fs';
import path from 'path';

const logger = new Logger('Hooks');
const allureHelper = new AllureHelper();
let executionStartTime: Date;

setDefaultTimeout(parseInt(process.env.TIMEOUT || '30000') + 10000);

// ============ BeforeAll ============
BeforeAll(async function () {
  executionStartTime = new Date();
  logger.info('═══════════════════════════════════════════');
  logger.info('  Enterprise Automation Framework Starting  ');
  logger.info('═══════════════════════════════════════════');
  logger.info(`Environment: ${process.env.ENV || 'staging'}`);
  logger.info(`Execution started at: ${executionStartTime.toISOString()}`);

  // Create necessary directories
  const dirs = [
    'reports/allure-results',
    'reports/screenshots',
    'reports/videos',
    'reports/traces',
    'reports/logs'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

// ============ AfterAll ============
AfterAll(async function () {
  const executionEndTime = new Date();
  const duration = (executionEndTime.getTime() - executionStartTime.getTime()) / 1000;

  logger.info('═══════════════════════════════════════════');
  logger.info('  Enterprise Automation Framework Complete  ');
  logger.info('═══════════════════════════════════════════');
  logger.info(`Total execution time: ${duration.toFixed(2)} seconds`);
  logger.info(`Reports available in: reports/`);
});

// ============ Before Each Scenario ============
Before(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  this.scenarioName = scenario.pickle.name;
  this.feature = scenario.pickle.uri;
  this.tags = scenario.pickle.tags.map(t => t.name);
  this.startTime = new Date();

  logger.info(`\n${'─'.repeat(60)}`);
  logger.info(`Scenario: ${this.scenarioName}`);
  logger.info(`Tags: ${this.tags.join(', ')}`);
  logger.info(`${'─'.repeat(60)}`);

  // Set Allure metadata
  allureHelper.addLabel('feature', path.basename(this.feature, '.feature'));
  allureHelper.addLabel('scenario', this.scenarioName);
  allureHelper.addLabel('environment', process.env.ENV || 'staging');

  this.tags.forEach(tag => allureHelper.addTag(tag));

  await this.openBrowser();
});

// ============ After Each Scenario ============
After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  const { result } = scenario;
  const duration = new Date().getTime() - this.startTime.getTime();

  if (result?.status === Status.FAILED) {
    logger.error(`FAILED: ${this.scenarioName}`);

    // Take failure screenshot
    try {
      const screenshot = await this.takeScreenshot(
        `FAILED-${this.scenarioName.replace(/\s+/g, '-')}`
      );
      allureHelper.addAttachment('Failure Screenshot', screenshot, 'image/png');
    } catch (err) {
      logger.error('Failed to capture screenshot:', err);
    }

    // Capture page source
    try {
      const pageSource = await this.page.content();
      allureHelper.addAttachment('Page Source', Buffer.from(pageSource), 'text/html');
    } catch (err) {
      logger.warn('Failed to capture page source:', err);
    }

    // Log error details
    if (result.message) {
      allureHelper.addAttachment('Error Details', Buffer.from(result.message), 'text/plain');
    }

    // Update JIRA if configured
    if (process.env.JIRA_UPDATE_ON_FAILURE === 'true' && process.env.JIRA_BASE_URL) {
      try {
        const jiraClient = new JiraClient();
        const jiraKey = this.tags.find(t => t.match(/^@[A-Z]+-\d+$/))?.replace('@', '');
        if (jiraKey) {
          await jiraClient.updateTestResult(jiraKey, {
            testKey: jiraKey,
            status: 'FAIL',
            comment: `Automated test FAILED: ${result.message?.substring(0, 500) || 'Unknown error'}`,
            executionTime: duration
          });
        }
      } catch (err) {
        logger.warn('Failed to update JIRA:', err);
      }
    }
  } else if (result?.status === Status.PASSED) {
    logger.info(`PASSED: ${this.scenarioName} (${duration}ms)`);
    allureHelper.addLabel('testStatus', 'passed');

    if (process.env.JIRA_UPDATE_ON_FAILURE === 'true' && process.env.JIRA_BASE_URL) {
      try {
        const jiraClient = new JiraClient();
        const jiraKey = this.tags.find(t => t.match(/^@[A-Z]+-\d+$/))?.replace('@', '');
        if (jiraKey) {
          await jiraClient.updateTestResult(jiraKey, {
            testKey: jiraKey,
            status: 'PASS',
            comment: `Automated test PASSED in ${duration}ms`,
            executionTime: duration
          });
        }
      } catch (err) {
        logger.warn('Failed to update JIRA:', err);
      }
    }
  } else {
    logger.warn(`${result?.status}: ${this.scenarioName}`);
  }

  await this.closeBrowser();
});

// ============ Before Each Step ============
BeforeStep(async function (this: CustomWorld, step: ITestStepHookParameter) {
  const stepText = step.pickleStep.text;
  logger.debug(`  → Step: ${stepText}`);
});

// ============ After Each Step (with screenshot on failure) ============
AfterStep(async function (this: CustomWorld, step: ITestStepHookParameter) {
  if (step.result?.status === Status.FAILED) {
    logger.error(`  ✗ Step failed: ${step.pickleStep.text}`);
  }
});

// ============ Tagged Hooks ============
Before({ tags: '@skip' }, async function (this: CustomWorld) {
  return 'skipped';
});

Before({ tags: '@api-only' }, async function (this: CustomWorld) {
  logger.info('API-only scenario — skipping browser setup');
});

Before({ tags: '@slow' }, async function (this: CustomWorld) {
  this.page?.setDefaultTimeout(60000);
});
