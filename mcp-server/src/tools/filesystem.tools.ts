import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

export class FileSystemTools {
  async readProjectFiles(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    const targetPath = path.join(PROJECT_ROOT, (args.path as string) || '');
    const pattern = (args.pattern as string) || '**/*';
    const includeContent = (args.include_content as boolean) || false;

    try {
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        const content = fs.readFileSync(targetPath, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ file: args.path, content }, null, 2)
            }
          ]
        };
      }

      const files = await glob(pattern, {
        cwd: targetPath,
        ignore: ['node_modules/**', 'dist/**', '.git/**']
      });

      const result: Record<string, unknown>[] = [];
      for (const file of files.slice(0, 50)) {
        const filePath = path.join(targetPath, file);
        const entry: Record<string, unknown> = { path: file };

        if (includeContent && fs.statSync(filePath).isFile()) {
          try {
            entry.content = fs.readFileSync(filePath, 'utf-8');
          } catch {
            entry.content = '[Binary or unreadable file]';
          }
        }
        result.push(entry);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ files: result, count: files.length }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading files: ${err instanceof Error ? err.message : String(err)}`
          }
        ]
      };
    }
  }

  async writeProjectFile(args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
    const filePath = path.join(PROJECT_ROOT, args.path as string);
    const content = args.content as string;
    const overwrite = (args.overwrite as boolean) ?? true;

    try {
      if (fs.existsSync(filePath) && !overwrite) {
        return {
          content: [
            {
              type: 'text',
              text: `File already exists: ${args.path}. Set overwrite=true to replace.`
            }
          ]
        };
      }

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, 'utf-8');

      return {
        content: [
          {
            type: 'text',
            text: `✅ File written successfully: ${args.path}\nSize: ${content.length} bytes`
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Error writing file: ${err instanceof Error ? err.message : String(err)}`
          }
        ]
      };
    }
  }

  async getArchitectureOverview(): Promise<string> {
    return `# Enterprise Automation Framework Architecture

## Directory Structure
\`\`\`
enterprise-automation-framework/
├── src/
│   ├── pages/          # Page Object Models
│   ├── steps/          # Cucumber Step Definitions  
│   ├── hooks/          # Before/After hooks & World
│   ├── utils/          # Helpers (Logger, Allure, JIRA, API)
│   ├── config/         # Config manager & test data
│   └── types/          # TypeScript interfaces
├── features/           # BDD Feature Files
│   ├── login/
│   ├── dashboard/
│   └── api/
├── mcp-server/         # MCP Server for AI assistance
├── reports/            # Test reports & artifacts
├── .github/workflows/  # GitHub Actions CI/CD
├── jenkins/            # Jenkins pipeline
├── docker/             # Docker configuration
└── scripts/            # Utility scripts
\`\`\`

## Key Components
- **Playwright**: Browser automation engine
- **Cucumber BDD**: Feature-driven testing
- **Page Object Model**: Maintainable UI abstractions
- **Allure Reporting**: Rich test reports
- **JIRA Integration**: Bidirectional sync
- **MCP Server**: AI-assisted test generation
- **Docker**: Containerized execution
- **GitHub Actions**: CI/CD pipelines
`;
  }

  async listFeatureFiles(): Promise<string> {
    const featuresDir = path.join(PROJECT_ROOT, 'features');
    try {
      const files = await glob('**/*.feature', {
        cwd: featuresDir,
        ignore: ['node_modules/**']
      });
      return files
        .map(f => {
          const content = fs.readFileSync(path.join(featuresDir, f), 'utf-8');
          const scenarios = (content.match(/^\s*(Scenario|Scenario Outline):/gm) || []).length;
          return `${f} (${scenarios} scenarios)`;
        })
        .join('\n');
    } catch {
      return 'No feature files found';
    }
  }
}
