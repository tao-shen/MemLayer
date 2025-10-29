import { Request, Response, NextFunction } from 'express';
import * as cache from '@agent-memory/cache';
import { RateLimitError, createLogger } from '@agent-memory/shared';

const logger = createLogger('RateLimitMiddleware');

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

/**
 * Token bucket rate limiter
 */
export function rateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate key for this client
      const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);
      const rateLimitKey = `ratelimit:${key}`;

      // Get current count
      const current = await cache.get<number>(rateLimitKey);
      const count = current || 0;

      if (count >= maxRequests) {
        // Rate limit exceeded
        const ttl = await cache.ttl(rateLimitKey);
        const resetTime = Date.now() + ttl * 1000;

        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', resetTime.toString());

        throw new RateLimitError('Rate limit exceeded');
      }

      // Increment counter
      if (count === 0) {
        // First request in window
        await cache.set(rateLimitKey, 1, Math.floor(windowMs / 1000));
      } else {
        await cache.incr(rateLimitKey);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count - 1).toString());

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn('Rate limit exceeded', { key: req.ip });
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        logger.error('Rate limit check failed', error as Error);
        // On error, allow request through
        next();
      }
    }
  };
}

/**
 * Default key generator (by IP)
 */
function getDefaultKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Key generator by user ID
 */
export function keyByUser(req: Request): string {
  const user = (req as any).user;
  return user?.userId || getDefaultKey(req);
}

/**
 * Key generator by API key
 */
export function keyByAPIKey(req: Request): string {
  const apiKeyHeader = process.env.API_KEY_HEADER || 'X-API-Key';
  const apiKey = req.headers[apiKeyHeader.toLowerCase()];
  return (apiKey as string) || getDefaultKey(req);
}

/**
 * Preset rate limiters
 */
export const rateLimiters = {
  // Strict: 10 requests per minute
  strict: rateLimiter({
    windowMs: 60000,
    maxRequests: 10,
  }),

  // Standard: 100 requests per minute
  standard: rateLimiter({
    windowMs: 60000,
    maxRequests: 100,
  }),

  // Generous: 1000 requests per minute
  generous: rateLimiter({
    windowMs: 60000,
    maxRequests: 1000,
  }),

  // By user: 100 requests per minute per user
  byUser: rateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    keyGenerator: keyByUser,
  }),
};
