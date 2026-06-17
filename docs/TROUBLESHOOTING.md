# Troubleshooting Guide

## Common Issues & Fixes

---

### 1. `Cannot find module '@pages/...'` or `@utils/...`

**Cause**: TypeScript path aliases not resolved by ts-node.

**Fix**: Ensure `tsconfig.json` has the path mappings AND `cucumber.config.ts` uses `ts-node/esm` or the `require` paths are set. Also verify `tsconfig.json` `paths` and `baseUrl` are correct:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["src/pages/*"],
      "@utils/*": ["src/utils/*"],
      "@steps/*": ["src/steps/*"],
      "@hooks/*": ["src/hooks/*"],
      "@config/*": ["src/config/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```
And in `cucumber.config.ts`:
```ts
require: ['--require-module ts-node/register']
```

---

### 2. `Playwright browser not found`

**Cause**: Browsers not installed.

**Fix**:
```bash
npx playwright install --with-deps
# Or for specific browser:
npx playwright install chromium
```

---

### 3. Tests run but no Allure results

**Cause**: Allure formatter not configured in Cucumber or wrong path.

**Fix**: In `cucumber.config.ts`, verify:
```ts
format: [
  `allure-cucumberjs/reporter:./reports/allure-results`
]
```
Then generate:
```bash
npm run allure:serve
```

---

### 4. `JIRA API 401 Unauthorized`

**Cause**: Incorrect or expired JIRA API token.

**Fix**:
1. Generate a new API token at: `https://id.atlassian.com/manage-profile/security/api-tokens`
2. Update `.env.staging`:
   ```
   JIRA_API_TOKEN=your-new-token
   JIRA_EMAIL=your-email@company.com
   ```
3. Token is used as Basic Auth: `email:token` (base64)

---

### 5. `Page.click: Timeout 30000ms exceeded`

**Cause**: Element not found or page not loaded.

**Fix**:
- Verify `data-testid` attributes exist in the app HTML
- Increase timeout in `.env.staging`: `TIMEOUT=60000`
- Use `page.locator(...).waitFor({ state: 'visible', timeout: 60000 })`
- Check network in video/trace: `npx playwright show-trace reports/traces/trace.zip`

---

### 6. `MCP Server: ENOENT: no such file or directory`

**Cause**: MCP server not built.

**Fix**:
```bash
cd mcp-server
npm install
npm run build
cd ..
```

---

### 7. GitHub Actions workflow failing on `npm install`

**Cause**: Node version mismatch or lock file issues.

**Fix**: Ensure `package-lock.json` is committed. Set Node version in workflow:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

---

### 8. Docker container exits immediately

**Cause**: `BASE_URL` not set or container can't reach the app.

**Fix**:
```bash
# Pass env vars when running
docker-compose run -e BASE_URL=https://your-app.com automation
```
Or update `docker-compose.yml` environment section.

---

### 9. `Cannot read property 'page' of undefined` in steps

**Cause**: Page not initialized in World class.

**Fix**: Ensure `Before` hook in `hooks.ts` opens the browser before each scenario:
```ts
Before(async function (this: CustomWorld) {
  await this.openBrowser();
});
```

---

### 10. Tests flaky in CI but pass locally

**Cause**: Timing, network latency, or different viewport.

**Fixes**:
- Add `await page.waitForLoadState('networkidle')` after navigation
- Use `expect(locator).toBeVisible({ timeout: 10000 })`
- Set CI-specific timeout in GitHub Actions env: `TIMEOUT=60000`
- Enable trace on first retry in `playwright.config.ts`:
  ```ts
  trace: 'on-first-retry'
  ```
- Check screenshot/video in `reports/` directory

---

### 11. Cucumber step definitions not found

**Cause**: Step files not in the `require` glob.

**Fix**: In `cucumber.config.ts`, verify:
```ts
require: ['src/steps/**/*.steps.ts', 'src/hooks/*.ts']
```

---

### 12. `allure generate` not found

**Cause**: Allure CLI not installed globally.

**Fix**:
```bash
npm install -g allure-commandline
# OR use npx:
npx allure generate reports/allure-results --clean -o reports/allure-report
```

---

## Debug Commands

```bash
# Run a single feature file
npx cucumber-js features/login/login.feature

# Run with specific tag + verbose output
npx cucumber-js --tags @smoke --format progress

# Run Playwright tests with UI
npx playwright test --ui

# Show Playwright trace
npx playwright show-trace reports/traces/trace.zip

# Check TypeScript compilation
npx tsc --noEmit

# Lint code
npm run lint

# See all available Cucumber steps
npx cucumber-js --dry-run

# Docker: Run smoke tests
docker-compose run automation npm run test:smoke
```

---

## Logging

Set log level via environment variable:
```bash
LOG_LEVEL=debug npm test
```

Levels: `error` | `warn` | `info` | `http` | `verbose` | `debug` | `silly`

Logs are written to:
- Console (colorized)
- `reports/logs/combined.log` (all levels)
- `reports/logs/error.log` (errors only)

---

## Getting Help

1. Check `reports/allure-report` for detailed failure info (screenshots, video, trace)
2. Check `reports/logs/combined.log` for Winston logs
3. Open `reports/traces/` in Playwright Trace Viewer: `npx playwright show-trace`
4. File a ticket in JIRA with the test name, environment, and log snippet
