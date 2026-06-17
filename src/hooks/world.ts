import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { config, EnvironmentConfig } from '@config/config.manager';
import { Logger } from '@utils/logger';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  scenarioName: string = '';
  startTime: Date = new Date();
  testData: Record<string, unknown> = {};
  feature: string = '';
  scenario: string = '';
  tags: string[] = [];
  logger: Logger;
  config: EnvironmentConfig = config;

  constructor(options: IWorldOptions) {
    super(options);
    this.logger = new Logger('CustomWorld');
  }

  async openBrowser(): Promise<void> {
    const browserName = config.browser || 'chromium';
    const headless = config.headless;

    this.logger.info(`Launching ${browserName} browser (headless: ${headless})`);

    const launchOptions = {
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        ...(!headless ? ['--start-maximized'] : [])
      ]
    };

    switch (browserName) {
      case 'firefox':
        this.browser = await firefox.launch(launchOptions);
        break;
      case 'webkit':
        this.browser = await webkit.launch(launchOptions);
        break;
      default:
        this.browser = await chromium.launch(launchOptions);
    }

    this.context = await this.browser.newContext({
      // null viewport lets the page fill the actual (maximized) browser window
      // instead of being capped to a fixed size when running headed
      viewport: headless ? { width: 1920, height: 1080 } : null,
      recordVideo: {
        dir: 'reports/videos/',
        size: { width: 1920, height: 1080 }
      },
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
      userAgent: 'Enterprise-Automation-Framework/1.0'
    });

    // Enable trace recording
    await this.context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(config.timeout);

    this.logger.info('Browser launched and context created successfully');
  }

  async closeBrowser(): Promise<void> {
    try {
      if (this.context) {
        await this.context.tracing.stop({
          path: `reports/traces/trace-${this.scenarioName.replace(/\s+/g, '-')}-${Date.now()}.zip`
        });
      }
    } catch (err) {
      this.logger.warn('Failed to save trace:', err);
    }

    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();

    this.logger.info('Browser closed successfully');
  }

  async takeScreenshot(name?: string): Promise<Buffer> {
    const screenshotName = name || `screenshot-${Date.now()}`;
    const screenshot = await this.page.screenshot({
      fullPage: true,
      path: `reports/screenshots/${screenshotName}.png`
    });
    return screenshot;
  }

  setTestData(key: string, value: unknown): void {
    this.testData[key] = value;
  }

  getTestData<T>(key: string): T {
    return this.testData[key] as T;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
    this.logger.info(`Navigated to: ${url}`);
  }
}

setWorldConstructor(CustomWorld);
