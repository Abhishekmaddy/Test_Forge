# 🚀 Enterprise Automation Framework

> A production-grade Playwright + TypeScript + Cucumber BDD automation framework with AI-powered test generation via Claude Code, GitHub Copilot, MCP Server, JIRA integration, and multi-environment CI/CD pipelines.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                   ENTERPRISE AUTOMATION FRAMEWORK                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐ │
│  │   AI Assistance  │    │  MCP Server       │    │  JIRA           │ │
│  │  ─────────────  │    │  ─────────────── │    │  Integration    │ │
│  │  Claude Code    │───▶│  • File Reader   │───▶│  • Read Stories │ │
│  │  GitHub Copilot │    │  • Test Gen      │    │  • Create Tasks │ │
│  │                 │    │  • JIRA Sync     │    │  • Post Results │ │
│  └─────────────────┘    │  • Failure Anal. │    └─────────────────┘ │
│                          └──────────────────┘                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              PLAYWRIGHT + CUCUMBER BDD CORE                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │ │
│  │  │ Features │  │  Steps   │  │  Pages   │  │    Hooks      │  │ │
│  │  │ (Gherkin)│→ │(TypeScript)→│(POM)    │  │  World Class  │  │ │
│  │  │ .feature │  │ .steps.ts│  │ .page.ts │  │  Before/After │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    UTILITIES & CONFIG                             │ │
│  │  Logger │ AllureHelper │ JiraClient │ ApiHelper │ TestDataMgr   │ │
│  │  ConfigManager │ TypeScript Types │ Environment Management       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐ │
│  │   Reporting  │    │     CI/CD        │    │     Docker          │ │
│  │  ─────────  │    │  ─────────────  │    │  ─────────────────  │ │
│  │  Allure      │    │  GitHub Actions  │    │  Containerized      │ │
│  │  Screenshots │    │  Jenkins         │    │  Execution          │ │
│  │  Videos      │    │  Pipeline        │    │  Allure Server      │ │
│  │  Traces      │    │                  │    │  Grid Support       │ │
│  └──────────────┘    └──────────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Folder Structure

```
enterprise-automation-framework/
│
├── 📁 src/
│   ├── 📁 pages/                    # Page Object Models (POM)
│   │   ├── base.page.ts             # Base class with 50+ reusable methods
│   │   ├── login.page.ts            # Login page POM
│   │   └── dashboard.page.ts        # Dashboard page POM
│   │
│   ├── 📁 steps/                    # Cucumber Step Definitions
│   │   └── login.steps.ts           # Login step definitions
│   │
│   ├── 📁 hooks/                    # Cucumber Hooks
│   │   ├── world.ts                 # Custom World (browser context)
│   │   └── hooks.ts                 # Before/After/BeforeAll/AfterAll
│   │
│   ├── 📁 utils/                    # Utility classes
│   │   ├── logger.ts                # Winston logger with file output
│   │   ├── allure.helper.ts         # Allure reporting helpers
│   │   ├── jira.client.ts           # JIRA REST API client
│   │   ├── api.helper.ts            # Axios-based API utility
│   │   └── test-data.manager.ts     # Test data loading/generation
│   │
│   ├── 📁 config/
│   │   ├── config.manager.ts        # Environment configuration singleton
│   │   └── test-data/               # JSON test data files per environment
│   │
│   └── 📁 types/
│       └── framework.types.ts       # TypeScript interfaces & types
│
├── 📁 features/                     # Gherkin BDD Feature Files
│   ├── 📁 login/
│   │   └── login.feature            # 14 login scenarios
│   ├── 📁 dashboard/
│   └── 📁 api/
│
├── 📁 mcp-server/                   # AI-powered MCP Server
│   ├── 📁 src/
│   │   ├── index.ts                 # MCP Server entry (15 tools)
│   │   └── 📁 tools/
│   │       ├── filesystem.tools.ts  # File read/write tools
│   │       ├── jira.tools.ts        # JIRA integration tools
│   │       ├── test-generation.tools.ts  # Code generation
│   │       └── analysis.tools.ts    # Failure analysis
│   └── package.json
│
├── 📁 .github/workflows/
│   └── automation.yml               # 5-job CI/CD pipeline
│
├── 📁 jenkins/
│   └── Jenkinsfile                  # Declarative Jenkins pipeline
│
├── 📁 docker/
│   ├── Dockerfile                   # Multi-stage Docker build
│   └── docker-compose.yml           # Full stack compose
│
├── 📁 .vscode/
│   └── settings.json               # IDE config with 20+ extensions
│
├── cucumber.config.ts               # Cucumber configuration
├── playwright.config.ts             # Playwright configuration
├── tsconfig.json                    # TypeScript configuration
├── .eslintrc.json                   # ESLint rules
├── .gitignore                       # Git ignore patterns
└── .claude.json                     # Claude Code / MCP config
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- Git
- Docker (optional)
- Java 17+ (for Allure CLI)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/enterprise-automation-framework.git
cd enterprise-automation-framework

# Install dependencies & browsers
npm run setup
```

### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.staging .env.local
# Edit .env.local with your values:
# - BASE_URL
# - TEST_USERNAME / TEST_PASSWORD
# - JIRA_BASE_URL / JIRA_API_TOKEN (optional)
```

### 3. Run Tests

```bash
# Smoke tests (quick sanity check)
npm run test:smoke

# Login tests
npm run test:login

# Full regression
npm run test:regression

# Parallel execution (4 workers)
npm run test:parallel

# Headed mode (see the browser)
npm run test:headed

# With specific tags
TAGS="@login and not @skip" npm test
```

### 4. Generate Report

```bash
# Generate Allure HTML report
npm run allure:generate

# Open report in browser
npm run allure:open

# Serve live during test run
npm run allure:serve
```

---

## 🤖 AI-Powered Workflow: JIRA → Test

### With Claude Code (Recommended)

1. **Install Claude Desktop** and connect this project via Claude Code
2. **Add MCP Server** - Claude automatically reads `.claude.json`
3. **Build MCP Server**: `npm run mcp:build`
4. **Use in Claude**: Ask Claude to automate JIRA stories:

```
"Generate a complete test automation for JIRA story PROJ-123"

"Analyze the test failures in reports/cucumber-report.json"

"Generate a feature file for the checkout flow"
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `read_project_files` | Read and browse framework files |
| `write_project_file` | Write generated code to project |
| `get_jira_story` | Fetch story + acceptance criteria |
| `get_jira_sprint_stories` | Get all sprint stories |
| `create_jira_automation_task` | Create sub-task for automation |
| `update_jira_test_result` | Post PASS/FAIL to JIRA |
| `generate_feature_file` | Auto-generate BDD feature |
| `generate_page_object` | Auto-generate Page Object class |
| `generate_step_definitions` | Auto-generate step defs |
| `generate_playwright_test` | Auto-generate Playwright spec |
| `full_automation_workflow` | End-to-end: JIRA → Code |
| `analyze_test_failures` | Root cause analysis + fixes |
| `analyze_test_coverage` | Coverage vs JIRA stories |
| `generate_test_report_summary` | Executive summary |

### Example: Full AI Workflow

```
Input:  JIRA Story PROJ-456 (User can reset password)
         ↓
Step 1: MCP fetches story + acceptance criteria from JIRA
         ↓
Step 2: Claude generates features/password/password-reset.feature
         ↓
Step 3: Claude generates src/steps/password-reset.steps.ts  
         ↓
Step 4: Claude generates src/pages/password-reset.page.ts
         ↓
Step 5: MCP creates JIRA sub-task PROJ-457 (Automation task)
         ↓
Step 6: npm test executes the generated tests
         ↓
Step 7: Allure report generated with results
         ↓
Step 8: MCP posts PASS/FAIL results to JIRA PROJ-456
```

---

## 📝 Writing Tests

### Feature File Pattern

```gherkin
@login @regression
Feature: User Login
  As a registered user
  I want to log in
  So that I can access my account

  Background:
    Given I am on the login page

  @smoke @critical
  Scenario: Successful login
    When I enter valid email "user@test.com"
    And I enter valid password "Pass123!"
    And I click the login button
    Then I should be redirected to the dashboard
```

### Page Object Pattern

```typescript
export class MyPage extends BasePage {
  protected pageUrl = `${config.baseUrl}/my-page`;
  protected pageTitle = 'My Page';

  private readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.locator('[data-testid="my-btn"]');
  }

  async clickMyButton(): Promise<void> {
    await this.click(this.myButton, 'My Button');
  }
}
```

### Step Definitions Pattern

```typescript
When('I click the submit button', async function (this: CustomWorld) {
  const page = new MyPage(this.page);
  await page.clickMyButton();
  allure.addStep('Clicked submit button');
});
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENV` | Environment (local/dev/staging/prod) | staging |
| `BASE_URL` | Application URL | - |
| `TEST_USERNAME` | Test user email | - |
| `TEST_PASSWORD` | Test user password | - |
| `BROWSER` | Browser (chromium/firefox/webkit) | chromium |
| `HEADED` | Run with visible browser | false |
| `PARALLEL` | Parallel workers | 4 |
| `RETRY` | Test retry count | 1 |
| `TAGS` | Cucumber tag filter | - |
| `JIRA_BASE_URL` | JIRA instance URL | - |
| `JIRA_API_TOKEN` | JIRA Personal Access Token | - |
| `JIRA_PROJECT_KEY` | JIRA project key | AUTO |

