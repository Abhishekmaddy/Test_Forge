import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

interface TestResult {
  name: string;
  status: string;
  duration?: number;
  errorMessage?: string;
  steps?: { name: string; status: string }[];
}

export class AnalysisTools {
  async analyzeFailures(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    const reportPath = args.report_path as string;
    const failureLog = args.failure_log as string;
    const includeSuggestions = (args.include_suggestions as boolean) ?? true;

    let failures: TestResult[] = [];

    if (reportPath) {
      const fullPath = path.join(PROJECT_ROOT, reportPath);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const report = JSON.parse(content);
        failures = this.extractFailures(report);
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error reading report: ${err instanceof Error ? err.message : String(err)}` }]
        };
      }
    }

    const analysis = this.performFailureAnalysis(failures, failureLog);
    const suggestions = includeSuggestions ? this.generateFixSuggestions(failures, failureLog) : '';

    return {
      content: [
        {
          type: 'text',
          text: `# Test Failure Analysis Report
Generated: ${new Date().toISOString()}

## Summary
- Total Failures: ${failures.length}
- Failure Categories: ${this.categorizeFailures(failures, failureLog).join(', ')}

## Detailed Analysis
${analysis}

${suggestions ? `## Fix Suggestions\n${suggestions}` : ''}

## Recommended Actions
${this.getRecommendedActions(failures, failureLog)}`
        }
      ]
    };
  }

  async analyzeCoverage(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    const featuresDir = path.join(PROJECT_ROOT, (args.features_dir as string) || 'features');

    try {
      const featureFiles = this.findFiles(featuresDir, '.feature');
      const scenarioCount = featureFiles.reduce((count, file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const scenarios = (content.match(/^\s*(Scenario|Scenario Outline):/gm) || []).length;
        return count + scenarios;
      }, 0);

      const tagSummary = this.analyzeTags(featureFiles);
      const coverageReport = {
        totalFeatureFiles: featureFiles.length,
        totalScenarios: scenarioCount,
        coverageByTag: tagSummary,
        projectKey: args.project_key
      };

      return {
        content: [
          {
            type: 'text',
            text: `# Test Coverage Analysis
Project: ${args.project_key}

## Statistics
- Feature Files: ${coverageReport.totalFeatureFiles}
- Total Scenarios: ${coverageReport.totalScenarios}

## Coverage by Tag
${Object.entries(tagSummary)
  .map(([tag, count]) => `- ${tag}: ${count} scenarios`)
  .join('\n')}

## Recommendations
${this.getCoverageRecommendations(coverageReport)}`
          }
        ]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error analyzing coverage: ${err instanceof Error ? err.message : String(err)}` }]
      };
    }
  }

  async generateReportSummary(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    const reportPath = path.join(PROJECT_ROOT, args.report_path as string);
    const format = (args.format as string) || 'markdown';

    let report: Record<string, unknown> = {};
    try {
      const content = fs.readFileSync(reportPath, 'utf-8');
      report = JSON.parse(content);
    } catch {
      report = {};
    }

    const summary = this.buildReportSummary(report, format);

    return {
      content: [{ type: 'text', text: summary }]
    };
  }

  // ============ Private Helpers ============
  private extractFailures(report: unknown): TestResult[] {
    const failures: TestResult[] = [];

    if (Array.isArray(report)) {
      // Cucumber JSON format
      for (const feature of report as Record<string, unknown>[]) {
        const elements = (feature.elements as Record<string, unknown>[]) || [];
        for (const scenario of elements) {
          const steps = (scenario.steps as Record<string, unknown>[]) || [];
          const failedStep = steps.find(
            s => (s.result as Record<string, unknown>)?.status === 'failed'
          );
          if (failedStep) {
            failures.push({
              name: scenario.name as string,
              status: 'failed',
              errorMessage: (failedStep.result as Record<string, unknown>)?.error_message as string,
              steps: steps.map(s => ({
                name: s.name as string,
                status: (s.result as Record<string, unknown>)?.status as string
              }))
            });
          }
        }
      }
    }

    return failures;
  }

  private categorizeFailures(failures: TestResult[], log?: string): string[] {
    const categories: Set<string> = new Set();
    const combined = [...failures.map(f => f.errorMessage || ''), log || ''].join(' ').toLowerCase();

    if (combined.includes('timeout')) categories.add('Timeout');
    if (combined.includes('element not found') || combined.includes('locator')) categories.add('Element Not Found');
    if (combined.includes('network') || combined.includes('xhr') || combined.includes('api')) categories.add('Network/API');
    if (combined.includes('assertion') || combined.includes('expect')) categories.add('Assertion Failure');
    if (combined.includes('navigation') || combined.includes('url')) categories.add('Navigation');
    if (combined.includes('auth') || combined.includes('login') || combined.includes('401')) categories.add('Authentication');
    if (combined.includes('data') || combined.includes('null') || combined.includes('undefined')) categories.add('Test Data');

    return categories.size > 0 ? Array.from(categories) : ['Unknown'];
  }

  private performFailureAnalysis(failures: TestResult[], log?: string): string {
    if (failures.length === 0 && !log) {
      return 'No failures found or no report provided.';
    }

    const lines: string[] = [];

    failures.forEach((failure, i) => {
      lines.push(`\n### Failure ${i + 1}: ${failure.name}`);
      lines.push(`**Error:** ${failure.errorMessage || 'Unknown error'}`);
      if (failure.steps) {
        const failedSteps = failure.steps.filter(s => s.status === 'failed');
        lines.push(`**Failed Steps:**`);
        failedSteps.forEach(s => lines.push(`  - ${s.name}`));
      }
    });

    if (log && failures.length === 0) {
      lines.push('### Log Analysis');
      const errorLines = log.split('\n').filter(l => /error|fail|exception/i.test(l));
      errorLines.slice(0, 10).forEach(l => lines.push(`  - ${l.trim()}`));
    }

    return lines.join('\n');
  }

  private generateFixSuggestions(failures: TestResult[], log?: string): string {
    const combined = [...failures.map(f => f.errorMessage || ''), log || ''].join(' ').toLowerCase();
    const suggestions: string[] = [];

    if (combined.includes('timeout')) {
      suggestions.push('⏱️ **Timeout Issues:**\n   - Increase timeout in `playwright.config.ts`\n   - Add explicit wait conditions (`waitForSelector`, `waitForLoadState`)\n   - Check for slow network or heavy page loads');
    }
    if (combined.includes('element not found') || combined.includes('locator')) {
      suggestions.push('🔍 **Element Not Found:**\n   - Verify selectors in Page Objects are correct\n   - Add `data-testid` attributes to elements\n   - Ensure elements are visible before interacting\n   - Check for dynamic content that may change selectors');
    }
    if (combined.includes('network') || combined.includes('401') || combined.includes('403')) {
      suggestions.push('🌐 **Network/Auth Issues:**\n   - Verify test credentials and tokens are valid\n   - Check API endpoint URLs in config\n   - Review CORS settings for test environment\n   - Ensure test environment is accessible');
    }
    if (combined.includes('assertion') || combined.includes('expect')) {
      suggestions.push('✅ **Assertion Failures:**\n   - Review expected vs actual values\n   - Add screenshots before assertions\n   - Check for race conditions with async operations\n   - Verify test data matches expected state');
    }

    if (suggestions.length === 0) {
      suggestions.push('📋 **General Recommendations:**\n   - Review the full error stack trace\n   - Run the test in headed mode to observe behavior\n   - Add more logging to identify the failure point\n   - Check if the failure is environment-specific');
    }

    return suggestions.join('\n\n');
  }

  private getRecommendedActions(failures: TestResult[], log?: string): string {
    const actions = [
      '1. Fix identified failures starting with highest priority',
      '2. Run failed tests in headed mode to observe browser behavior',
      '3. Update selectors using `npx playwright codegen` if needed',
      '4. Review environment configuration for connectivity issues',
      '5. Consider adding retry logic for flaky tests',
      '6. Update JIRA tickets with failure details and fix status'
    ];
    return actions.join('\n');
  }

  private analyzeTags(files: string[]): Record<string, number> {
    const tagCounts: Record<string, number> = {};

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const tags = content.match(/@\w+/g) || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.fromEntries(
      Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
    );
  }

  private getCoverageRecommendations(coverage: Record<string, unknown>): string {
    const recs: string[] = [];
    const total = coverage.totalScenarios as number;

    if (total < 10) recs.push('⚠️ Low test coverage - consider adding more scenarios');
    if (!coverage.coverageByTag || Object.keys(coverage.coverageByTag as object).length < 3) {
      recs.push('📌 Add more tags for better test categorization (@smoke, @regression, @critical)');
    }
    recs.push('✅ Ensure all JIRA stories have corresponding feature files');
    recs.push('📊 Target minimum 80% coverage of acceptance criteria');

    return recs.join('\n');
  }

  private buildReportSummary(report: Record<string, unknown>, format: string): string {
    const timestamp = new Date().toISOString();
    const env = process.env.ENV || 'staging';

    if (format === 'markdown') {
      return `# Test Execution Summary
**Generated:** ${timestamp}
**Environment:** ${env}

## Results
| Metric | Value |
|--------|-------|
| Total | ${(report.total as number) || 'N/A'} |
| Passed | ${(report.passed as number) || 'N/A'} |
| Failed | ${(report.failed as number) || 'N/A'} |
| Skipped | ${(report.skipped as number) || 'N/A'} |

## Status: ${(report.passed as number) > 0 && (report.failed as number) === 0 ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}
`;
    }

    return `Test Summary - ${timestamp}\nEnvironment: ${env}\nReport data: ${JSON.stringify(report, null, 2)}`;
  }

  private findFiles(dir: string, ext: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...this.findFiles(fullPath, ext));
      } else if (item.endsWith(ext)) {
        files.push(fullPath);
      }
    });

    return files;
  }
}
