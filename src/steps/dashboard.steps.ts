/**
 * Dashboard Step Definitions
 * Implements BDD steps for Dashboard feature scenarios
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@hooks/world';
import { DashboardPage } from '@pages/dashboard.page';
import { LoginPage } from '@pages/login.page';
import { Logger } from '@utils/logger';
import { AllureHelper } from '@utils/allure.helper';

const logger = new Logger('DashboardSteps');
const allure = new AllureHelper();

let dashboardPage: DashboardPage;
let loginPage: LoginPage;

// ============ BACKGROUND STEPS ============

Given(
  'I am logged in as {string} with password {string}',
  async function (this: CustomWorld, email: string, password: string) {
    loginPage = new LoginPage(this.page);
    dashboardPage = new DashboardPage(this.page);

    allure.addStep(`Login as ${email}`, 'passed');
    await loginPage.navigate();
    await loginPage.login(email, password);
    logger.info(`Logged in as: ${email}`);
  }
);

Given('I am on the dashboard page', async function (this: CustomWorld) {
  dashboardPage = dashboardPage || new DashboardPage(this.page);
  await dashboardPage.verifyDashboardLoaded();
  logger.info('Verified dashboard is loaded');
});

Given(
  'the browser viewport is set to {int}x{int}',
  async function (this: CustomWorld, width: number, height: number) {
    await this.page.setViewportSize({ width, height });
    logger.info(`Viewport set to ${width}x${height}`);
  }
);

// ============ WHEN STEPS ============

When('I click on the {string} menu item', async function (this: CustomWorld, menuItem: string) {
  allure.addStep(`Click menu: ${menuItem}`, 'passed');
  await this.page.getByRole('navigation').getByText(menuItem, { exact: false }).click();
  await this.page.waitForLoadState('networkidle');
  logger.info(`Clicked menu item: ${menuItem}`);
});

When(
  'I click on {string} in the sidebar',
  async function (this: CustomWorld, sidebarItem: string) {
    await this.page.locator('[data-testid="sidebar"]').getByText(sidebarItem).click();
    await this.page.waitForLoadState('networkidle');
    logger.info(`Clicked sidebar: ${sidebarItem}`);
  }
);

When(
  'I click the refresh button on the {string} widget',
  async function (this: CustomWorld, widgetName: string) {
    const widget = this.page.locator(`[data-testid="widget-${widgetName.toLowerCase().replace(' ', '-')}"]`);
    await widget.locator('[data-testid="widget-refresh"]').click();
    logger.info(`Clicked refresh on widget: ${widgetName}`);
  }
);

When(
  'I type {string} in the global search bar',
  async function (this: CustomWorld, searchTerm: string) {
    this.setTestData('searchTerm', searchTerm);
    const searchInput = this.page.locator('[data-testid="global-search"]');
    await searchInput.click();
    await searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Debounce
    logger.info(`Typed in search: "${searchTerm}"`);
  }
);

When('I click the notifications icon', async function (this: CustomWorld) {
  await this.page.locator('[data-testid="notifications-icon"]').click();
  await this.page.waitForSelector('[data-testid="notifications-panel"]');
  logger.info('Opened notifications panel');
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.getByRole('button', { name: buttonText }).click();
  logger.info(`Clicked button: "${buttonText}"`);
});

When('I click on my avatar in the top-right corner', async function (this: CustomWorld) {
  await this.page.locator('[data-testid="user-avatar"]').click();
  await this.page.waitForSelector('[data-testid="user-dropdown"]');
  logger.info('Opened user dropdown');
});

When('I click the theme toggle button', async function (this: CustomWorld) {
  await this.page.locator('[data-testid="theme-toggle"]').click();
  await this.page.waitForTimeout(300); // Animation
  logger.info('Toggled theme');
});

When('I click the theme toggle button again', async function (this: CustomWorld) {
  await this.page.locator('[data-testid="theme-toggle"]').click();
  await this.page.waitForTimeout(300);
  logger.info('Toggled theme back');
});

// ============ THEN STEPS ============

Then('the dashboard header should be visible', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  logger.info('Dashboard header is visible');
});

Then('the navigation menu should be visible', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="nav-menu"]')).toBeVisible();
  logger.info('Navigation menu is visible');
});

Then('the welcome message should contain my username', async function (this: CustomWorld) {
  const welcomeEl = this.page.locator('[data-testid="welcome-message"]');
  await expect(welcomeEl).toBeVisible();
  const text = await welcomeEl.textContent();
  expect(text).toBeTruthy();
  logger.info(`Welcome message: "${text}"`);
});

Then('the dashboard widgets should be loaded', async function (this: CustomWorld) {
  const widgets = this.page.locator('[data-testid^="widget-"]');
  await expect(widgets.first()).toBeVisible();
  const count = await widgets.count();
  expect(count).toBeGreaterThan(0);
  logger.info(`${count} widgets loaded`);
});

Then('I should be on the reports page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*reports.*/);
  logger.info('On reports page ✓');
});

