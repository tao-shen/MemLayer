/**
 * Blockchain Routes
 * API routes for blockchain memory asset operations
 */

import express, { Request, Response } from 'express';
import {
  authenticateSolana,
  authenticateSolanaWithTimestamp,
  SolanaAuthRequest,
  generateChallengeMessage,
} from '../middleware/solana-auth';
import { rateLimiters } from '../middleware/rate-limit';
import { createLogger } from '@agent-memory/shared';

const router = express.Router();
const logger = createLogger('BlockchainRoutes');

// Placeholder for service clients (to be injected)
let mintingService: any = null;
let accessControlService: any = null;
let indexerService: any = null;

/**
 * Initialize services
 */
export function initializeBlockchainServices(services: {
  mintingService: any;
  accessControlService: any;
  indexerService: any;
}) {
  mintingService = services.mintingService;
  accessControlService = services.accessControlService;
  indexerService = services.indexerService;
}

/**
 * POST /v1/blockchain/auth/challenge
 * Generate authentication challenge
 */
router.post('/auth/challenge', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: {
          code: 'MISSING_WALLET_ADDRESS',
          message: 'Wallet address is required',
        },
      });
    }

    const challenge = generateChallengeMessage(walletAddress);

    res.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    logger.error('Failed to generate challenge', error as Error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate challenge',
      },
    });
  }
});

/**
 * POST /v1/blockchain/memories/mint
 * Mint a single memory as compressed NFT
 */
router.post(
  '/memories/mint',
  rateLimiters.minting,
  authenticateSolanaWithTimestamp(),
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { memory, options } = req.body;

      if (!memory) {
        return res.status(400).json({
          error: {
            code: 'MISSING_MEMORY_DATA',
            message: 'Memory data is required',
          },
        });
      }

      if (!mintingService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Minting service not available',
          },
        });
      }

      const result = await mintingService.mintMemory({
        walletAddress: req.wallet!.address,
        signature: req.headers['x-solana-signature'] as string,
        memory,
        options,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to mint memory', error as Error);
      res.status(500).json({
        error: {
          code: 'MINT_FAILED',
          message: error.message || 'Failed to mint memory',
        },
      });
    }
  }
);

/**
 * POST /v1/blockchain/memories/mint-batch
 * Mint multiple memories in batch
 */
router.post(
  '/memories/mint-batch',
  rateLimiters.minting,
  authenticateSolanaWithTimestamp(),
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { memories, options } = req.body;

      if (!memories || !Array.isArray(memories)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MEMORIES_DATA',
            message: 'Memories must be an array',
          },
        });
      }

      if (!mintingService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Minting service not available',
          },
        });
      }

      const result = await mintingService.mintBatch({
        walletAddress: req.wallet!.address,
        signature: req.headers['x-solana-signature'] as string,
        memories,
        options,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to mint batch', error as Error);
      res.status(500).json({
        error: {
          code: 'BATCH_MINT_FAILED',
          message: error.message || 'Failed to mint batch',
        },
      });
    }
  }
);

/**
 * GET /v1/blockchain/memories
 * Get user's blockchain memories
 */
router.get(
  '/memories',
  authenticateSolana,
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      if (!indexerService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Indexer service not available',
          },
        });
      }

      const { limit, offset, agentId, startDate, endDate } = req.query;

      const memories = await indexerService.getUserMemories(req.wallet!.address, {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        agentId: agentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: memories,
      });
    } catch (error) {
      logger.error('Failed to get memories', error as Error);
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to retrieve memories',
        },
      });
    }
  }
);

/**
 * GET /v1/blockchain/memories/:assetId
 * Get specific memory asset
 */
router.get(
  '/memories/:assetId',
  authenticateSolana,
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { assetId } = req.params;

      if (!indexerService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Indexer service not available',
          },
        });
      }

      // Check access
      if (accessControlService) {
        const accessCheck = await accessControlService.checkAccess({
          assetId,
          walletAddress: req.wallet!.address,
          signature: req.headers['x-solana-signature'] as string,
          permission: 'read',
        });

        if (!accessCheck.allowed) {
          return res.status(403).json({
            error: {
              code: 'ACCESS_DENIED',
              message: accessCheck.reason || 'Access denied',
            },
          });
        }
      }

      const memory = await indexerService.getMemoryAsset(assetId);

      if (!memory) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Memory asset not found',
          },
        });
      }

      res.json({
        success: true,
        data: memory,
      });
    } catch (error) {
      logger.error('Failed to get memory asset', error as Error);
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to retrieve memory asset',
        },
      });
    }
  }
);

/**
 * POST /v1/blockchain/memories/:assetId/grant
 * Grant access to memory asset
 */
