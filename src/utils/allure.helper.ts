import * as allure from 'allure-js-commons';

export class AllureHelper {
  addLabel(name: string, value: string): void {
    try {
      allure.label(name, value);
    } catch {
      // Silently fail if allure is not in context
    }
  }

  addTag(tag: string): void {
    try {
      allure.tag(tag.replace('@', ''));
    } catch {
      // Silently fail
    }
  }

  addStep(name: string, status: 'passed' | 'failed' | 'broken' | 'skipped' = 'passed'): void {
    try {
      allure.step(name, () => {
        // Step content
      });
    } catch {
      // Silently fail
    }
  }

  addAttachment(name: string, content: Buffer | string, type: string): void {
    try {
      const buffer = typeof content === 'string' ? Buffer.from(content) : content;
      allure.attachment(name, buffer, type as allure.ContentType);
    } catch {
      // Silently fail
    }
  }

  addDescription(description: string, type: 'text' | 'html' | 'markdown' = 'markdown'): void {
    try {
      if (type === 'html') {
        allure.descriptionHtml(description);
      } else {
        allure.description(description);
      }
    } catch {
      // Silently fail
    }
  }

  addSeverity(severity: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial'): void {
    try {
      allure.severity(severity as allure.Severity);
    } catch {
      // Silently fail
    }
  }

  addOwner(owner: string): void {
    try {
      allure.owner(owner);
    } catch {
      // Silently fail
    }
  }

  addIssue(url: string, name?: string): void {
    try {
      allure.issue(name || url, url);
    } catch {
      // Silently fail
    }
  }

  addLink(url: string, name?: string, type?: string): void {
    try {
      allure.link(url, name, type as allure.LinkType);
    } catch {
      // Silently fail
    }
  }

  addParameter(name: string, value: string): void {
    try {
      allure.parameter(name, value);
    } catch {
      // Silently fail
    }
  }

  async runStep<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return await allure.step(name, fn);
  }

  addEnvironmentInfo(info: Record<string, string>): void {
    Object.entries(info).forEach(([key, value]) => {
      try {
        allure.parameter(key, value);
      } catch {
        // Silently fail
      }
    });
  }
}
