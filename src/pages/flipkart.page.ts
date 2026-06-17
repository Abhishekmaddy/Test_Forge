import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class FlipkartPage extends BasePage {
  protected pageUrl = 'https://www.flipkart.com';
  protected pageTitle = 'Online Shopping';

  constructor(page: Page) {
    super(page);
  }
}
