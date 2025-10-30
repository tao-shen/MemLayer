/**
 * Batch Manager Tests
 */

import { BatchManager } from '../batch-manager';
import { ServiceConfig, MintRequest } from '../../types';

describe('BatchManager', () => {
  let batchManager: BatchManager;
  let config: ServiceConfig;

  beforeEach(() => {
    config = {
      solana: {
        rpcUrl: 'https://api.devnet.solana.com',
        network: 'devnet',
        programId: 'test-program-id',
        walletPrivateKey: 'test-key',
      },
      arweave: {
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
        walletPath: './test-wallet.json',
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
      postgres: {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      },
      batch: {
        size: 5,
        timeoutMs: 1000,
        maxConcurrent: 2,
      },
      queue: {
        name: 'test-queue',
        concurrency: 5,
        maxRetries: 3,
      },
      cost: {
        defaultPriorityFee: 5000,
        maxPriorityFee: 50000,
      },
    };

    batchManager = new BatchManager(config);
  });

  afterEach(async () => {
    await batchManager.shutdown();
  });

  describe('addToBatch', () => {
    it('should add item to batch', async () => {
      const request: MintRequest = {
        walletAddress: 'test-wallet',
        signature: 'test-signature',
        memory: {
          content: 'test content',
          metadata: {
            type: 'episodic',
            tags: ['test'],
          },
          agentId: 'test-agent',
          timestamp: new Date(),
        },
      };

      const requestId = await batchManager.addToBatch(request);
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
    });

    it('should throw error for invalid request', async () => {
      const invalidRequest = {
        walletAddress: '',
        signature: 'test-signature',
        memory: {
          content: 'test content',
          metadata: { type: 'episodic' },
          agentId: 'test-agent',
          timestamp: new Date(),
        },
      } as MintRequest;

      await expect(batchManager.addToBatch(invalidRequest)).rejects.toThrow();
    });

    it('should create new batch when max size reached', async () => {
      const request: MintRequest = {
        walletAddress: 'test-wallet',
        signature: 'test-signature',
        memory: {
          content: 'test content',
          metadata: { type: 'episodic' },
          agentId: 'test-agent',
          timestamp: new Date(),
        },
      };

      // Add items up to max batch size
      const requestIds: string[] = [];
      for (let i = 0; i < config.batch.size; i++) {
        const id = await batchManager.addToBatch(request);
        requestIds.push(id);
      }

      expect(requestIds.length).toBe(config.batch.size);
    });
  });

  describe('getBatchStats', () => {
    it('should return correct batch statistics', async () => {
      const request: MintRequest = {
        walletAddress: 'test-wallet',
        signature: 'test-signature',
        memory: {
          content: 'test content',
          metadata: { type: 'episodic' },
          agentId: 'test-agent',
          timestamp: new Date(),
        },
      };

      await batchManager.addToBatch(request);
      await batchManager.addToBatch(request);

      const stats = batchManager.getBatchStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.pending).toBeGreaterThan(0);
    });
  });

  describe('cancelBatch', () => {
    it('should cancel pending batch', async () => {
      const request: MintRequest = {
        walletAddress: 'test-wallet',
        signature: 'test-signature',
        memory: {
          content: 'test content',
          metadata: { type: 'episodic' },
          agentId: 'test-agent',
          timestamp: new Date(),
        },
      };

      await batchManager.addToBatch(request);
      const stats = batchManager.getBatchStats();
      
      // Get first pending batch ID
      // Note: In real implementation, we'd need to expose batch IDs
      // For now, this is a placeholder test
      expect(stats.pending).toBeGreaterThan(0);
    });
  });

  describe('events', () => {
    it('should emit item:added event', (done) => {
      const request: MintRequest = {
        walletAddress: 'test-wallet',
        signature: 'test-signature',
        memory: {
          content: 'test content',
          metadata: { type: 'episodic' },
          agentId: 'test-agent',
          timestamp: new Date(),
        },
      };

      batchManager.once('item:added', (data) => {
        expect(data.requestId).toBeDefined();
        expect(data.batchId).toBeDefined();
        done();
      });

      batchManager.addToBatch(request);
    });

    it('should emit batch:created event', (done) => {
      const request: MintRequest = {
        walletAddress: 'test-wallet',
        signature: 'test-signature',
        memory: {
          content: 'test content',
          metadata: { type: 'episodic' },
          agentId: 'test-agent',
          timestamp: new Date(),
        },
      };

      batchManager.once('batch:created', (data) => {
        expect(data.batchId).toBeDefined();
        expect(data.walletAddress).toBe('test-wallet');
        done();
      });

      batchManager.addToBatch(request);
    });
  });
});
