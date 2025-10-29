import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, createLogger } from '@agent-memory/shared';

const logger = createLogger('ErrorHandler');

/**
 * Global error handling middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Log error
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Handle known errors
  if (err instanceof AppError) {
    const response = formatErrorResponse(err, req.headers['x-request-id'] as string);
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    },
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
