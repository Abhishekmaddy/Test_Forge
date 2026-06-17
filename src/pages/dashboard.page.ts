import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '@config/config.manager';

export class DashboardPage extends BasePage {
  protected pageUrl = `${config.baseUrl}/dashboard`;
  protected pageTitle = 'Dashboard';

  // ============ Locators ============
  private readonly welcomeMessage: Locator;
  private readonly userAvatar: Locator;
  private readonly userMenu: Locator;
  private readonly logoutButton: Locator;
  private readonly navigationMenu: Locator;
  private readonly searchBar: Locator;
  private readonly notificationBell: Locator;
  private readonly userNameDisplay: Locator;
  private readonly pageHeader: Locator;
  private readonly sidebarNav: Locator;
  private readonly contentArea: Locator;
  private readonly breadcrumb: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.locator('[data-testid="welcome-message"], .welcome-message, h1.greeting');
    this.userAvatar = page.locator('[data-testid="user-avatar"], .user-avatar, .avatar');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-dropdown');
    this.logoutButton = page.locator('[data-testid="logout-btn"], button:has-text("Logout"), a:has-text("Sign Out")');
    this.navigationMenu = page.locator('[data-testid="nav-menu"], nav, .sidebar');
    this.searchBar = page.locator('[data-testid="search-bar"], input[placeholder*="Search"]');
    this.notificationBell = page.locator('[data-testid="notifications"], .notification-bell');
    this.userNameDisplay = page.locator('[data-testid="username"], .username, .user-name');
    this.pageHeader = page.locator('[data-testid="page-header"], .page-header, main h1');
    this.sidebarNav = page.locator('[data-testid="sidebar"], .sidebar-nav');
    this.contentArea = page.locator('[data-testid="main-content"], main, .content-area');
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
  }

  // ============ Actions ============
  async openUserMenu(): Promise<void> {
    await this.click(this.userAvatar, 'User Avatar');
    await this.waitForElement(this.userMenu);
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.click(this.logoutButton, 'Logout button');
    await this.page.waitForURL(/login/, { timeout: 10000 });
    this.logger.info('Logged out successfully');
  }

  async search(query: string): Promise<void> {
    await this.fill(this.searchBar, query, 'Search bar');
    await this.pressKey('Enter');
  }

  async navigateToSection(section: string): Promise<void> {
    const navItem = this.page.locator(`[data-testid="nav-${section.toLowerCase()}"], nav a:has-text("${section}")`);
    await this.click(navItem, `Navigation: ${section}`);
  }

  async clickNotifications(): Promise<void> {
    await this.click(this.notificationBell, 'Notification bell');
  }

  // ============ Assertions ============
  async verifyDashboardLoaded(): Promise<void> {
    await this.assertVisible(this.contentArea, 'Main content area should be visible');
    await this.assertVisible(this.navigationMenu, 'Navigation menu should be visible');
    this.logger.info('Dashboard loaded successfully');
  }

  async verifyLoggedInUser(username: string): Promise<void> {
    await this.assertVisible(this.userNameDisplay);
    await this.assertText(this.userNameDisplay, username);
    this.logger.info(`Verified logged in user: ${username}`);
  }

  async verifyWelcomeMessage(name: string): Promise<void> {
    await this.assertVisible(this.welcomeMessage);
    await this.assertText(this.welcomeMessage, name);
  }

  async getWelcomeMessage(): Promise<string> {
    return await this.getText(this.welcomeMessage);
  }

  async getUserName(): Promise<string> {
    return await this.getText(this.userNameDisplay);
  }

  async verifyNavigationItem(itemName: string): Promise<void> {
    const navItem = this.page.locator(`nav a:has-text("${itemName}")`);
    await this.assertVisible(navItem);
  }
}
