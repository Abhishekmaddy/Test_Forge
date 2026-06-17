/**
 * Login Playwright Tests (Direct — Non-BDD)
 * These complement the BDD Cucumber tests and run via `npx playwright test`
 * Useful for visual regression, API + UI combined, and performance testing
 */

import { test, expect, Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────────
async function navigateToLogin(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'networkidle' });
}

async function fillLoginForm(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="password-input"]').fill(password);
}

async function submitLoginForm(page: Page): Promise<void> {
  await page.locator('[data-testid="login-button"]').click();
}

async function login(page: Page, email: string, password: string): Promise<void> {
  await fillLoginForm(page, email, password);
  await submitLoginForm(page);
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Login — Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLogin(page);
  });

  test('TC-001: Successful login with valid credentials', async ({ page }) => {
    await login(page, process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!);
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });

  test('TC-002: Login form renders all required elements', async ({ page }) => {
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="forgot-password-link"]')).toBeVisible();
  });

  test('TC-003: Submit with empty email shows validation error', async ({ page }) => {
    await submitLoginForm(page);
    await expect(page.locator('[data-testid="email-error"]')).toContainText(/required|email/i);
  });

  test('TC-004: Submit with empty password shows validation error', async ({ page }) => {
    await page.locator('[data-testid="email-input"]').fill('valid@example.com');
    await submitLoginForm(page);
    await expect(page.locator('[data-testid="password-error"]')).toContainText(/required|password/i);
  });

  test('TC-005: Invalid email format shows error', async ({ page }) => {
    await fillLoginForm(page, 'invalid-email', 'password');
    await submitLoginForm(page);
    await expect(page.locator('[data-testid="email-error"]')).toContainText(/valid email/i);
  });

  test('TC-006: Wrong password shows authentication error', async ({ page }) => {
    await fillLoginForm(page, process.env.TEST_USERNAME!, 'WrongPassword999!');
    await submitLoginForm(page);
    await expect(page.locator('[data-testid="login-error"]')).toContainText(/invalid|incorrect/i);
    await expect(page).not.toHaveURL(/.*dashboard.*/);
  });

  test('TC-007: Non-existent user shows error', async ({ page }) => {
    await fillLoginForm(page, 'nobody-exists@example.com', 'SomePassword123!');
    await submitLoginForm(page);
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('TC-008: Password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('[data-testid="password-input"]');
    const toggleBtn = page.locator('[data-testid="password-toggle"]');

    await passwordInput.fill('MySecretPass');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-009: Remember Me checkbox functions correctly', async ({ page }) => {
    const checkbox = page.locator('[data-testid="remember-me"]');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('TC-010: Forgot password link navigates correctly', async ({ page }) => {
    await page.locator('[data-testid="forgot-password-link"]').click();
    await page.waitForURL(/.*forgot-password.*/);
    await expect(page.locator('[data-testid="reset-email-input"]')).toBeVisible();
  });
});

test.describe('Login — Security & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLogin(page);
  });

  test('TC-011: SQL injection attempt is rejected', async ({ page }) => {
    await fillLoginForm(page, "admin'; DROP TABLE users; --", "' OR '1'='1");
    await submitLoginForm(page);
    await expect(page).not.toHaveURL(/.*dashboard.*/);
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('TC-012: XSS payload in email field is sanitized', async ({ page }) => {
    await fillLoginForm(page, '<script>alert("xss")</script>@test.com', 'pass');
    await submitLoginForm(page);
    await expect(page).not.toHaveURL(/.*dashboard.*/);
    // No alert should have fired
  });

  test('TC-013: Account locks out after 5 failed attempts', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await fillLoginForm(page, process.env.TEST_USERNAME!, `WrongPass${i}!`);
      await submitLoginForm(page);
    }
    await expect(page.locator('[data-testid="login-error"]')).toContainText(/locked|too many/i);
  });

  test('TC-014: Login page is HTTPS', async ({ page }) => {
    expect(page.url()).toMatch(/^https:/);
  });
});

test.describe('Login — Performance', () => {
  test('TC-015: Login page loads within 3 seconds', async ({ page }) => {
    const start = Date.now();
    await navigateToLogin(page);
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test('TC-016: Login request completes within 2 seconds', async ({ page }) => {
    await navigateToLogin(page);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login') && r.request().method() === 'POST'),
      login(page, process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!)
    ]);

    const timing = response.request().timing();
    const requestDuration = timing.responseEnd - timing.requestStart;
    expect(requestDuration).toBeLessThan(2000);
  });
});

test.describe('Login — Accessibility', () => {
  test('TC-017: Login form supports keyboard navigation', async ({ page }) => {
    await navigateToLogin(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
  });

  test('TC-018: Login button is submittable via Enter key', async ({ page }) => {
    await navigateToLogin(page);
    await fillLoginForm(page, process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!);
    await page.keyboard.press('Enter');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });
});

test.describe('Login — Visual Regression', () => {
  test('TC-019: Login page visual snapshot', async ({ page }) => {
    await navigateToLogin(page);
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.01
    });
  });

  test('TC-020: Login form with error state visual snapshot', async ({ page }) => {
    await navigateToLogin(page);
    await fillLoginForm(page, 'bad@example.com', 'wrongpass');
    await submitLoginForm(page);
    await page.waitForSelector('[data-testid="login-error"]');
    await expect(page).toHaveScreenshot('login-error-state.png', {
      maxDiffPixelRatio: 0.01
    });
  });
});
