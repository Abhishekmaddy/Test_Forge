import { Page, Locator, Dialog } from '@playwright/test';
import { BasePage } from '../base.page';

// Scope: this page object only drives IRCTC's public train-search and
// seat-availability screens. It deliberately has no methods for logging in,
// filling passenger details, entering payment info, or submitting a booking —
// automating an actual Tatkal purchase is against IRCTC's terms of service and
// Section 143 of the Railways Act, 1989.
export class IrctcPage extends BasePage {
  protected pageUrl = 'https://www.irctc.co.in/nget/train-search';
  protected pageTitle = 'IRCTC';

  // Selector notes: IRCTC's "nget" Angular app rotates bundled class names
  // across releases, the same way Flipkart's do (see flipkart.page.ts). These
  // are first-pass selectors based on the form's accessible roles/placeholders
  // and have not been verified against a live run. Confirm them on the first
  // headed execution and widen the fallback chains as needed.
  private readonly originInput: Locator;
  private readonly destinationInput: Locator;
  private readonly journeyDateInput: Locator;
  private readonly searchButton: Locator;
  private readonly autocompleteOption: Locator;
  private readonly trainCards: Locator;
  private readonly noTrainsMessage: Locator;
  private readonly stationValidationError: Locator;
  private readonly dateValidationError: Locator;

  constructor(page: Page) {
    super(page);
    this.originInput = page.locator('#origin, input[placeholder="From*"], input[aria-label="From"]');
    this.destinationInput = page.locator('#destination, input[placeholder="To*"], input[aria-label="To"]');
    this.journeyDateInput = page.locator('#jDate, input[placeholder="Journey Date"]');
    this.searchButton = page.locator('button:has-text("Search"), button:has-text("Find Trains")');
    this.autocompleteOption = page.locator('li.ui-autocomplete-item, li[role="option"], p-autocomplete li');
    this.trainCards = page.locator('app-train-avl-enq, .train-list, .trainlist');
    this.noTrainsMessage = page.getByText(/no trains|not found|no direct train/i);
    this.stationValidationError = page
      .getByText(/select.*(origin|destination|station)/i)
      .or(page.locator('.ui-messages-error, .error'));
    this.dateValidationError = page
      .getByText(/invalid date|past date|select.*date/i)
      .or(page.locator('.ui-messages-error, .error'));
  }

  // ============ Actions ============
  async searchTrains(from: string, to: string, journeyDate: string): Promise<void> {
    await this.selectStation(this.originInput, from);
    await this.selectStation(this.destinationInput, to);
    await this.setJourneyDate(journeyDate);
    await this.click(this.searchButton, 'Search button');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  private async selectStation(input: Locator, stationQuery: string): Promise<void> {
    await this.fill(input, stationQuery, `Station input (${stationQuery})`);
    const option = this.autocompleteOption.first();
    const hasOption = await option.isVisible({ timeout: 8000 }).catch(() => false);
    if (hasOption) {
      await option.click();
    } else {
      // No matching station suggestion (e.g. an unrecognized code) — leave the
      // typed text as-is so the search proceeds and naturally yields no
      // results, rather than failing the step outright.
      await this.pressKey('Escape');
    }
  }

  private async setJourneyDate(journeyDate: string): Promise<void> {
    await this.fill(this.journeyDateInput, journeyDate, 'Journey date input');
    await this.pressKey('Escape');
  }

  // Reuses the dialog-listening approach from FlipkartPage.searchWithXSSPayload
  // to confirm the station field treats injected markup as literal text.
  async searchWithXSSPayload(originPayload: string, to: string, journeyDate: string): Promise<boolean> {
    let dialogTriggered = false;
    const onDialog = (dialog: Dialog) => {
      dialogTriggered = true;
      void dialog.dismiss();
    };
    this.page.on('dialog', onDialog);
    await this.searchTrains(originPayload, to, journeyDate);
    this.page.off('dialog', onDialog);
    return dialogTriggered;
  }

  async getTrainCount(): Promise<number> {
    return this.trainCards.count();
  }

  async isNoTrainsOutcomeDisplayed(): Promise<boolean> {
    const trainCount = await this.getTrainCount();
    if (trainCount > 0) return false;
    return this.noTrainsMessage.first().isVisible().catch(() => true);
  }

  async isStationValidationErrorDisplayed(): Promise<boolean> {
    return this.stationValidationError.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isDateValidationErrorDisplayed(): Promise<boolean> {
    return this.dateValidationError.first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // Switches the first class block of the given train card to TATKAL quota
  // and reads back the resulting availability status text (e.g. "AVAILABLE-12",
  // "WL45", "REGRET"). Returns null if no quota control is found.
  async getTatkalAvailability(trainIndex: number, classIndex: number): Promise<string | null> {
    const card = this.trainCards.nth(trainIndex);
    const classBlock = card.locator('.class-select, .form-group, td').nth(classIndex);
    const quotaDropdown = classBlock.locator('select, p-dropdown').first();

    const hasDropdown = await quotaDropdown.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasDropdown) {
      await quotaDropdown.click();
      await this.page.getByText('TATKAL', { exact: false }).first().click().catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    const statusText = await classBlock.locator('.AVLDAYLIST, .train-Avl-list, td').last().textContent().catch(() => null);
    return statusText?.trim() || null;
  }

  // ============ Assertions ============
  async verifyResultsDisplayed(): Promise<void> {
    const count = await this.getTrainCount();
    if (count === 0) throw new Error('Expected at least one train result, found none');
  }

  async verifyOriginFieldVisible(): Promise<void> {
    await this.assertVisible(this.originInput, 'Origin station field should be visible');
  }

  async verifyDestinationFieldVisible(): Promise<void> {
    await this.assertVisible(this.destinationInput, 'Destination station field should be visible');
  }

  async verifyJourneyDateFieldVisible(): Promise<void> {
    await this.assertVisible(this.journeyDateInput, 'Journey date field should be visible');
  }

  async verifySearchButtonVisible(): Promise<void> {
    await this.assertVisible(this.searchButton, 'Search button should be visible');
  }
}
