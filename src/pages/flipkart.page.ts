import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface FlipkartProductSummary {
  href: string;
  name: string;
  price: number;
  rating: string | null;
  ratingCount: string | null;
}

export interface FlipkartProductDetails {
  name: string;
  price: string | null;
  rating: string | null;
  ratingCount: string | null;
}

export class FlipkartPage extends BasePage {
  protected pageUrl = 'https://www.flipkart.com';
  protected pageTitle = 'Online Shopping';

  // Login popup close icon ("✕") shown on top of the homepage
  private readonly loginCloseIcon = 'span[role="button"]:has-text("✕"), span.b3wTlE';
  private readonly searchInput = 'input[name="q"]:not([readonly])';
  private readonly productLinks = 'a[href*="/p/"]';
  // Fallback chains: Flipkart's CSS module class names rotate across deploys.
  // Rating is read from the search-results card rather than the product page:
  // the PDP's rating widgets vary wildly by product/review-volume and include
  // hidden modal content, making them unreliable to scrape accurately.
  private readonly cardTitleSelectors = ['div.RG5Slk', 'div._4rR01T', '.s1Q9rs'];
  private readonly cardPriceSelectors = ['div.hZ3P6w.DeU9vF', 'div._30jeq3._1_WHN1', 'div._30jeq3'];
  private readonly cardRatingSelectors = ['span.CjyrHS', 'div.MKiFS6', 'div._3LWZlK'];
  private readonly cardRatingCountSelectors = ['span.PvbNMB', 'span._2_R_DZ'];

  constructor(page: Page) {
    super(page);
  }

  // ============ Actions ============
  async dismissLoginPopup(): Promise<void> {
    try {
      await this.page.locator(this.loginCloseIcon).first().click({ timeout: 8000 });
      this.logger.info('Dismissed Flipkart login popup');
    } catch {
      this.logger.info('Login popup not present; continuing');
    }
  }

  async searchProduct(query: string): Promise<void> {
    await this.fill(this.searchInput, query, 'Flipkart search input');
    await this.pressKey('Enter');
    // Flipkart's search is a client-side route change, not a full navigation,
    // so waitForLoadState('domcontentloaded') resolves immediately and doesn't
    // actually wait for the results to render. Wait for the search URL instead.
    await this.page.waitForURL(/[?&]q=/, { timeout: 15000 }).catch(() => {});
    await this.page.locator(this.productLinks).first().waitFor({ state: 'visible', timeout: 25000 });
  }

  async getProductsWithinBudget(maxPrice: number): Promise<FlipkartProductSummary[]> {
    return this.page.locator(this.productLinks).evaluateAll(
      (anchors, ctx) => {
        const parsePrice = (text: string) => Number(text.replace(/[^\d]/g, ''));
        const queryFirst = (root: Element, selectors: string[]) => {
          for (const sel of selectors) {
            const el = root.querySelector(sel);
            if (el?.textContent?.trim()) return el.textContent.trim();
          }
          return '';
        };
        return anchors
          .map(a => {
            const name = queryFirst(a, ctx.titleSelectors);
            const priceText = queryFirst(a, ctx.priceSelectors);
            const price = priceText ? parsePrice(priceText) : NaN;
            const rating = queryFirst(a, ctx.ratingSelectors) || null;
            const ratingCount = queryFirst(a, ctx.ratingCountSelectors) || null;
            return { href: a.getAttribute('href') || '', name, price, rating, ratingCount };
          })
          .filter(p => p.href && p.name && !Number.isNaN(p.price) && p.price <= ctx.maxPrice);
      },
      {
        maxPrice,
        titleSelectors: this.cardTitleSelectors,
        priceSelectors: this.cardPriceSelectors,
        ratingSelectors: this.cardRatingSelectors,
        ratingCountSelectors: this.cardRatingCountSelectors
      }
    );
  }

  async openProductWithinBudget(maxPrice: number): Promise<FlipkartProductSummary> {
    const candidates = await this.getProductsWithinBudget(maxPrice);
    if (candidates.length === 0) {
      throw new Error(`No laptop found within budget of Rs.${maxPrice}`);
    }
    const chosen = candidates[0];
    await this.page.goto(new URL(chosen.href, this.pageUrl).toString(), { waitUntil: 'domcontentloaded' });
    return chosen;
  }

  // ============ Product Detail Page ============
  async getProductName(): Promise<string> {
    const rawTitle = await this.page.evaluate(
      () => document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title
    );
    const match = rawTitle.match(/^(.*?)\s+Rs\.[\d,]+\s+Price in India/i);
    return (match ? match[1] : rawTitle).trim();
  }

  async getProductDetails(
    listing: Pick<FlipkartProductSummary, 'rating' | 'ratingCount'>
  ): Promise<FlipkartProductDetails> {
    const name = await this.getProductName();

    const price = await this.page
      .evaluate(() => {
        const h1 = document.querySelector('h1');
        let node: Element | null = h1?.nextElementSibling ?? null;
        for (let i = 0; i < 10 && node; i++) {
          const match = node.textContent?.match(/₹[\d,]+/);
          if (match) return match[0];
          node = node.nextElementSibling;
        }
        const bodyMatch = document.body.textContent?.match(/₹[\d,]+/);
        return bodyMatch ? bodyMatch[0] : null;
      })
      .catch(() => null);

    return { name, price, rating: listing.rating, ratingCount: listing.ratingCount };
  }

  async verifyProductPageDisplayed(): Promise<void> {
    await this.page.waitForSelector('h1', { timeout: 15000 });
    await this.assertVisible('h1', 'Product title should be visible on the product page');
  }
}
