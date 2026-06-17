import { Given as CucumberGiven, When as CucumberWhen, Then as CucumberThen } from '@cucumber/cucumber';
import { CustomWorld } from './world';

// Drop-in replacements for Given/When/Then that automatically attach a
// screenshot after the step body runs. The attach() call must happen while
// Cucumber still considers the step "current" — allure-cucumberjs has no
// fixture tracking for BeforeStep/AfterStep hooks, so attachments sent from
// there get dropped. Wrapping the step body itself keeps the attach() inside
// the step's own execution, which is the only place it reliably nests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StepFn = (this: CustomWorld, ...args: any[]) => unknown;

function withScreenshot(fn: StepFn): StepFn {
  const wrapped: StepFn = async function (this: CustomWorld, ...args) {
    await fn.apply(this, args);
    if (this.page) {
      const screenshot = await this.page.screenshot({ fullPage: true });
      this.attach(screenshot, 'image/png');
    }
  };
  // Cucumber validates that the registered function's declared arity (.length)
  // matches the number of {string}-style placeholders in the step pattern. A
  // rest-parameter wrapper always reports .length === 0, which fails that
  // check for any step expecting a captured argument — so re-expose the
  // original function's arity on the wrapper.
  Object.defineProperty(wrapped, 'length', { value: fn.length });
  return wrapped;
}

export function Given(pattern: string | RegExp, fn: StepFn): void {
  CucumberGiven(pattern, withScreenshot(fn));
}

export function When(pattern: string | RegExp, fn: StepFn): void {
  CucumberWhen(pattern, withScreenshot(fn));
}

export function Then(pattern: string | RegExp, fn: StepFn): void {
  CucumberThen(pattern, withScreenshot(fn));
}