router.post(
  '/memories/:assetId/grant',
  authenticateSolanaWithTimestamp(),
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const { grantee, permissions, expiresAt, maxAccess } = req.body;

      if (!grantee || !permissions) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Grantee and permissions are required',
          },
        });
      }

      if (!accessControlService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Access control service not available',
          },
        });
      }

      await accessControlService.grantAccess(
        {
          assetId,
          grantee,
          permissions,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          maxAccess,
        },
        req.wallet!.address,
        req.headers['x-solana-signature'] as string
      );

      res.json({
        success: true,
        message: 'Access granted successfully',
      });
    } catch (error) {
      logger.error('Failed to grant access', error as Error);
      res.status(500).json({
        error: {
          code: 'GRANT_FAILED',
          message: error.message || 'Failed to grant access',
        },
      });
    }
  }
);

/**
 * POST /v1/blockchain/memories/:assetId/revoke
 * Revoke access to memory asset
 */
router.post(
  '/memories/:assetId/revoke',
  authenticateSolanaWithTimestamp(),
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const { grantee } = req.body;

      if (!grantee) {
        return res.status(400).json({
          error: {
            code: 'MISSING_GRANTEE',
            message: 'Grantee address is required',
          },
        });
      }

      if (!accessControlService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Access control service not available',
          },
        });
      }

      await accessControlService.revokeAccess(
        {
          assetId,
          grantee,
        },
        req.wallet!.address,
        req.headers['x-solana-signature'] as string
      );

      res.json({
        success: true,
        message: 'Access revoked successfully',
      });
    } catch (error) {
      logger.error('Failed to revoke access', error as Error);
      res.status(500).json({
        error: {
          code: 'REVOKE_FAILED',
          message: error.message || 'Failed to revoke access',
        },
      });
    }
  }
);

/**
 * POST /v1/blockchain/memories/:assetId/transfer
 * Transfer memory asset ownership
 */
router.post(
  '/memories/:assetId/transfer',
  authenticateSolanaWithTimestamp(),
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const { newOwner } = req.body;

      if (!newOwner) {
        return res.status(400).json({
          error: {
            code: 'MISSING_NEW_OWNER',
            message: 'New owner address is required',
          },
        });
      }

      // Transfer logic would be implemented here
      // This would interact with the Solana program

      res.json({
        success: true,
        message: 'Transfer initiated',
        data: {
          assetId,
          newOwner,
          status: 'pending',
        },
      });
    } catch (error) {
      logger.error('Failed to transfer asset', error as Error);
      res.status(500).json({
        error: {
          code: 'TRANSFER_FAILED',
          message: error.message || 'Failed to transfer asset',
        },
      });
    }
  }
);

/**
 * GET /v1/blockchain/batches/:batchId
 * Get batch information
 */
router.get(
  '/batches/:batchId',
  authenticateSolana,
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { batchId } = req.params;

      if (!indexerService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Indexer service not available',
          },
        });
      }

      const batch = await indexerService.getBatchInfo(batchId);

      if (!batch) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Batch not found',
          },
        });
      }

      res.json({
        success: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Failed to get batch info', error as Error);
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to retrieve batch information',
        },
      });
    }
  }
);

/**
 * GET /v1/blockchain/cost/estimate
 * Estimate minting cost
 */
router.get('/cost/estimate', async (req: Request, res: Response) => {
  try {
    const { memoryCount } = req.query;

    if (!memoryCount) {
      return res.status(400).json({
        error: {
          code: 'MISSING_MEMORY_COUNT',
          message: 'Memory count is required',
        },
      });
    }

    if (!mintingService) {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Minting service not available',
        },
      });
    }

    const estimate = await mintingService.estimateCost(parseInt(memoryCount as string));

    res.json({
      success: true,
      data: estimate,
    });
  } catch (error) {
    logger.error('Failed to estimate cost', error as Error);
    res.status(500).json({
      error: {
        code: 'ESTIMATION_FAILED',
        message: 'Failed to estimate cost',
      },
    });
  }
});

/**
 * GET /v1/blockchain/access/policy/:assetId
 * Get access policy for asset
 */
router.get(
  '/access/policy/:assetId',
  authenticateSolana,
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      const { assetId } = req.params;

      if (!accessControlService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Access control service not available',
          },
        });
      }

      const policy = await accessControlService.getAccessPolicy(assetId);

      if (!policy) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Access policy not found',
          },
        });
      }

      res.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      logger.error('Failed to get access policy', error as Error);
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to retrieve access policy',
        },
      });
    }
  }
);

/**
 * GET /v1/blockchain/access/grants
 * Get user's access grants
 */
router.get(
  '/access/grants',
  authenticateSolana,
  async (req: SolanaAuthRequest, res: Response) => {
    try {
      if (!accessControlService) {
        return res.status(503).json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Access control service not available',
          },
        });
      }

      const grants = await accessControlService.getGrantsForUser(req.wallet!.address);

      res.json({
        success: true,
        data: grants,
      });
    } catch (error) {
      logger.error('Failed to get access grants', error as Error);
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: 'Failed to retrieve access grants',
        },
      });
    }
  }
);

export default router;
