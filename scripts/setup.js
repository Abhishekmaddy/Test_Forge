#!/usr/bin/env node
/**
 * Enterprise Automation Framework Setup Script
 * Validates environment, installs dependencies, and verifies the setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

function run(cmd, options = {}) {
  try {
    execSync(cmd, { stdio: options.silent ? 'pipe' : 'inherit', cwd: options.cwd || ROOT });
    return true;
  } catch (err) {
    return false;
  }
}

function checkNodeVersion() {
  log.title('Checking Node.js Version');
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1));
  if (major < 18) {
    log.error(`Node.js 18+ required. Found: ${nodeVersion}`);
    process.exit(1);
  }
  log.success(`Node.js version: ${nodeVersion}`);
}

function installDependencies() {
  log.title('Installing Main Framework Dependencies');
  const success = run('npm install');
  if (success) {
    log.success('Main dependencies installed');
  } else {
    log.error('Failed to install main dependencies');
    process.exit(1);
  }
}

function installMcpDependencies() {
  log.title('Installing MCP Server Dependencies');
  const mcpDir = path.join(ROOT, 'mcp-server');
  if (fs.existsSync(mcpDir)) {
    const success = run('npm install', { cwd: mcpDir });
    if (success) {
      log.success('MCP server dependencies installed');
    } else {
      log.warn('MCP server dependency installation failed (non-critical)');
    }
  } else {
    log.warn('MCP server directory not found — skipping');
  }
}

function installPlaywrightBrowsers() {
  log.title('Installing Playwright Browsers');
  log.info('This may take several minutes...');
  const success = run('npx playwright install --with-deps chromium firefox webkit');
  if (success) {
    log.success('Playwright browsers installed');
  } else {
    log.error('Failed to install Playwright browsers');
    process.exit(1);
  }
}

function buildMcpServer() {
  log.title('Building MCP Server');
  const mcpDir = path.join(ROOT, 'mcp-server');
  if (fs.existsSync(mcpDir)) {
    const success = run('npm run build', { cwd: mcpDir });
    if (success) {
      log.success('MCP server built successfully');
    } else {
      log.warn('MCP server build failed (non-critical)');
    }
  }
}

function createEnvFile() {
  log.title('Creating Environment Configuration');
  const envFile = path.join(ROOT, '.env.staging');
  if (!fs.existsSync(envFile)) {
    const template = `# Staging Environment Configuration
ENV=staging
BASE_URL=https://staging.your-app.com
API_BASE_URL=https://staging-api.your-app.com

# Test Credentials
TEST_USERNAME=test@example.com
TEST_PASSWORD=TestPass@123

# Browser Settings
BROWSER=chromium
HEADED=false
TIMEOUT=30000
RETRY=2
PARALLEL=4

# JIRA Integration
JIRA_BASE_URL=https://your-org.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=AUTO
JIRA_UPDATE_ON_FAILURE=false

# Allure
ALLURE_RESULTS_DIR=reports/allure-results

# MCP Server
MCP_SERVER_PORT=3456
`;
    fs.writeFileSync(envFile, template);
    log.success(`.env.staging created — update with real values`);
  } else {
    log.info('.env.staging already exists — skipping');
  }
}

function createReportDirs() {
  log.title('Creating Report Directories');
  const dirs = [
    'reports/allure-results',
    'reports/allure-report',
    'reports/screenshots',
    'reports/videos',
    'reports/traces',
    'reports/logs'
  ];
  for (const dir of dirs) {
    const fullPath = path.join(ROOT, dir);
    fs.mkdirSync(fullPath, { recursive: true });
    log.success(`Created: ${dir}`);
  }
}

function verifySetup() {
  log.title('Verifying Setup');
  const checks = [
    { label: 'TypeScript config', path: 'tsconfig.json' },
    { label: 'Cucumber config', path: 'cucumber.config.ts' },
    { label: 'Playwright config', path: 'playwright.config.ts' },
    { label: 'Login feature', path: 'features/login/login.feature' },
    { label: 'BasePage', path: 'src/pages/base.page.ts' },
    { label: 'LoginPage', path: 'src/pages/login.page.ts' },
    { label: 'Login steps', path: 'src/steps/login.steps.ts' },
    { label: 'World class', path: 'src/hooks/world.ts' },
    { label: 'Hooks', path: 'src/hooks/hooks.ts' },
    { label: 'MCP Server', path: 'mcp-server/src/index.ts' },
    { label: 'GitHub Actions', path: '.github/workflows/automation.yml' },
    { label: 'Jenkinsfile', path: 'jenkins/Jenkinsfile' },
    { label: 'Dockerfile', path: 'docker/Dockerfile' }
  ];

  let allGood = true;
  for (const check of checks) {
    const exists = fs.existsSync(path.join(ROOT, check.path));
    if (exists) {
      log.success(check.label);
    } else {
      log.error(`Missing: ${check.label} (${check.path})`);
      allGood = false;
    }
  }
  return allGood;
}

function printNextSteps() {
  console.log(`
${colors.bold}${colors.green}
╔══════════════════════════════════════════════════════════════╗
║          ✅  SETUP COMPLETE! NEXT STEPS:                     ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}

${colors.cyan}1. Configure your environment:${colors.reset}
   Edit ${colors.yellow}.env.staging${colors.reset} with real BASE_URL, credentials, JIRA token

${colors.cyan}2. Run smoke tests:${colors.reset}
   ${colors.yellow}npm run test:smoke${colors.reset}

${colors.cyan}3. Run all tests:${colors.reset}
   ${colors.yellow}npm test${colors.reset}

${colors.cyan}4. Generate Allure report:${colors.reset}
   ${colors.yellow}npm run allure:serve${colors.reset}

${colors.cyan}5. Start MCP Server (for Claude Code):${colors.reset}
   ${colors.yellow}npm run mcp:start${colors.reset}

${colors.cyan}6. Run in Docker:${colors.reset}
   ${colors.yellow}cd docker && docker-compose up automation${colors.reset}

${colors.cyan}Documentation:${colors.reset} See README.md for full details
`);
}

// ── MAIN ──────────────────────────────────────────────────────
(async () => {
  console.log(`
${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║    Enterprise Automation Framework — Setup Script            ║
║    Playwright + TypeScript + Cucumber + MCP + JIRA           ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);

  checkNodeVersion();
  createEnvFile();
  createReportDirs();
  installDependencies();
  installMcpDependencies();
  installPlaywrightBrowsers();
  buildMcpServer();

  const verified = verifySetup();
  if (!verified) {
    log.error('Some files are missing. Framework may not work correctly.');
    process.exit(1);
  }

  printNextSteps();
})();
