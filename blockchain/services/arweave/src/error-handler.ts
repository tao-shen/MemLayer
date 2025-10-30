/**
 * Arweave Error Handler
 * Centralized error handling for Arweave operations
 */

/**
 * Arweave error codes
 */
export enum ArweaveErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // Wallet errors
  WALLET_NOT_LOADED = 'WALLET_NOT_LOADED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_WALLET = 'INVALID_WALLET',
  
  // Transaction errors
  TRANSACTION_CREATION_FAILED = 'TRANSACTION_CREATION_FAILED',
  TRANSACTION_SIGNING_FAILED = 'TRANSACTION_SIGNING_FAILED',
  TRANSACTION_POST_FAILED = 'TRANSACTION_POST_FAILED',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  TRANSACTION_INVALID = 'TRANSACTION_INVALID',
  
  // Upload errors
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  UPLOAD_TIMEOUT = 'UPLOAD_TIMEOUT',
  UPLOAD_TOO_LARGE = 'UPLOAD_TOO_LARGE',
  UPLOAD_REJECTED = 'UPLOAD_REJECTED',
  
  // Retrieval errors
  RETRIEVAL_FAILED = 'RETRIEVAL_FAILED',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CORRUPTED = 'DATA_CORRUPTED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  
  // Gateway errors
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  GATEWAY_UNAVAILABLE = 'GATEWAY_UNAVAILABLE',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Arweave error class
 */
export class ArweaveError extends Error {
  constructor(
    public code: ArweaveErrorCode,
    message: string,
    public details?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ArweaveError';
    Object.setPrototypeOf(this, ArweaveError.prototype);
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Convert to JSON
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      retryable: this.retryable,
    };
  }
}

/**
 * Error handler class
 */