### Tag Strategy

```
@smoke        — 5-10 critical path tests, runs in < 5 min
@regression   — Full suite, runs in CI
@critical     — P1 scenarios, blocks deployment
@login        — Login/auth module
@dashboard    — Dashboard module
@api          — API-level tests
@negative     — Negative test cases
@security     — Security-related tests
@skip         — Temporarily disabled
@PROJ-123     — Linked to JIRA story
```

---

## 🐳 Docker Execution

```bash
cd docker

# Run smoke tests
docker compose --profile smoke up

# Run regression tests
docker compose --profile regression up

# Start Allure report server (port 5050)
docker compose --profile report up -d

# View reports at http://localhost:5252

# Build fresh image
docker compose build --no-cache

# Run all (test + report)
ENV=staging TAGS=@smoke docker compose --profile test --profile report up
```

---

## 🔄 CI/CD

### GitHub Actions

The pipeline has 5 jobs:

1. **Setup & Validate** — TypeScript check, lint, dry run
2. **Smoke Tests** — Fast critical path validation
3. **Regression Tests** — 4-shard parallel execution
4. **Allure Report** — Generate + publish to GitHub Pages
5. **Notify** — Slack + JIRA update

**Required Secrets:**
```
STAGING_BASE_URL      → Your app URL
TEST_USERNAME         → Test account email
TEST_PASSWORD         → Test account password
JIRA_BASE_URL         → https://company.atlassian.net
JIRA_API_TOKEN        → JIRA PAT token
SLACK_WEBHOOK_URL     → Slack incoming webhook
```

### Jenkins

```bash
# Create pipeline in Jenkins:
# 1. New Item → Pipeline
# 2. Pipeline → Definition: "Pipeline script from SCM"
# 3. SCM: Git, repo URL, branch: main
# 4. Script Path: jenkins/Jenkinsfile
# 5. Add credentials: staging-test-credentials, jira-api-token
```

---

## 📊 Reporting

Allure reports include:
- ✅ **Pass/Fail** status per scenario
- 📸 **Screenshots** on failure (auto-attached)
- 🎥 **Video recordings** (retained on failure)
- 🔍 **Playwright traces** (for debugging)
- 📋 **Step-by-step** execution log
- 🏷️ **Tags, severity, owner** metadata
- 🔗 **JIRA links** per test

---

## 🛠️ Troubleshooting

### Common Issues

**1. Browser launch fails in Docker**
```bash
# Run as root or add --no-sandbox
docker run --cap-add=SYS_ADMIN mcr.microsoft.com/playwright:v1.43.0-jammy
```

**2. TypeScript path aliases not resolving**
```bash
# Use ts-node with tsconfig-paths
npm install --save-dev tsconfig-paths
# Add to package.json scripts: NODE_OPTIONS='-r tsconfig-paths/register'
```

**3. Allure report empty**
```bash
# Check results directory
ls reports/allure-results/
# Regenerate
npm run allure:generate
```

**4. JIRA 401 Unauthorized**
```bash
# Verify token format (PAT vs Basic Auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-org.atlassian.net/rest/api/3/myself
```

**5. MCP Server not connecting**
```bash
# Build first
npm run mcp:build
# Check Claude Desktop logs
cat ~/.claude/logs/mcp.log
```

---

## 🏆 Best Practices

1. **One feature per module** — Keep features focused and small
2. **data-testid attributes** — Always prefer test IDs over CSS/XPath
3. **Avoid `page.waitForTimeout()`** — Use proper wait conditions
4. **Parallel-safe tests** — No shared state between scenarios
5. **Environment-agnostic** — Use config manager, never hardcode URLs
6. **Descriptive Gherkin** — Business language, not technical
7. **Page Object Single Responsibility** — One page = one class
8. **Tag everything** — Enable selective execution
9. **Secrets in vault** — Never commit credentials
10. **Review flaky tests** — Fix root cause, don't just retry

---

## 📚 Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| TypeScript | 5.4+ | Type safety |
| Playwright | 1.43+ | Browser automation |
| Cucumber | 10.3+ | BDD framework |
| Allure | 2.27+ | Test reporting |
| Winston | 3.13+ | Logging |
| Axios | 1.6+ | HTTP client |
| Docker | 24+ | Containerization |
| GitHub Actions | - | CI/CD |
| Jenkins | LTS | CI/CD (enterprise) |
| MCP SDK | 0.5+ | AI tool server |

---

*Built with ❤️ by the SDET Team | Enterprise Automation Framework v1.0.0*
