import fs from 'fs';
import path from 'path';
import { Logger } from './logger';

export class TestDataManager {
  private static instance: TestDataManager;
  private dataCache: Map<string, unknown> = new Map();
  private logger: Logger;
  private dataDir: string;

  private constructor() {
    this.logger = new Logger('TestDataManager');
    this.dataDir = path.join(process.cwd(), 'src', 'config', 'test-data');
    this.ensureDataDirExists();
  }

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  private ensureDataDirExists(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadTestData<T>(fileName: string): T {
    const cacheKey = `${process.env.ENV || 'staging'}-${fileName}`;

    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey) as T;
    }

    const envDataFile = path.join(this.dataDir, process.env.ENV || 'staging', `${fileName}.json`);
    const defaultDataFile = path.join(this.dataDir, `${fileName}.json`);

    const filePath = fs.existsSync(envDataFile) ? envDataFile : defaultDataFile;

    if (!fs.existsSync(filePath)) {
      throw new Error(`Test data file not found: ${filePath}`);
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData) as T;

    this.dataCache.set(cacheKey, data);
    this.logger.debug(`Loaded test data: ${fileName}`);
    return data;
  }

  get<T>(key: string, dataFile = 'testdata'): T {
    const data = this.loadTestData<Record<string, unknown>>(dataFile);
    const value = this.getNestedValue(data, key);
    if (value === undefined) {
      throw new Error(`Test data key not found: ${key} in ${dataFile}`);
    }
    return value as T;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  generateRandomEmail(prefix = 'test'): string {
    const timestamp = Date.now();
    return `${prefix}+${timestamp}@example.com`;
  }

  generateRandomString(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  generateRandomNumber(min = 1, max = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateTimestamp(): string {
    return new Date().toISOString();
  }
}

export const testData = TestDataManager.getInstance();
