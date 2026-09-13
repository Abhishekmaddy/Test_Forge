import { expect } from '@playwright/test';
import { CustomWorld } from '@hooks/world';
import { Given, When, Then } from '@hooks/screenshot-steps';
import { IrctcPage } from '@pages/irctc/irctc.page';
import { AllureHelper } from '@utils/allure.helper';

const allure = new AllureHelper();
const KNOWN_AVAILABILITY_STATUSES = /AVAILABLE|WL|RAC|REGRET|NOT AVAIL|TRAIN DEP/i;

Given('I open the IRCTC train search page', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  await irctcPage.navigate();
  allure.addStep('Opened IRCTC train search page');
});

When('I search trains from {string} to {string} on {string}', async function (
  this: CustomWorld,
  from: string,
  to: string,
  journeyDate: string
) {
  const irctcPage = new IrctcPage(this.page);
  await irctcPage.searchTrains(from, to, journeyDate);
  allure.addStep(`Searched trains from "${from}" to "${to}" on "${journeyDate}"`);
});

When('I search for the XSS payload {string} as the origin station', async function (this: CustomWorld, payload: string) {
  const irctcPage = new IrctcPage(this.page);
  const triggered = await irctcPage.searchWithXSSPayload(payload, 'BCT', '2026-06-25');
  this.setTestData('xssDialogTriggered', triggered);
  allure.addStep(`Searched with XSS payload "${payload}" as the origin station`);
});

Then('the train search results should be displayed', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  await irctcPage.verifyResultsDisplayed();
  allure.addStep('Verified train search results are displayed');
});

Then('no train search results should be displayed', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  const count = await irctcPage.getTrainCount();
  expect(count).toBe(0);
  allure.addStep('Verified no train search results are displayed');
});

Then('a no-trains outcome should be displayed', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  const noTrains = await irctcPage.isNoTrainsOutcomeDisplayed();
  expect(noTrains).toBe(true);
  allure.addStep('Verified a no-trains outcome was shown instead of a crash');
});

Then('a validation error should be shown for the station selection', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  const hasError = await irctcPage.isStationValidationErrorDisplayed();
  expect(hasError).toBe(true);
  allure.addStep('Verified a station validation error was shown');
});

Then('a validation error should be shown for the journey date', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  const hasError = await irctcPage.isDateValidationErrorDisplayed();
  expect(hasError).toBe(true);
  allure.addStep('Verified a journey date validation error was shown');
});

Then("I check Tatkal availability for the first train's first class", async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  const status = await irctcPage.getTatkalAvailability(0, 0);
  this.setTestData('tatkalAvailabilityStatus', status);
  allure.addStep(`Captured Tatkal availability status: ${status ?? 'N/A'}`);
});

Then('the Tatkal availability status should be one of the known statuses', async function (this: CustomWorld) {
  const status = this.getTestData<string | null>('tatkalAvailabilityStatus');
  expect(status).toBeTruthy();
  expect(status as string).toMatch(KNOWN_AVAILABILITY_STATUSES);
  allure.addStep(`Verified Tatkal availability status "${status}" matches a known status pattern`);
});

Then('the origin station field should be visible', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  await irctcPage.verifyOriginFieldVisible();
  allure.addStep('Verified origin station field is visible');
});

Then('the destination station field should be visible', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  await irctcPage.verifyDestinationFieldVisible();
  allure.addStep('Verified destination station field is visible');
});

Then('the journey date field should be visible', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  await irctcPage.verifyJourneyDateFieldVisible();
  allure.addStep('Verified journey date field is visible');
});

Then('the search button should be visible', async function (this: CustomWorld) {
  const irctcPage = new IrctcPage(this.page);
  await irctcPage.verifySearchButtonVisible();
  allure.addStep('Verified search button is visible');
});

Then('no script alert should be triggered on the IRCTC search form', async function (this: CustomWorld) {
  const triggered = this.getTestData<boolean>('xssDialogTriggered');
  expect(triggered).toBe(false);
  allure.addStep('Verified no JavaScript alert/dialog was triggered by the station input');
});
