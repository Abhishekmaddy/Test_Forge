import fs from 'fs';
import path from 'path';
import { JiraTools } from './jira.tools.js';
import { PromptBuilder, PromptType } from '../utils/prompt-builder.js';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

export class TestGenerationTools {
  private jiraTools: JiraTools;

  constructor() {
    this.jiraTools = new JiraTools();
  }

  async generateFeatureFile(
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    let userStory = (args.user_story as string) || '';
    let acceptanceCriteria: string[] = (args.acceptance_criteria as string[]) || [];
    let jiraKey = (args.jira_key as string) || '';

    // If JIRA key provided, fetch story
    if (jiraKey) {
      const jiraResult = await this.jiraTools.getStory({ issue_key: jiraKey });
      try {
        const storyData = JSON.parse(jiraResult.content[0].text);
        if (!storyData.error) {
          userStory = storyData.summary || userStory;
          if (storyData.acceptanceCriteria) {
            acceptanceCriteria = storyData.acceptanceCriteria
              .split('\n')
              .filter((line: string) => line.trim().length > 0);
          }
        }
      } catch {
        // Non-JSON response, continue with provided args
      }
    }

    const tags = (args.tags as string[]) || ['@regression'];
    const featureName = userStory || 'Generated Feature';
    const outputPath = (args.output_path as string) || `features/generated/${this.toKebabCase(featureName)}.feature`;

    const featureContent = this.buildFeatureFile(featureName, acceptanceCriteria, tags, jiraKey);

    // Write file if output path specified
    const fullPath = path.join(PROJECT_ROOT, outputPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, featureContent, 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Feature file generated: ${outputPath}\n\n\`\`\`gherkin\n${featureContent}\n\`\`\``
        }
      ]
    };
  }

  async buildQaPrompt(
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    let userStory = (args.user_story as string) || '';
    const jiraKey = (args.jira_key as string) || '';
    const context = (args.context as string) || '';

    if (jiraKey) {
      const jiraResult = await this.jiraTools.getStory({ issue_key: jiraKey });
      try {
        const storyData = JSON.parse(jiraResult.content[0].text);
        if (!storyData.error) {
          userStory = storyData.summary || userStory;
        }
      } catch {
        // Non-JSON response, continue with provided args
      }
    }

    if (!userStory) {
      return {
        content: [
          { type: 'text', text: '❌ Either user_story or jira_key is required to build a QA prompt.' }
        ]
      };
    }

    const promptType = ((args.prompt_type as string) || PromptType.BOTH) as PromptType;
    const prompt = PromptBuilder.build(promptType, userStory, context);

    return {
      content: [{ type: 'text', text: prompt }]
    };
  }

  async generatePageObject(
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    const pageName = (args.page_name as string) || 'GeneratedPage';
    const pageUrl = (args.page_url as string) || '/page';
    const elements = (args.elements as Record<string, string>[]) || [];
    const outputPath =
      (args.output_path as string) || `src/pages/${this.toKebabCase(pageName)}.page.ts`;

    const pageContent = this.buildPageObject(pageName, pageUrl, elements);

    const fullPath = path.join(PROJECT_ROOT, outputPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, pageContent, 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Page Object generated: ${outputPath}\n\n\`\`\`typescript\n${pageContent}\n\`\`\``
        }
      ]
    };
  }

  async generateStepDefinitions(
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    const featurePath = path.join(PROJECT_ROOT, args.feature_file_path as string);
    const pageObjects = (args.page_objects as string[]) || [];
    const outputPath =
      (args.output_path as string) || `src/steps/generated.steps.ts`;

    let featureContent = '';
    try {
      featureContent = fs.readFileSync(featurePath, 'utf-8');
    } catch {
      featureContent = '# Feature file not found';
    }

    const steps = this.extractStepsFromFeature(featureContent);
    const stepsContent = this.buildStepDefinitions(steps, pageObjects);

    const fullPath = path.join(PROJECT_ROOT, outputPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, stepsContent, 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Step definitions generated: ${outputPath}\n${steps.length} steps found\n\n\`\`\`typescript\n${stepsContent}\n\`\`\``
        }
      ]
    };
  }

  async generatePlaywrightTest(
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    const testName = (args.test_name as string) || 'generated-test';
    const testCases = (args.test_cases as Record<string, unknown>[]) || [];
    const pageObject = (args.page_object as string) || '';
    const outputPath =
      (args.output_path as string) || `src/tests/${this.toKebabCase(testName)}.spec.ts`;

    const testContent = this.buildPlaywrightTest(testName, testCases, pageObject);

    const fullPath = path.join(PROJECT_ROOT, outputPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, testContent, 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `✅ Playwright test generated: ${outputPath}\n\n\`\`\`typescript\n${testContent}\n\`\`\``
        }
      ]
    };
  }

  async runFullWorkflow(
    args: Record<string, unknown>
  ): Promise<{ content: { type: string; text: string }[] }> {
    const jiraKey = (args.jira_key as string) || '';
    if (!jiraKey) {
      return { content: [{ type: 'text', text: '❌ jira_key is required for full_automation_workflow' }] };
    }
    const outputDir = (args.output_dir as string) || `features/generated/${jiraKey.toLowerCase()}`;
    const results: string[] = [];

    results.push(`🚀 Starting Full Automation Workflow for ${jiraKey}`);
    results.push('═'.repeat(60));

    // Step 1: Fetch JIRA Story
    results.push('\n📋 Step 1: Fetching JIRA Story...');
    const storyResult = await this.jiraTools.getStory({ issue_key: jiraKey });
    results.push(storyResult.content[0].text);

    // Step 2: Generate Feature File
    results.push('\n📝 Step 2: Generating Feature File...');
    const featureResult = await this.generateFeatureFile({
      jira_key: jiraKey,
      output_path: `${outputDir}/${jiraKey.toLowerCase()}.feature`
    });
    results.push(featureResult.content[0].text);

    // Step 3: Generate Step Definitions
    results.push('\n⚡ Step 3: Generating Step Definitions...');
    const stepsResult = await this.generateStepDefinitions({
      feature_file_path: `${outputDir}/${jiraKey.toLowerCase()}.feature`,
      output_path: `src/steps/${jiraKey.toLowerCase()}.steps.ts`
    });
    results.push(stepsResult.content[0].text);

    // Step 4: Generate Page Object (if needed)
    results.push('\n🏗️  Step 4: Generating Page Object...');
    const pageResult = await this.generatePageObject({
      page_name: `${jiraKey}Page`,
      output_path: `src/pages/${jiraKey.toLowerCase()}.page.ts`
    });
    results.push(pageResult.content[0].text);

    // Step 5: Create JIRA Automation Task
    results.push('\n📌 Step 5: Creating JIRA Automation Task...');
    const taskResult = await this.jiraTools.createAutomationTask({
      parent_story: jiraKey,
      summary: `[Automation] Test automation for ${jiraKey}`,
      description: `Auto-generated automation task for story ${jiraKey}.\n\nFiles generated:\n- Feature: ${outputDir}/${jiraKey.toLowerCase()}.feature\n- Steps: src/steps/${jiraKey.toLowerCase()}.steps.ts\n- Page: src/pages/${jiraKey.toLowerCase()}.page.ts`
    });
    results.push(taskResult.content[0].text);

    results.push('\n' + '═'.repeat(60));
    results.push('✅ Full automation workflow completed successfully!');
    results.push(`📂 Generated files in: ${outputDir}`);

    return {
      content: [{ type: 'text', text: results.join('\n') }]
    };
  }

  // ============ Code Generation Helpers ============
  private buildFeatureFile(
    title: string,
    criteria: string[],
    tags: string[],
    jiraKey: string
  ): string {
    const tagStr = [...tags, jiraKey ? `@${jiraKey}` : ''].filter(Boolean).join(' ');

    const scenarios = criteria.length
      ? this.criteriaToScenarios(criteria)
      : this.generateDefaultScenarios(title);

    return `${tagStr}
Feature: ${title}
  As a user
  I want to ${title.toLowerCase()}
  So that I can achieve my business goals

  Background:
    Given I am on the application
    And I am logged in as a valid user

${scenarios}`;
  }

  private criteriaToScenarios(criteria: string[]): string {
    const scenarios: string[] = [];
    let currentScenario: string[] = [];
    let scenarioIndex = 0;

    for (const line of criteria) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Given') || (trimmed === '' && currentScenario.length > 0)) {
        if (currentScenario.length > 0) {
          scenarios.push(
            `  @scenario-${++scenarioIndex}\n  Scenario: Acceptance Criteria ${scenarioIndex}\n    ${currentScenario.join('\n    ')}`
          );
          currentScenario = [];
        }
      }
      if (trimmed) currentScenario.push(trimmed);
    }

    if (currentScenario.length > 0) {
      scenarios.push(
        `  @scenario-${++scenarioIndex}\n  Scenario: Acceptance Criteria ${scenarioIndex}\n    ${currentScenario.join('\n    ')}`
      );
    }

    return scenarios.join('\n\n');
  }

  private generateDefaultScenarios(feature: string): string {
    const name = feature.replace(/[^a-zA-Z0-9 ]/g, '');
    return `  @smoke @happy-path
  Scenario: Successful ${name} - Happy Path
    When I perform the primary action for ${name}
    Then the operation should complete successfully
    And I should see a success confirmation

  @negative
  Scenario: Failed ${name} - Invalid Input
    When I provide invalid input for ${name}
    Then I should see an appropriate error message
    And the system should remain in a stable state

  @edge-case
  Scenario: ${name} - Boundary Conditions
    When I test boundary conditions for ${name}
    Then the system should handle edge cases gracefully`;
  }

  private buildPageObject(
    pageName: string,
    pageUrl: string,
    elements: Record<string, string>[]
  ): string {
    const className = pageName.endsWith('Page') ? pageName : `${pageName}Page`;

    const locators = elements
      .map(
        el => `  private readonly ${el.name}: Locator;`
      )
      .join('\n');

    const constructorBody = elements
      .map(
        el =>
          `    this.${el.name} = page.locator('${el.selector || `[data-testid="${el.name}"]`}');`
      )
      .join('\n');

    const methods = elements
      .map(el => {
        if (el.type === 'button' || el.type === 'link') {
          return `  async click${this.capitalize(el.name)}(): Promise<void> {\n    await this.click(this.${el.name}, '${el.name}');\n  }`;
        }
        if (el.type === 'input') {
          return `  async enter${this.capitalize(el.name)}(value: string): Promise<void> {\n    await this.fill(this.${el.name}, value, '${el.name}');\n  }`;
        }
        return `  async get${this.capitalize(el.name)}Text(): Promise<string> {\n    return await this.getText(this.${el.name});\n  }`;
      })
      .join('\n\n');

    return `import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '@config/config.manager';

export class ${className} extends BasePage {
  protected pageUrl = \`\${config.baseUrl}${pageUrl}\`;
  protected pageTitle = '${pageName.replace('Page', '')}';

  // ============ Locators ============
${locators || '  // Add your locators here'}

  constructor(page: Page) {
    super(page);
${constructorBody || '    // Initialize your locators here'}
  }

  // ============ Actions ============
${methods || '  // Add your action methods here'}

  // ============ Assertions ============
  async verifyPageLoaded(): Promise<void> {
    await super.verifyPageLoaded();
    // Add page-specific assertions
  }
}
`;
  }

  private extractStepsFromFeature(content: string): string[] {
    const stepPattern = /^\s*(Given|When|Then|And|But)\s+(.+)/gm;
    const steps: Set<string> = new Set();
    let match;

    while ((match = stepPattern.exec(content)) !== null) {
      const stepText = match[2].trim()
        .replace(/"[^"]+"/g, '{string}')
        .replace(/\d+/g, '{int}');
      steps.add(`${match[1].trim()} ${stepText}`);
    }

    return Array.from(steps);
  }

  private buildStepDefinitions(steps: string[], pageObjects: string[]): string {
    const imports = [
      `import { Given, When, Then } from '@cucumber/cucumber';`,
      `import { CustomWorld } from '@hooks/world';`,
      ...pageObjects.map(po => `import { ${po} } from '@pages/${this.toKebabCase(po)}.page';`)
    ].join('\n');

    const stepDefs = steps
      .map(step => {
        const [keyword, ...rest] = step.split(' ');
        const stepText = rest.join(' ');
        const fnName = keyword === 'Given' ? 'Given' : keyword === 'When' ? 'When' : 'Then';
        const params = (stepText.match(/\{string\}|\{int\}|\{float\}/g) || []).map(
          (p, i) => `param${i + 1}: ${p === '{int}' || p === '{float}' ? 'number' : 'string'}`
        );
        const paramStr = params.length ? `, ${params.join(', ')}` : '';

        return `${fnName}('${stepText}', async function (this: CustomWorld${paramStr}) {
  // TODO: Implement step: ${step}
  throw new Error('Step not implemented: ${step}');
});`;
      })
      .join('\n\n');

    return `${imports}

// Auto-generated step definitions
// Generated at: ${new Date().toISOString()}

${stepDefs}
`;
  }

  private buildPlaywrightTest(
    testName: string,
    testCases: Record<string, unknown>[],
    pageObject: string
  ): string {
    const importPO = pageObject
      ? `import { ${pageObject} } from '@pages/${this.toKebabCase(pageObject)}.page';`
      : '';

    const tests = testCases.length
      ? testCases
          .map(tc => {
            const steps = (tc.steps as string[]) || [];
            const assertions = (tc.assertions as string[]) || [];
            return `  test('${tc.name}', async ({ page }) => {
${pageObject ? `    const po = new ${pageObject}(page);\n    await po.navigate();\n` : ''}
    // Steps
${steps.map(s => `    // ${s}`).join('\n')}

    // Assertions
${assertions.map(a => `    // ${a}`).join('\n')}
  });`;
          })
          .join('\n\n')
      : `  test('${testName} - happy path', async ({ page }) => {
    // TODO: Implement test
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });`;

    return `import { test, expect } from '@playwright/test';
${importPO}

// Auto-generated Playwright test
// Generated at: ${new Date().toISOString()}

test.describe('${testName}', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
    await page.goto('/');
  });

${tests}
});
`;
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/\s+/g, '-');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
