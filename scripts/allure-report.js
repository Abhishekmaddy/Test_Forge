#!/usr/bin/env node
/**
 * Allure Report Generation Script
 * Generates and opens Allure reports after test execution
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALLURE_RESULTS = path.join(ROOT, 'reports/allure-results');
const ALLURE_REPORT = path.join(ROOT, 'reports/allure-report');

function run(cmd, options = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', cwd: options.cwd || ROOT });
    return true;
  } catch {
    return false;
  }
}

const args = process.argv.slice(2);
const mode = args[0] || 'serve';

// Ensure results directory exists
fs.mkdirSync(ALLURE_RESULTS, { recursive: true });

// Check if allure is available
const allureAvailable = run('allure --version', { silent: true }) ||
  run('npx allure --version', { silent: true });

const allureBin = 'npx allure';

switch (mode) {
  case 'generate':
    console.log('📊 Generating Allure report...');
    run(`${allureBin} generate ${ALLURE_RESULTS} --clean -o ${ALLURE_REPORT}`);
    console.log(`✅ Report generated at: ${ALLURE_REPORT}`);
    break;

  case 'open':
    console.log('🌐 Opening Allure report...');
    run(`${allureBin} open ${ALLURE_REPORT}`);
    break;

  case 'serve':
  default:
    console.log('🚀 Starting Allure report server...');
    run(`${allureBin} serve ${ALLURE_RESULTS} --port 9999`);
    break;
}
