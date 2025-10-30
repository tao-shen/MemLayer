/**
 * Solana Signature Authentication Middleware
 * Verifies Solana wallet signatures for blockchain operations
 */

import { Request, Response, NextFunction } from 'express';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { createLogger } from '@agent-memory/shared';
import Redis from 'ioredis';

const logger = createLogger('SolanaAuthMiddleware');

// Redis client for nonce tracking
let redisClient: Redis | null = null;

/**
 * Initialize Redis client
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    });
  }
  return redisClient;
}

/**
 * Extended request with Solana wallet info
 */
export interface SolanaAuthRequest extends Request {
  wallet?: {
    address: string;
    publicKey: PublicKey;
    verified: boolean;
  };
  user?: {
    userId: string;
    agentId?: string;
    permissions: string[];
  };
}

/**
 * Solana signature authentication middleware
 */
export function authenticateSolana(
  req: SolanaAuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract headers
    const walletAddress = req.headers['x-wallet-address'] as string;
    const signature = req.headers['x-solana-signature'] as string;
    const message = req.headers['x-signed-message'] as string;

    if (!walletAddress || !signature || !message) {
      return res.status(401).json({
        error: {
          code: 'MISSING_AUTH_HEADERS',
          message: 'Missing required authentication headers: x-wallet-address, x-solana-signature, x-signed-message',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify signature
    verifySignature(message, signature, walletAddress)
      .then((valid) => {
        if (!valid) {
          return res.status(401).json({
            error: {
              code: 'INVALID_SIGNATURE',
              message: 'Invalid Solana signature',
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Set wallet context
        req.wallet = {
          address: walletAddress,
          publicKey: new PublicKey(walletAddress),
          verified: true,
        };

        // Also set user context for compatibility
        req.user = {
          userId: walletAddress,
          permissions: ['blockchain:read', 'blockchain:write'],
        };

        logger.debug('Solana wallet authenticated', { address: walletAddress });
        next();
      })
      .catch((error) => {
        logger.error('Signature verification error', error);
        res.status(500).json({
          error: {
            code: 'VERIFICATION_ERROR',
            message: 'Failed to verify signature',
            timestamp: new Date().toISOString(),
          },
        });
      });
  } catch (error) {
    logger.error('Solana authentication error', error as Error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Solana signature authentication with timestamp validation
 */
export function authenticateSolanaWithTimestamp(
  maxAge: number = 300 // 5 minutes default
) {
  return async (req: SolanaAuthRequest, res: Response, next: NextFunction) => {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      const signature = req.headers['x-solana-signature'] as string;
      const message = req.headers['x-signed-message'] as string;

      if (!walletAddress || !signature || !message) {
        return res.status(401).json({
          error: {
            code: 'MISSING_AUTH_HEADERS',
            message: 'Missing required authentication headers',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Verify signature
      const valid = await verifySignature(message, signature, walletAddress);
      if (!valid) {
        return res.status(401).json({
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid Solana signature',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Extract and validate timestamp
      const timestamp = extractTimestamp(message);
      if (!timestamp) {
        return res.status(401).json({
          error: {
            code: 'MISSING_TIMESTAMP',
            message: 'Message does not contain valid timestamp',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check message age
      const age = (Date.now() - timestamp) / 1000;
      if (age > maxAge) {
        return res.status(401).json({
          error: {
            code: 'MESSAGE_EXPIRED',
            message: `Message too old: ${age}s (max: ${maxAge}s)`,
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (age < -60) {
        // Allow 1 minute clock skew
        return res.status(401).json({
          error: {
            code: 'MESSAGE_FUTURE',
            message: 'Message timestamp is in the future',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check nonce to prevent replay attacks
      const nonce = extractNonce(message);
      if (nonce) {
        const redis = getRedisClient();
        const nonceKey = `nonce:${walletAddress}:${nonce}`;
        const exists = await redis.exists(nonceKey);

        if (exists) {
          return res.status(401).json({
            error: {
              code: 'REPLAY_ATTACK',
              message: 'Nonce already used (replay attack detected)',
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Store nonce with TTL
        await redis.setex(nonceKey, maxAge * 2, '1');
      }

      // Set wallet context
      req.wallet = {
        address: walletAddress,
        publicKey: new PublicKey(walletAddress),
        verified: true,
      };

      req.user = {
        userId: walletAddress,
        permissions: ['blockchain:read', 'blockchain:write'],
      };

      logger.debug('Solana wallet authenticated with timestamp', {
        address: walletAddress,
        age,
      });
      next();
    } catch (error) {
      logger.error('Solana authentication error', error as Error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Dual authentication middleware (JWT or Solana)
 */
export function authenticateDual(
  req: SolanaAuthRequest,
  res: Response,
  next: NextFunction
) {
  // Check if Solana auth headers are present
  const hasSolanaAuth =
    req.headers['x-wallet-address'] &&
    req.headers['x-solana-signature'] &&
    req.headers['x-signed-message'];

  // Check if JWT auth header is present
  const hasJWTAuth = req.headers.authorization;

  if (hasSolanaAuth) {
    // Use Solana authentication
    return authenticateSolana(req, res, next);
  } else if (hasJWTAuth) {
    // Use JWT authentication (import from auth.ts)
    const { authenticateJWT } = require('./auth');
    return authenticateJWT(req, res, next);
  } else {
    return res.status(401).json({
      error: {
        code: 'NO_AUTHENTICATION',
        message: 'No authentication provided. Use either JWT or Solana signature',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Verify Ed25519 signature
 */
async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    // Decode public key
    const publicKeyObj = new PublicKey(publicKey);
    const publicKeyBytes = publicKeyObj.toBytes();

    // Decode signature
    const signatureBytes = bs58.decode(signature);

    // Encode message
    const messageBytes = new TextEncoder().encode(message);

    // Verify signature
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    logger.error('Signature verification failed', error as Error);
    return false;
  }
}

/**
 * Extract timestamp from message
 */
function extractTimestamp(message: string): number | null {
  const match = message.match(/timestamp[:\s]+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract nonce from message
 */
function extractNonce(message: string): string | null {
  const match = message.match(/nonce[:\s]+([a-f0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Generate challenge message for signing
 */
export function generateChallengeMessage(walletAddress: string): {
  message: string;
  nonce: string;
  timestamp: number;
} {
  const nonce = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();

  const message = `Sign this message to authenticate with Memory Platform\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

  return {
    message,
    nonce,
    timestamp,
  };
}

/**
 * Validate Solana public key format
 */
export function validatePublicKey(publicKey: string): boolean {
  try {
    new PublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate signature format
 */
export function validateSignature(signature: string): boolean {
  try {
    const decoded = bs58.decode(signature);
    return decoded.length === 64; // Ed25519 signature is 64 bytes
  } catch {
    return false;
  }
}

/**
 * Cleanup Redis connection
 */
export async function cleanupSolanaAuth(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
