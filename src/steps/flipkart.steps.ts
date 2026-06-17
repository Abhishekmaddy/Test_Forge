import { Given, Then } from '@cucumber/cucumber';
import { CustomWorld } from '@hooks/world';
import { FlipkartPage } from '@pages/flipkart.page';
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
