# Enterprise Automation Framework — Architecture Guide

## Overview

This framework follows a layered architecture pattern inspired by enterprise SDET best practices. Each layer has a single responsibility and communicates only with adjacent layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI TOOLING LAYER                           │
│   Claude Code  │  GitHub Copilot  │  MCP Server (15 tools)     │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                          │
│     CI/CD (GitHub Actions + Jenkins) │ Docker │ Reporting       │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     BDD LAYER (Cucumber)                        │
│              Feature Files → Step Definitions                   │
│              Hooks (Before/After) │ World Class                 │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   PAGE OBJECT LAYER                             │
│         BasePage (abstract) → LoginPage, DashboardPage ...      │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    UTILITY LAYER                                │
│   Logger │ AllureHelper │ JiraClient │ ApiHelper │ TestData     │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  CONFIGURATION LAYER                            │
│       ConfigManager (Singleton) │ .env.{ENV} │ test-data.json  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  PLAYWRIGHT LAYER                               │
│          Browser │ BrowserContext │ Page │ Locators            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Configuration Layer
- **ConfigManager** is a singleton that loads environment-specific config
- Reads from `.env.{ENV}` files (staging, dev, prod, local)
- All consumers call `configManager.get('key')` — never `process.env` directly
- Test data is loaded from `test-data.{ENV}.json` via **TestDataManager**

### 2. Utility Layer
| Utility | Purpose |
|---|---|
| `Logger` | Winston-based, colorized, log-level controlled |
| `AllureHelper` | Wraps allure-js-commons for steps, attachments, labels |
| `JiraClient` | Axios-based JIRA REST API v3 integration |
| `ApiHelper` | Generic HTTP client with auth token management |
| `TestDataManager` | Loads & manages test data per environment |

### 3. Page Object Layer
- `BasePage` is **abstract** — enforces `pageUrl` and `pageTitle` on all pages
- All interaction methods live in `BasePage` (click, fill, waitFor, etc.)
- Concrete pages only define locators and high-level business actions
- No `expect()` assertions in page objects — those belong in step definitions

### 4. BDD Layer
- Feature files are written in **Gherkin** and live in `features/{module}/`
- Step definitions are in `src/steps/{module}.steps.ts`
- **CustomWorld** (`src/hooks/world.ts`) holds per-scenario state:
  - `this.page` — Playwright Page
  - `this.browser` — Browser instance
  - `this.context` — BrowserContext
  - `this.testData` — Map for inter-step data sharing
  - `this.config` — Current environment config
- Hooks run Before/After each scenario for setup, teardown, artifact capture

### 5. MCP Server
15 AI-powered tools exposed via Model Context Protocol:
- **FileSystem**: Read/write project files, list features, get architecture
- **JIRA**: Get story, sprint stories, create automation task, update test result
- **Test Generation**: Generate feature files, page objects, step definitions, Playwright tests
- **Analysis**: Analyze failures, coverage gaps, generate report summaries

### 6. AI Tooling Layer
- **Claude Code** connects to the MCP Server to gain framework awareness
- **GitHub Copilot** provides inline suggestions based on project context
- Both tools are configured via `.vscode/settings.json` and `.claude.json`

---

## Data Flow: Story → Test → Report → JIRA

```
JIRA User Story (e.g. AUTH-123)
        │
        ▼
MCP: getStory('AUTH-123')
        │
        ▼
MCP: generateFeatureFile(story)
        │  → Creates features/auth/AUTH-123.feature
        ▼
MCP: generateStepDefinitions(feature)
        │  → Creates src/steps/auth-123.steps.ts
        ▼
MCP: generatePageObject('AuthPage')
        │  → Creates src/pages/auth.page.ts
        ▼
npm run test:regression
        │  → Cucumber runs scenarios
        │  → Allure collects results + screenshots
        │  → JIRA updated on failure (if JIRA_UPDATE_ON_FAILURE=true)
        ▼
Allure Report (http://localhost:9999)
        │
        ▼
MCP: generateReportSummary(results)
        │  → Posts summary comment on JIRA story
```

---

## Tag Strategy

| Tag | Purpose | When Run |
|---|---|---|
| `@smoke` | Critical path (5–10 tests) | Every commit/PR |
| `@regression` | Full suite (100+ tests) | Nightly, release |
| `@login` | Login module only | On auth changes |
| `@dashboard` | Dashboard module | On UI changes |
| `@api` | API integration tests | On API changes |
| `@accessibility` | A11y checks | Weekly |
| `@performance` | Perf thresholds | Before release |
| `@wip` | Work in progress | Manually only |

---

## Environment Matrix

| Environment | URL | Retry | Parallel | Headless |
|---|---|---|---|---|
| `local` | `localhost:3000` | 0 | 1 | `false` |
| `dev` | `dev.your-app.com` | 1 | 2 | `true` |
| `staging` | `staging.your-app.com` | 2 | 4 | `true` |
| `prod` | `your-app.com` | 3 | 2 | `true` |

---

## Adding a New Feature Module

1. Create feature file: `features/{module}/{module}.feature`
2. Create step definitions: `src/steps/{module}.steps.ts`
3. Create page object: `src/pages/{module}.page.ts`
4. Add test data in `src/config/test-data.staging.json`
5. Tag scenarios with `@{module}`
6. Run: `npm test -- --tags @{module}`

Or use the MCP Server tool `runFullWorkflow` to generate all of the above from a JIRA story!
