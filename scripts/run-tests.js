#!/usr/bin/env node
/**
 * Runs cucumber-js with the given arguments, then always regenerates the
 * static Allure HTML report (reports/allure-report) afterwards — whether the
 * run passed or failed — so the report on disk always reflects the latest run.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const cucumberArgs = process.argv.slice(2);

const testRun = spawnSync('npx', ['cucumber-js', ...cucumberArgs], {
  stdio: 'inherit',
  shell: true
});

const reportRun = spawnSync('node', [path.join(__dirname, 'allure-report.js'), 'generate'], {
  stdio: 'inherit',
  shell: true
});

if (reportRun.status !== 0) {
  console.error('⚠️  Allure report generation failed; see output above.');
}

process.exit(testRun.status ?? 1);
