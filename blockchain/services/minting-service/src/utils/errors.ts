/**
 * Error definitions for Memory Minting Service
 */

/**
 * Minting error codes
 */
export enum MintingErrorCode {
  // Validation errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  INVALID_WALLET = 'INVALID_WALLET',
  INVALID_MEMORY_DATA = 'INVALID_MEMORY_DATA',

  // Encryption errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  KEY_GENERATION_FAILED = 'KEY_GENERATION_FAILED',

  // Arweave errors
  ARWEAVE_UPLOAD_FAILED = 'ARWEAVE_UPLOAD_FAILED',
  ARWEAVE_INSUFFICIENT_BALANCE = 'ARWEAVE_INSUFFICIENT_BALANCE',

  // Solana errors
  SOLANA_TRANSACTION_FAILED = 'SOLANA_TRANSACTION_FAILED',
  SOLANA_INSUFFICIENT_BALANCE = 'SOLANA_INSUFFICIENT_BALANCE',
  SOLANA_NETWORK_ERROR = 'SOLANA_NETWORK_ERROR',
  PROGRAM_ERROR = 'PROGRAM_ERROR',
  
  // Transaction errors
  TRANSACTION_BUILD_FAILED = 'TRANSACTION_BUILD_FAILED',
  TRANSACTION_SIGN_FAILED = 'TRANSACTION_SIGN_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Batch errors
  BATCH_SIZE_EXCEEDED = 'BATCH_SIZE_EXCEEDED',
  BATCH_PROCESSING_FAILED = 'BATCH_PROCESSING_FAILED',

  // Queue errors
  QUEUE_ERROR = 'QUEUE_ERROR',
  JOB_TIMEOUT = 'JOB_TIMEOUT',
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  
  // State errors
  STATE_SAVE_FAILED = 'STATE_SAVE_FAILED',
  STATE_LOAD_FAILED = 'STATE_LOAD_FAILED',

  // Service errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Minting error class
 */
export class MintingError extends Error {
  constructor(
    public code: MintingErrorCode,
    message: string,
    public details?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'MintingError';
    Object.setPrototypeOf(this, MintingError.prototype);
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
 * Create validation error
 */
export function createValidationError(message: string, details?: any): MintingError {
  return new MintingError(MintingErrorCode.INVALID_REQUEST, message, details, false);
}

/**
 * Create encryption error
 */
export function createEncryptionError(message: string, details?: any): MintingError {
  return new MintingError(MintingErrorCode.ENCRYPTION_FAILED, message, details, true);
}

/**
 * Create Arweave error
 */
export function createArweaveError(message: string, details?: any): MintingError {
  return new MintingError(MintingErrorCode.ARWEAVE_UPLOAD_FAILED, message, details, true);
}

/**
 * Create Solana error
 */
export function createSolanaError(message: string, details?: any): MintingError {
  return new MintingError(MintingErrorCode.SOLANA_TRANSACTION_FAILED, message, details, true);
}

/**
 * Create batch error
 */
export function createBatchError(message: string, details?: any): MintingError {
  return new MintingError(MintingErrorCode.BATCH_PROCESSING_FAILED, message, details, false);
}

/**
 * Create queue error
 */
export function createQueueError(message: string, details?: any): MintingError {
  return new MintingError(MintingErrorCode.QUEUE_ERROR, message, details, true);
}

/**
 * Create database error
 */
export function createDatabaseError(message: string, details?: any): MintingError {
  return new MintingError(MintingErrorCode.DATABASE_ERROR, message, details, true);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof MintingError) {
    return error.isRetryable();
  }

  // Check for common retryable error patterns
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('unavailable') ||
    message.includes('rate limit')
  );
}

/**
 * Classify error
 */
export function classifyError(error: any): MintingError {
  if (error instanceof MintingError) {
    return error;
  }

  const message = error.message || String(error);

  // Validation errors
  if (message.includes('invalid') || message.includes('validation')) {
    return createValidationError(message, { originalError: error });
  }

  // Encryption errors
  if (message.includes('encrypt') || message.includes('key')) {
    return createEncryptionError(message, { originalError: error });
  }

  // Arweave errors
  if (message.includes('arweave') || message.includes('upload')) {
    return createArweaveError(message, { originalError: error });
  }

  // Solana errors
  if (message.includes('solana') || message.includes('transaction')) {
    return createSolanaError(message, { originalError: error });
  }

  // Queue errors
  if (message.includes('queue') || message.includes('job')) {
    return createQueueError(message, { originalError: error });
  }

  // Database errors
  if (message.includes('database') || message.includes('postgres')) {
    return createDatabaseError(message, { originalError: error });
  }

  // Unknown error
  return new MintingError(
    MintingErrorCode.UNKNOWN_ERROR,
    message,
    { originalError: error },
    isRetryableError(error)
  );
}
