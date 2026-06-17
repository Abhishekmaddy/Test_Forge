import { expect } from '@playwright/test';
import { CustomWorld } from '@hooks/world';
import { Given, When, Then } from '@hooks/screenshot-steps';
import { FlipkartPage, FlipkartProductSummary } from '@pages/flipkart.page';
import { AllureHelper } from '@utils/allure.helper';

const allure = new AllureHelper();

Given('I open the Flipkart homepage', async function (this: CustomWorld) {
  const flipkartPage = new FlipkartPage(this.page);
  await flipkartPage.navigate();
  allure.addStep('Opened Flipkart homepage');
});

Then('the Flipkart homepage should be displayed', async function (this: CustomWorld) {
  const flipkartPage = new FlipkartPage(this.page);
  await flipkartPage.verifyPageLoaded();
  allure.addStep('Verified Flipkart homepage is displayed');
});

When('I close the Flipkart login popup using the cross icon', async function (this: CustomWorld) {
  const flipkartPage = new FlipkartPage(this.page);
  await flipkartPage.dismissLoginPopup();
  allure.addStep('Closed Flipkart login popup using the cross icon');
});

When('I search for {string} on Flipkart', async function (this: CustomWorld, query: string) {
  const flipkartPage = new FlipkartPage(this.page);
  await flipkartPage.searchProduct(query);
  allure.addStep(`Searched for "${query}" on Flipkart`);
});

When('I open a laptop result priced within {string}', async function (this: CustomWorld, maxPrice: string) {
  const flipkartPage = new FlipkartPage(this.page);
  const chosen: FlipkartProductSummary = await flipkartPage.openProductWithinBudget(Number(maxPrice));
  this.setTestData('expectedLaptopName', chosen.name);
  this.setTestData('expectedLaptopPrice', chosen.price);
  this.setTestData('expectedLaptopRating', chosen.rating);
  this.setTestData('expectedLaptopRatingCount', chosen.ratingCount);
  allure.addStep(`Opened laptop "${chosen.name}" priced at Rs.${chosen.price} (rating: ${chosen.rating ?? 'N/A'})`);
});

Then('the laptop product page should be displayed', async function (this: CustomWorld) {
  const flipkartPage = new FlipkartPage(this.page);
  await flipkartPage.verifyProductPageDisplayed();
  allure.addStep('Verified the laptop product page is displayed');
});

Then('the laptop name should be verified against the search result', async function (this: CustomWorld) {
  const flipkartPage = new FlipkartPage(this.page);
  const actualName = await flipkartPage.getProductName();
  const expectedName = this.getTestData<string>('expectedLaptopName');

  expect(actualName).toBeTruthy();
  expect(actualName.toLowerCase()).toContain(expectedName.toLowerCase().split(' - ')[0].slice(0, 20).toLowerCase());

  this.setTestData('actualLaptopName', actualName);
  allure.addStep(`Verified laptop name on product page: "${actualName}"`);
});

Then('I capture the laptop details in the report', async function (this: CustomWorld) {
  const flipkartPage = new FlipkartPage(this.page);
  const details = await flipkartPage.getProductDetails({
    rating: this.getTestData<string | null>('expectedLaptopRating'),
    ratingCount: this.getTestData<string | null>('expectedLaptopRatingCount')
  });

  this.log(
    `Laptop Name: ${details.name}\nPrice: ${details.price || 'N/A'}\nRating: ${details.rating || 'N/A'} (${details.ratingCount || 'no rating data'})\nURL: ${this.page.url()}`
  );
  this.attach(JSON.stringify(details, null, 2), 'application/json');

  const screenshot = await flipkartPage.takeScreenshot('laptop-product-page');
  this.attach(screenshot, 'image/png');

  allure.addStep(`Captured laptop details: ${JSON.stringify(details)}`);
});
