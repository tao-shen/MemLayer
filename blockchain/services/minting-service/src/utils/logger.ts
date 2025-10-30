/**
 * Logger utility for Memory Minting Service
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

/**
 * Create logger instance
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'minting-service' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          let msg = `${timestamp} [${service}] ${level}: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      ),
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Log minting operation
 */
export function logMintOperation(
  operation: string,
  data: {
    requestId?: string;
    walletAddress?: string;
    status?: string;
    duration?: number;
    error?: any;
  }
): void {
  const { requestId, walletAddress, status, duration, error } = data;

  if (error) {
    logger.error(`Mint operation failed: ${operation}`, {
      requestId,
      walletAddress,
      status,
      duration,
      error: error.message || error,
      stack: error.stack,
    });
  } else {
    logger.info(`Mint operation: ${operation}`, {
      requestId,
      walletAddress,
      status,
      duration,
    });
  }
}

/**
 * Log batch operation
 */
export function logBatchOperation(
  operation: string,
  data: {
    batchId?: string;
    memoryCount?: number;
    successCount?: number;
    failedCount?: number;
    duration?: number;
    error?: any;
  }
): void {
  const { batchId, memoryCount, successCount, failedCount, duration, error } = data;

  if (error) {
    logger.error(`Batch operation failed: ${operation}`, {
      batchId,
      memoryCount,
      successCount,
      failedCount,
      duration,
      error: error.message || error,
      stack: error.stack,
    });
  } else {
    logger.info(`Batch operation: ${operation}`, {
      batchId,
      memoryCount,
      successCount,
      failedCount,
      duration,
    });
  }
}

/**
 * Log queue operation
 */
export function logQueueOperation(
  operation: string,
  data: {
    jobId?: string;
    queueName?: string;
    status?: string;
    error?: any;
  }
): void {
  const { jobId, queueName, status, error } = data;

  if (error) {
    logger.error(`Queue operation failed: ${operation}`, {
      jobId,
      queueName,
      status,
      error: error.message || error,
    });
  } else {
    logger.debug(`Queue operation: ${operation}`, {
      jobId,
      queueName,
      status,
    });
  }
}

/**
 * Log service health check
 */
export function logHealthCheck(
  service: string,
  status: 'up' | 'down' | 'degraded',
  latency?: number,
  error?: any
): void {
  if (status === 'down') {
    logger.error(`Service health check failed: ${service}`, {
      status,
      latency,
      error: error?.message || error,
    });
  } else if (status === 'degraded') {
    logger.warn(`Service degraded: ${service}`, {
      status,
      latency,
    });
  } else {
    logger.debug(`Service health check: ${service}`, {
      status,
      latency,
    });
  }
}

export default logger;