export class ErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private maxLogSize: number = 1000;

  /**
   * Handle error and convert to ArweaveError
   */
  handleError(error: any, context?: string): ArweaveError {
    const arweaveError = this.classifyError(error, context);
    this.logError(arweaveError, context);
    return arweaveError;
  }

  /**
   * Classify error and create appropriate ArweaveError
   */
  private classifyError(error: any, context?: string): ArweaveError {
    // Network errors
    if (this.isNetworkError(error)) {
      return new ArweaveError(
        ArweaveErrorCode.NETWORK_ERROR,
        `Network error: ${error.message}`,
        { originalError: error, context },
        true // retryable
      );
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      return new ArweaveError(
        ArweaveErrorCode.TIMEOUT_ERROR,
        `Request timeout: ${error.message}`,
        { originalError: error, context },
        true
      );
    }

    // Connection refused
    if (this.isConnectionRefused(error)) {
      return new ArweaveError(
        ArweaveErrorCode.CONNECTION_REFUSED,
        `Connection refused: ${error.message}`,
        { originalError: error, context },
        true
      );
    }

    // Wallet errors
    if (error.message?.includes('wallet') || error.message?.includes('Wallet')) {
      if (error.message.includes('not loaded')) {
        return new ArweaveError(
          ArweaveErrorCode.WALLET_NOT_LOADED,
          'Wallet not loaded',
          { originalError: error, context },
          false
        );
      }
      if (error.message.includes('balance') || error.message.includes('insufficient')) {
        return new ArweaveError(
          ArweaveErrorCode.INSUFFICIENT_BALANCE,
          'Insufficient wallet balance',
          { originalError: error, context },
          false
        );
      }
      return new ArweaveError(
        ArweaveErrorCode.INVALID_WALLET,
        `Invalid wallet: ${error.message}`,
        { originalError: error, context },
        false
      );
    }

    // Transaction errors
    if (error.message?.includes('transaction')) {
      if (error.message.includes('create')) {
        return new ArweaveError(
          ArweaveErrorCode.TRANSACTION_CREATION_FAILED,
          `Transaction creation failed: ${error.message}`,
          { originalError: error, context },
          true
        );
      }
      if (error.message.includes('sign')) {
        return new ArweaveError(
          ArweaveErrorCode.TRANSACTION_SIGNING_FAILED,
          `Transaction signing failed: ${error.message}`,
          { originalError: error, context },
          false
        );
      }
      if (error.message.includes('post')) {
        return new ArweaveError(
          ArweaveErrorCode.TRANSACTION_POST_FAILED,
          `Transaction post failed: ${error.message}`,
          { originalError: error, context },
          true
        );
      }
      if (error.message.includes('not found')) {
        return new ArweaveError(
          ArweaveErrorCode.TRANSACTION_NOT_FOUND,
          `Transaction not found: ${error.message}`,
          { originalError: error, context },
          true
        );
      }
    }

    // Upload errors
    if (context?.includes('upload') || error.message?.includes('upload')) {
      if (error.message.includes('timeout')) {
        return new ArweaveError(
          ArweaveErrorCode.UPLOAD_TIMEOUT,
          `Upload timeout: ${error.message}`,
          { originalError: error, context },
          true
        );
      }
      if (error.message.includes('too large') || error.message.includes('size')) {
        return new ArweaveError(
          ArweaveErrorCode.UPLOAD_TOO_LARGE,
          `Upload too large: ${error.message}`,
          { originalError: error, context },
          false
        );
      }
      if (error.message.includes('rejected')) {
        return new ArweaveError(
          ArweaveErrorCode.UPLOAD_REJECTED,
          `Upload rejected: ${error.message}`,
          { originalError: error, context },
          false
        );
      }
      return new ArweaveError(
        ArweaveErrorCode.UPLOAD_FAILED,
        `Upload failed: ${error.message}`,
        { originalError: error, context },
        true
      );
    }

    // Retrieval errors
    if (context?.includes('retriev') || error.message?.includes('retriev')) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return new ArweaveError(
          ArweaveErrorCode.DATA_NOT_FOUND,
          `Data not found: ${error.message}`,
          { originalError: error, context },
          true
        );
      }
      if (error.message.includes('corrupt') || error.message.includes('invalid')) {
        return new ArweaveError(
          ArweaveErrorCode.DATA_CORRUPTED,
          `Data corrupted: ${error.message}`,
          { originalError: error, context },
          false
        );
      }
      return new ArweaveError(
        ArweaveErrorCode.RETRIEVAL_FAILED,
        `Retrieval failed: ${error.message}`,
        { originalError: error, context },
        true
      );
    }

    // Gateway errors
    if (error.message?.includes('gateway') || error.message?.includes('Gateway')) {
      if (error.message.includes('timeout')) {
        return new ArweaveError(
          ArweaveErrorCode.GATEWAY_TIMEOUT,
          `Gateway timeout: ${error.message}`,
          { originalError: error, context },
          true
        );
      }
      if (error.message.includes('unavailable') || error.message.includes('503')) {
        return new ArweaveError(
          ArweaveErrorCode.GATEWAY_UNAVAILABLE,
          `Gateway unavailable: ${error.message}`,
          { originalError: error, context },
          true
        );
      }
      return new ArweaveError(
        ArweaveErrorCode.GATEWAY_ERROR,
        `Gateway error: ${error.message}`,
        { originalError: error, context },
        true
      );
    }

    // Rate limiting
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      return new ArweaveError(
        ArweaveErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded: ${error.message}`,
        { originalError: error, context },
        true
      );
    }

    // Unknown error
    return new ArweaveError(
      ArweaveErrorCode.UNKNOWN_ERROR,
      `Unknown error: ${error.message || error}`,
      { originalError: error, context },
      false
    );
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    return (
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ENETUNREACH' ||
      error.message?.includes('network') ||
      error.message?.includes('Network')
    );
  }

  /**
   * Check if error is timeout
   */
  private isTimeoutError(error: any): boolean {
    return (
      error.code === 'ETIMEDOUT' ||
      error.code === 'ESOCKETTIMEDOUT' ||
      error.message?.includes('timeout') ||
      error.message?.includes('timed out')
    );
  }

  /**
   * Check if connection refused
   */
  private isConnectionRefused(error: any): boolean {
    return (
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('connection refused') ||
      error.message?.includes('Connection refused')
    );
  }

  /**
   * Log error
   */
  private logError(error: ArweaveError, context?: string): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      code: error.code,
      message: error.message,
      context,
      retryable: error.retryable,
      details: error.details,
    };

    this.errorLog.push(entry);

    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console log for debugging
    console.error(`[ArweaveError] ${error.code}: ${error.message}`, {
      context,
      retryable: error.retryable,
      details: error.details,
    });
  }

  /**
   * Get error log
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errorLog.length,
      byCode: {},
      retryable: 0,
      nonRetryable: 0,
    };

    for (const entry of this.errorLog) {
      // Count by code
      if (!stats.byCode[entry.code]) {
        stats.byCode[entry.code] = 0;
      }
      stats.byCode[entry.code]++;

      // Count retryable
      if (entry.retryable) {
        stats.retryable++;
      } else {
        stats.nonRetryable++;
      }
    }

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Set max log size
   */
  setMaxLogSize(size: number): void {
    this.maxLogSize = size;
  }
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  timestamp: Date;
  code: ArweaveErrorCode;
  message: string;
  context?: string;
  retryable: boolean;
  details?: any;
}

/**
 * Error statistics
 */
export interface ErrorStats {
  total: number;
  byCode: Record<string, number>;
  retryable: number;
  nonRetryable: number;
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ArweaveErrorCode[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    ArweaveErrorCode.NETWORK_ERROR,
    ArweaveErrorCode.TIMEOUT_ERROR,
    ArweaveErrorCode.CONNECTION_REFUSED,
    ArweaveErrorCode.TRANSACTION_CREATION_FAILED,
    ArweaveErrorCode.TRANSACTION_POST_FAILED,
    ArweaveErrorCode.TRANSACTION_NOT_FOUND,
    ArweaveErrorCode.UPLOAD_FAILED,
    ArweaveErrorCode.UPLOAD_TIMEOUT,
    ArweaveErrorCode.RETRIEVAL_FAILED,
    ArweaveErrorCode.DATA_NOT_FOUND,
    ArweaveErrorCode.GATEWAY_ERROR,
    ArweaveErrorCode.GATEWAY_TIMEOUT,
    ArweaveErrorCode.GATEWAY_UNAVAILABLE,
    ArweaveErrorCode.RATE_LIMIT_EXCEEDED,
  ],
};

/**
 * Retry helper function
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  errorHandler: ErrorHandler = new ErrorHandler(),
  context?: string
): Promise<T> {
  let lastError: ArweaveError | null = null;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = errorHandler.handleError(error, context);

      // Check if error is retryable
      if (!lastError.isRetryable() || !config.retryableErrors.includes(lastError.code)) {
        throw lastError;
      }

      // Don't wait after last attempt
      if (attempt < config.maxRetries) {
        console.log(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms`);
        await sleep(delay);
        
        // Exponential backoff
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  throw lastError || new ArweaveError(
    ArweaveErrorCode.UNKNOWN_ERROR,
    'Operation failed after retries',
    { context },
    false
  );
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();
