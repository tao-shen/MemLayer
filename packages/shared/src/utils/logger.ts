// Simple logger interface
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

// Console logger implementation
export class ConsoleLogger implements Logger {
  constructor(private context?: string) {}

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${metaStr}`;
  }

  debug(message: string, meta?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    console.info(this.formatMessage(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  error(message: string, error?: Error, meta?: any): void {
    const errorMeta = error
      ? {
          ...meta,
          error: {
            message: error.message,
            stack: error.stack,
          },
        }
      : meta;
    console.error(this.formatMessage(LogLevel.ERROR, message, errorMeta));
  }
}

// Create logger instance
export function createLogger(context?: string): Logger {
  return new ConsoleLogger(context);
}