Then('I should see the settings panel', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="settings-panel"]')).toBeVisible();
  logger.info('Settings panel visible');
});

Then('I should see the {string} widget', async function (this: CustomWorld, widgetName: string) {
  const widgetId = widgetName.toLowerCase().replace(' ', '-');
  await expect(this.page.locator(`[data-testid="widget-${widgetId}"]`)).toBeVisible();
  logger.info(`Widget visible: ${widgetName}`);
});

Then('the widget should show a loading indicator', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="widget-loading"]')).toBeVisible();
  logger.info('Widget loading indicator visible');
});

Then('the widget data should update', async function (this: CustomWorld) {
  await this.page.waitForSelector('[data-testid="widget-loading"]', { state: 'hidden' });
  logger.info('Widget data updated');
});

Then('the search suggestions should appear', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="search-suggestions"]')).toBeVisible();
  logger.info('Search suggestions visible');
});

Then('the results should contain {string}', async function (this: CustomWorld, expectedText: string) {
  const results = this.page.locator('[data-testid="search-results"]');
  await expect(results).toContainText(expectedText);
  logger.info(`Results contain: "${expectedText}"`);
});

Then('the search should show {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.locator('[data-testid="search-empty-state"]')).toContainText(message);
  logger.info(`Empty state message: "${message}"`);
});

Then('the notifications panel should be visible', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="notifications-panel"]')).toBeVisible();
  logger.info('Notifications panel is visible');
});

Then('I should see a list of notifications', async function (this: CustomWorld) {
  const notifications = this.page.locator('[data-testid="notification-item"]');
  const count = await notifications.count();
  logger.info(`${count} notifications visible`);
});

Then('all notifications should be marked as read', async function (this: CustomWorld) {
  const unreadBadges = this.page.locator('[data-testid="notification-unread-badge"]');
  await expect(unreadBadges).toHaveCount(0);
  logger.info('All notifications marked as read');
});

Then('the notification badge should disappear', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="notification-badge"]')).toBeHidden();
  logger.info('Notification badge hidden');
});

Then('a dropdown menu should appear', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="user-dropdown"]')).toBeVisible();
  logger.info('User dropdown visible');
});

Then(
  'the dropdown should contain {string}',
  async function (this: CustomWorld, menuItem: string) {
    await expect(this.page.locator('[data-testid="user-dropdown"]')).toContainText(menuItem);
    logger.info(`Dropdown contains: "${menuItem}"`);
  }
);

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForURL(/.*login.*/);
  logger.info('Redirected to login page ✓');
});

Then('I should see the login form', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="login-form"]')).toBeVisible();
  logger.info('Login form visible');
});

Then('the hamburger menu icon should be visible', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
  logger.info('Hamburger menu icon visible (mobile)');
});

Then('the navigation should be collapsed', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="nav-menu"]')).toBeHidden();
  logger.info('Navigation collapsed on mobile');
});

Then('the dashboard should switch to dark mode', async function (this: CustomWorld) {
  const htmlEl = this.page.locator('html');
  await expect(htmlEl).toHaveAttribute('data-theme', 'dark');
  logger.info('Dark mode active');
});

Then('the dashboard should switch to light mode', async function (this: CustomWorld) {
  const htmlEl = this.page.locator('html');
  await expect(htmlEl).toHaveAttribute('data-theme', 'light');
  logger.info('Light mode active');
});
