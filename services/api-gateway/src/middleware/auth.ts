import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, createLogger } from '@agent-memory/shared';

const logger = createLogger('AuthMiddleware');

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    agentId?: string;
    permissions: string[];
  };
}

/**
 * JWT authentication middleware
 */
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Invalid authorization header format');
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as any;

    req.user = {
      userId: decoded.userId,
      agentId: decoded.agentId,
      permissions: decoded.permissions || [],
    };

    logger.debug('User authenticated', { userId: req.user.userId });
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
        },
      });
    } else if (error instanceof AuthenticationError) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logger.error('Authentication error', error as Error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

/**
 * API key authentication middleware
 */
export function authenticateAPIKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const apiKeyHeader = process.env.API_KEY_HEADER || 'X-API-Key';
    const apiKey = req.headers[apiKeyHeader.toLowerCase()];

    if (!apiKey) {
      throw new AuthenticationError('No API key provided');
    }

    // In production, validate against database
    // For now, simple validation
    if (typeof apiKey !== 'string' || apiKey.length < 32) {
      throw new AuthenticationError('Invalid API key');
    }

    // Set user context (would come from database in production)
    req.user = {
      userId: 'api-key-user',
      permissions: ['read', 'write'],
    };

    logger.debug('API key authenticated');
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logger.error('API key authentication error', error as Error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

/**
 * Optional authentication (allows both authenticated and anonymous)
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // No auth provided, continue as anonymous
    next();
    return;
  }

  // Try to authenticate
  authenticateJWT(req, res, next);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: {
  userId: string;
  agentId?: string;
  permissions?: string[];
}): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any);
}

/**
 * Refresh token
 */
export function refreshToken(token: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const decoded = jwt.verify(token, secret) as any;

  // Generate new token with same payload
  return generateToken({
    userId: decoded.userId,
    agentId: decoded.agentId,
    permissions: decoded.permissions,
  });
}
