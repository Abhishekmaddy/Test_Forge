import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '@utils/logger';
import { AllureHelper } from '@utils/allure.helper';

export abstract class BasePage {
  protected page: Page;
  protected logger: Logger;
  protected allure: AllureHelper;
  protected abstract pageUrl: string;
  protected abstract pageTitle: string;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger(this.constructor.name);
    this.allure = new AllureHelper();
  }

  // ============ Navigation ============
  async navigate(): Promise<void> {
    this.logger.info(`Navigating to ${this.pageUrl}`);
    await this.page.goto(this.pageUrl, { waitUntil: 'networkidle' });
    await this.verifyPageLoaded();
  }

  async verifyPageLoaded(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).toHaveTitle(new RegExp(this.pageTitle, 'i'));
    this.logger.info(`Page loaded: ${this.pageTitle}`);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  // ============ Element Interactions ============
  async click(locator: Locator | string, description?: string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.scrollIntoViewIfNeeded();
    await element.click();
    this.logger.debug(`Clicked: ${description || 'element'}`);
  }

  async doubleClick(locator: Locator | string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.dblclick();
  }

  async rightClick(locator: Locator | string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.click({ button: 'right' });
  }

  async fill(locator: Locator | string, value: string, description?: string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.clear();
    await element.fill(value);
    this.logger.debug(`Filled ${description || 'field'} with: ${value}`);
  }

  async type(locator: Locator | string, value: string, delay = 50): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.type(value, { delay });
  }

  async selectOption(locator: Locator | string, value: string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.selectOption(value);
  }

  async check(locator: Locator | string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.check();
  }

  async uncheck(locator: Locator | string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    await element.uncheck();
  }

  async hover(locator: Locator | string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.hover();
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async uploadFile(locator: Locator | string, filePath: string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.setInputFiles(filePath);
  }

  // ============ Getters ============
  async getText(locator: Locator | string): Promise<string> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    return (await element.textContent()) || '';
  }

  async getValue(locator: Locator | string): Promise<string> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible' });
    return await element.inputValue();
  }

  async getAttribute(locator: Locator | string, attr: string): Promise<string | null> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.getAttribute(attr);
  }

  async getCount(locator: Locator | string): Promise<number> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.count();
  }

  async getAllTexts(locator: Locator | string): Promise<string[]> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.allTextContents();
  }

  // ============ State Checks ============
  async isVisible(locator: Locator | string): Promise<boolean> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.isVisible();
  }

  async isEnabled(locator: Locator | string): Promise<boolean> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.isEnabled();
  }

  async isChecked(locator: Locator | string): Promise<boolean> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    return await element.isChecked();
  }

  // ============ Waits ============
  async waitForElement(locator: Locator | string, timeout?: number): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(locator: Locator | string, timeout?: number): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.waitFor({ state: 'hidden', timeout });
  }

  async waitForText(locator: Locator | string, text: string, timeout?: number): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(element).toContainText(text, { timeout });
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForTimeout(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  // ============ Assertions ============
  async assertVisible(locator: Locator | string, message?: string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(element, message).toBeVisible();
  }

  async assertText(locator: Locator | string, text: string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(element).toContainText(text);
  }

  async assertExactText(locator: Locator | string, text: string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(element).toHaveText(text);
  }

  async assertUrl(url: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(url);
  }

  async assertTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  async assertAttributeValue(
    locator: Locator | string,
    attr: string,
    value: string
  ): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(element).toHaveAttribute(attr, value);
  }

  async assertCount(locator: Locator | string, count: number): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(element).toHaveCount(count);
  }

  async assertNotVisible(locator: Locator | string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await expect(element).not.toBeVisible();
  }

  // ============ Screenshot & Reporting ============
  async takeScreenshot(name?: string): Promise<Buffer> {
    return await this.page.screenshot({
      fullPage: true,
      path: name ? `reports/screenshots/${name}.png` : undefined
    });
  }

  // ============ Dialog Handling ============
  async acceptAlert(): Promise<void> {
    this.page.on('dialog', dialog => dialog.accept());
  }

  async dismissAlert(): Promise<void> {
    this.page.on('dialog', dialog => dialog.dismiss());
  }

  async getAlertText(): Promise<string> {
    return new Promise(resolve => {
      this.page.on('dialog', dialog => {
        resolve(dialog.message());
        dialog.accept();
      });
    });
  }

  // ============ Frames & Windows ============
  async switchToFrame(locator: string): Promise<void> {
    const frameLocator = this.page.frameLocator(locator);
    // Use frameLocator for subsequent actions
    this.logger.info(`Switched to frame: ${locator}`);
  }

  async switchToNewTab(): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page')
    ]);
    await newPage.waitForLoadState();
    return newPage;
  }

  // ============ Scroll ============
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      const doc = (globalThis as any).document ?? null;
      if (doc) (globalThis as any).scrollTo(0, (doc.body as any).scrollHeight);
    });
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => (globalThis as any).scrollTo(0, 0));
  }

  async scrollIntoView(locator: Locator | string): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.scrollIntoViewIfNeeded();
  }

  // ============ JavaScript Execution ============
  async executeScript<T>(script: string, ...args: unknown[]): Promise<T> {
    // allow passing a script string or function; cast to any to satisfy generic typing
    return await this.page.evaluate<T>(script as any, ...args);
  }

  // ============ Storage ============
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate('k => localStorage.getItem(k)', key);
  }

  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate('({k,v}) => localStorage.setItem(k, v)', { k: key, v: value });
  }

  async getCookies(): Promise<Record<string, string>> {
    const cookies = await this.page.context().cookies();
    return cookies.reduce(
      (acc, cookie) => {
        acc[cookie.name] = cookie.value;
        return acc;
      },
      {} as Record<string, string>
    );
  }
}
