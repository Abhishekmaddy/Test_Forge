import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '@config/config.manager';

export class LoginPage extends BasePage {
  protected pageUrl = `${config.baseUrl}/login`;
  protected pageTitle = 'Login';

  // ============ Locators ============
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly errorMessage: Locator;
  private readonly successMessage: Locator;
  private readonly usernameLabel: Locator;
  private readonly passwordLabel: Locator;
  private readonly showPasswordToggle: Locator;
  private readonly googleLoginButton: Locator;
  private readonly microsoftLoginButton: Locator;
  private readonly registerLink: Locator;
  private readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('[data-testid="email-input"], input[name="email"], #email');
    this.passwordInput = page.locator('[data-testid="password-input"], input[name="password"], #password');
    this.loginButton = page.locator('[data-testid="login-btn"], button[type="submit"], #login-btn');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me"], input[name="rememberMe"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"], a:has-text("Forgot Password")');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message, .alert-error');
    this.successMessage = page.locator('[data-testid="success-message"], .success-message');
    this.usernameLabel = page.locator('label[for="email"], label:has-text("Email")');
    this.passwordLabel = page.locator('label[for="password"], label:has-text("Password")');
    this.showPasswordToggle = page.locator('[data-testid="show-password"], .password-toggle');
    this.googleLoginButton = page.locator('[data-testid="google-login"], button:has-text("Google")');
    this.microsoftLoginButton = page.locator('[data-testid="microsoft-login"], button:has-text("Microsoft")');
    this.registerLink = page.locator('[data-testid="register-link"], a:has-text("Register")');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"], .spinner, .loading');
  }

  // ============ Actions ============
  async enterEmail(email: string): Promise<void> {
    await this.fill(this.emailInput, email, 'Email field');
  }

  async enterPassword(password: string): Promise<void> {
    await this.fill(this.passwordInput, password, 'Password field');
  }

  async clickLoginButton(): Promise<void> {
    await this.click(this.loginButton, 'Login button');
  }

  async clickForgotPassword(): Promise<void> {
    await this.click(this.forgotPasswordLink, 'Forgot Password link');
  }

  async clickRegisterLink(): Promise<void> {
    await this.click(this.registerLink, 'Register link');
  }

  async checkRememberMe(): Promise<void> {
    await this.check(this.rememberMeCheckbox);
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.click(this.showPasswordToggle, 'Show password toggle');
  }

  async loginWithGoogle(): Promise<void> {
    await this.click(this.googleLoginButton, 'Google login button');
  }

  async loginWithMicrosoft(): Promise<void> {
    await this.click(this.microsoftLoginButton, 'Microsoft login button');
  }

  // ============ High-Level Methods ============
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    this.logger.info(`Logging in with email: ${email}`);
    await this.enterEmail(email);
    await this.enterPassword(password);
    if (rememberMe) await this.checkRememberMe();
    await this.clickLoginButton();
    await this.waitForLoginResponse();
  }

  async loginWithCredentials(credentials: { username: string; password: string }): Promise<void> {
    await this.login(credentials.username, credentials.password);
  }

  async waitForLoginResponse(): Promise<void> {
    // Wait for either success (redirect) or error message
    await Promise.race([
      this.page.waitForURL(/dashboard|home/, { timeout: 15000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 15000 })
    ]).catch(() => {});
  }

  // ============ Assertions ============
  async verifyLoginPageDisplayed(): Promise<void> {
    await this.assertVisible(this.emailInput, 'Email input should be visible');
    await this.assertVisible(this.passwordInput, 'Password input should be visible');
    await this.assertVisible(this.loginButton, 'Login button should be visible');
    this.logger.info('Login page is displayed correctly');
  }

  async verifyErrorMessage(expectedMessage: string): Promise<void> {
    await this.assertVisible(this.errorMessage);
    await this.assertText(this.errorMessage, expectedMessage);
    this.logger.info(`Error message verified: "${expectedMessage}"`);
  }

  async verifyNoErrorMessage(): Promise<void> {
    await this.assertNotVisible(this.errorMessage);
  }

  async verifyEmailFieldEmpty(): Promise<void> {
    const value = await this.getValue(this.emailInput);
    if (value !== '') throw new Error('Email field is not empty');
  }

  async verifyPasswordMasked(): Promise<boolean> {
    const type = await this.getAttribute(this.passwordInput, 'type');
    return type === 'password';
  }

  async verifyPasswordVisible(): Promise<boolean> {
    const type = await this.getAttribute(this.passwordInput, 'type');
    return type === 'text';
  }

  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return await this.getText(this.errorMessage);
  }

  async verifyLoginButtonEnabled(): Promise<boolean> {
    return await this.isEnabled(this.loginButton);
  }

  async verifyForgotPasswordLinkVisible(): Promise<void> {
    await this.assertVisible(this.forgotPasswordLink);
  }

  async verifyRememberMeChecked(): Promise<boolean> {
    return await this.isChecked(this.rememberMeCheckbox);
  }

  async verifySuccessfulRedirect(expectedPath: string): Promise<void> {
    await this.page.waitForURL(new RegExp(expectedPath), { timeout: 10000 });
    this.logger.info(`Successfully redirected to: ${expectedPath}`);
  }
}
