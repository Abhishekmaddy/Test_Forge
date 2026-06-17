import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, context }) => {
  const ctx = context ? `[${context}] ` : '';
  const msg = stack || message;
  return `${ts} ${level}: ${ctx}${msg}`;
});

const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = path.join('reports/logs', `test-run-${new Date().toISOString().split('T')[0]}.log`);

// Shared winston instance backing every Logger wrapper below. winston registers
// a process-level 'uncaughtException' listener per exceptionHandlers-configured
// instance and never removes it; since Logger is constructed repeatedly per
// scenario (e.g. a new page object, and thus a new Logger, on nearly every
// step), creating a fresh winston.createLogger(...) each time exceeded Node's
// default listener limit. Using .child() reuses the same transports/handlers.
const baseLogger = winston.createLogger({
  level: logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' })
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss.SSS' }),
        logFormat
      )
    }),
    // File transport
    new winston.transports.File({
      filename: logFile,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        logFormat
      ),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Error-only file transport
    new winston.transports.File({
      filename: 'reports/logs/errors.log',
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        logFormat
      )
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'reports/logs/exceptions.log' })
  ]
});

export class Logger {
  private logger: winston.Logger;

  constructor(context: string) {
    this.logger = baseLogger.child({ context });
  }

  info(message: string, ...meta: unknown[]): void {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.logger.error(message, ...meta);
  }

  debug(message: string, ...meta: unknown[]): void {
    this.logger.debug(message, ...meta);
  }

  verbose(message: string, ...meta: unknown[]): void {
    this.logger.verbose(message, ...meta);
  }

  startScenario(name: string): void {
    this.info(`\n${'═'.repeat(70)}`);
    this.info(`Scenario: ${name}`);
    this.info('═'.repeat(70));
  }

  endScenario(name: string, status: string, duration: number): void {
    this.info(`\nScenario "${name}": ${status} (${duration}ms)`);
    this.info('═'.repeat(70));
  }

  step(text: string): void {
    this.info(`  ► ${text}`);
  }

  table(data: Record<string, string>[]): void {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const maxLen = headers.reduce(
      (acc, h) => ({
        ...acc,
        [h]: Math.max(h.length, ...data.map(row => String(row[h] || '').length))
      }),
      {} as Record<string, number>
    );

    const separator = headers.map(h => '-'.repeat(maxLen[h] + 2)).join('+');
    const headerRow = headers.map(h => ` ${h.padEnd(maxLen[h])} `).join('|');

    this.info(`+${separator}+`);
    this.info(`|${headerRow}|`);
    this.info(`+${separator}+`);

    data.forEach(row => {
      const dataRow = headers.map(h => ` ${String(row[h] || '').padEnd(maxLen[h])} `).join('|');
      this.info(`|${dataRow}|`);
    });

    this.info(`+${separator}+`);
  }
}

// Default logger instance
export const logger = new Logger('Framework');
