/**
 * Structured logger for test automation
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private readonly minLevel: LogLevel;
  private logs: LogEntry[] = [];

  private constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  static getInstance(minLevel?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(minLevel);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    this.logs.push(entry);
    return entry;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatEntry('debug', message, context);
      console.log(`[DEBUG] ${entry.timestamp} - ${message}`, context ? context : '');
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      const entry = this.formatEntry('info', message, context);
      console.log(`[INFO] ${entry.timestamp} - ${message}`, context ? context : '');
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatEntry('warn', message, context);
      console.warn(`[WARN] ${entry.timestamp} - ${message}`, context ? context : '');
    }
  }

  error(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      const entry = this.formatEntry('error', message, context);
      console.error(`[ERROR] ${entry.timestamp} - ${message}`, context ? context : '');
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log a test step with step number
   */
  static step(stepNumber: number, message: string, context?: Record<string, any>): void {
    console.log(`\n📋 Step ${stepNumber}: ${message}`);
    if (context) {
      console.log('   Context:', JSON.stringify(context, null, 2));
    }
  }
}

export const logger = Logger.getInstance();
