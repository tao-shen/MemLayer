import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuthorizationError, createLogger } from '@agent-memory/shared';

const logger = createLogger('AuthorizationMiddleware');

/**
 * Check if user has required permission
 */
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('User not authenticated');
      }

      if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('admin')) {
        throw new AuthorizationError(`Missing required permission: ${permission}`);
      }

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        res.status(403).json({
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        logger.error('Authorization error', error as Error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authorization check failed',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  };
}

/**
 * Check if user has any of the required permissions
 */
export function requireAnyPermission(permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('User not authenticated');
      }

      const hasPermission =
        req.user.permissions.includes('admin') ||
        permissions.some((p) => req.user!.permissions.includes(p));

      if (!hasPermission) {
        throw new AuthorizationError(`Missing required permissions: ${permissions.join(', ')}`);
      }

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        res.status(403).json({
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        logger.error('Authorization error', error as Error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authorization check failed',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  };
}

/**
 * Check if user owns the agent
 */
export function requireAgentOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    const agentId = req.params.agentId;

    if (!agentId) {
      throw new AuthorizationError('Agent ID not provided');
    }

    // In production, check database for ownership
    // For now, simple check
    if (req.user.agentId && req.user.agentId !== agentId && !req.user.permissions.includes('admin')) {
      throw new AuthorizationError('You do not have access to this agent');
    }

    next();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      res.status(403).json({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logger.error('Agent ownership check failed', error as Error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authorization check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

/**
 * RBAC middleware
 */
export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('User not authenticated');
      }

      // Check if user has the required role
      // In production, this would check against database
      const userRole = (req.user as any).role || 'user';

      if (userRole !== role && userRole !== 'admin') {
        throw new AuthorizationError(`Required role: ${role}`);
      }

      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        res.status(403).json({
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        logger.error('Role check failed', error as Error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authorization check failed',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  };
}
