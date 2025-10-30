/**
 * State Manager
 * Manages persistent state for minting operations using Redis
 */

import Redis from 'ioredis';
import { IStateManager } from '../interfaces';
import { ServiceConfig, MintStatus, BatchInfo } from '../types';
import { logger } from '../utils/logger';
import { MintingError, MintingErrorCode } from '../utils/errors';

/**
 * State Manager Implementation
 */
export class StateManager implements IStateManager {
  private redis: Redis;
  private keyPrefix: string = 'minting:';
  private ttl: number = 24 * 60 * 60; // 24 hours default TTL

  constructor(private config: ServiceConfig) {
    // Initialize Redis client
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.setupRedisEvents();

    logger.info('State Manager initialized', {
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db,
    });
  }

  /**
   * Save mint request state
   */
  async saveMintState(requestId: string, state: MintStatus): Promise<void> {
    try {
      const key = this.getMintStateKey(requestId);
      const value = JSON.stringify(state);

      await this.redis.setex(key, this.ttl, value);

      logger.debug('Mint state saved', {
        requestId,
        status: state.status,
      });
    } catch (error) {
      logger.error('Failed to save mint state', {
        requestId,
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.STATE_SAVE_FAILED,
        `Failed to save mint state: ${error.message}`,
        { requestId, error },
        false
      );
    }
  }

  /**
   * Get mint request state
   */
  async getMintState(requestId: string): Promise<MintStatus | null> {
    try {
      const key = this.getMintStateKey(requestId);
      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      const state = JSON.parse(value) as MintStatus;

      logger.debug('Mint state retrieved', {
        requestId,
        status: state.status,
      });

      return state;
    } catch (error) {
      logger.error('Failed to get mint state', {
        requestId,
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.STATE_LOAD_FAILED,
        `Failed to get mint state: ${error.message}`,
        { requestId, error },
        false
      );
    }
  }

  /**
   * Update mint state
   */
  async updateMintState(
    requestId: string,
    updates: Partial<MintStatus>
  ): Promise<void> {
    try {
      const currentState = await this.getMintState(requestId);

      if (!currentState) {
        throw new Error(`Mint state not found: ${requestId}`);
      }

      const updatedState: MintStatus = {
        ...currentState,
        ...updates,
      };

      await this.saveMintState(requestId, updatedState);

      logger.debug('Mint state updated', {
        requestId,
        updates: Object.keys(updates),
      });
    } catch (error) {
      logger.error('Failed to update mint state', {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete mint state
   */
  async deleteMintState(requestId: string): Promise<void> {
    try {
      const key = this.getMintStateKey(requestId);
      await this.redis.del(key);

      logger.debug('Mint state deleted', { requestId });
    } catch (error) {
      logger.error('Failed to delete mint state', {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save batch state
   */
  async saveBatchState(batchId: string, state: BatchInfo): Promise<void> {
    try {
      const key = this.getBatchStateKey(batchId);
      const value = JSON.stringify(state);

      await this.redis.setex(key, this.ttl, value);

      logger.debug('Batch state saved', {
        batchId,
        status: state.status,
      });
    } catch (error) {
      logger.error('Failed to save batch state', {
        batchId,
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.STATE_SAVE_FAILED,
        `Failed to save batch state: ${error.message}`,
        { batchId, error },
        false
      );
    }
  }

  /**
   * Get batch state
   */
  async getBatchState(batchId: string): Promise<BatchInfo | null> {
    try {
      const key = this.getBatchStateKey(batchId);
      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      const state = JSON.parse(value) as BatchInfo;

      logger.debug('Batch state retrieved', {
        batchId,
        status: state.status,
      });

      return state;
    } catch (error) {
      logger.error('Failed to get batch state', {
        batchId,
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.STATE_LOAD_FAILED,
        `Failed to get batch state: ${error.message}`,
        { batchId, error },
        false
      );
    }
  }

  /**
   * Get all mint states for a wallet
   */
  async getMintStatesByWallet(walletAddress: string): Promise<MintStatus[]> {
    try {
      const pattern = `${this.keyPrefix}mint:*`;
      const keys = await this.redis.keys(pattern);

      const states: MintStatus[] = [];

      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value) {
          const state = JSON.parse(value) as MintStatus;
          states.push(state);
        }
      }

      logger.debug('Retrieved mint states by wallet', {
        walletAddress,
        count: states.length,
      });

      return states;
    } catch (error) {
      logger.error('Failed to get mint states by wallet', {
        walletAddress,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all batch states
   */
  async getAllBatchStates(): Promise<BatchInfo[]> {
    try {
      const pattern = `${this.keyPrefix}batch:*`;
      const keys = await this.redis.keys(pattern);

      const states: BatchInfo[] = [];

      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value) {
          const state = JSON.parse(value) as BatchInfo;
          states.push(state);
        }
      }

      logger.debug('Retrieved all batch states', {
        count: states.length,
      });

      return states;
    } catch (error) {
      logger.error('Failed to get all batch states', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Set custom TTL for a key
   */
  async setTTL(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
      logger.debug('TTL set for key', { key, ttl });
    } catch (error) {
      logger.error('Failed to set TTL', {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Increment counter
   */
  async incrementCounter(counterName: string): Promise<number> {
    try {
      const key = `${this.keyPrefix}counter:${counterName}`;
      const value = await this.redis.incr(key);

      logger.debug('Counter incremented', {
        counterName,
        value,
      });

      return value;
    } catch (error) {
      logger.error('Failed to increment counter', {
        counterName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get counter value
   */
  async getCounter(counterName: string): Promise<number> {
    try {
      const key = `${this.keyPrefix}counter:${counterName}`;
      const value = await this.redis.get(key);

      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error('Failed to get counter', {
        counterName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Store temporary data with TTL
   */
  async setTemporary(key: string, value: any, ttl: number): Promise<void> {
    try {
      const fullKey = `${this.keyPrefix}temp:${key}`;
      const serialized = JSON.stringify(value);

      await this.redis.setex(fullKey, ttl, serialized);

      logger.debug('Temporary data stored', { key, ttl });
    } catch (error) {
      logger.error('Failed to store temporary data', {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get temporary data
   */
  async getTemporary(key: string): Promise<any | null> {
    try {
      const fullKey = `${this.keyPrefix}temp:${key}`;
      const value = await this.redis.get(fullKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error('Failed to get temporary data', {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Clear all state data (use with caution)
   */
  async clearAllState(): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.warn('All state data cleared', { count: keys.length });
      }
    } catch (error) {
      logger.error('Failed to clear all state', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get mint state key
   */
  private getMintStateKey(requestId: string): string {
    return `${this.keyPrefix}mint:${requestId}`;
  }

  /**
   * Get batch state key
   */
  private getBatchStateKey(batchId: string): string {
    return `${this.keyPrefix}batch:${batchId}`;
  }

  /**
   * Setup Redis events
   */
  private setupRedisEvents(): void {
    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });

    this.redis.on('ready', () => {
      logger.info('Redis ready');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error', { error: error.message });
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });
  }

  /**
   * Check Redis health
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get Redis client
   */
  getRedisClient(): Redis {
    return this.redis;
  }

  /**
   * Shutdown state manager
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down State Manager');

    await this.redis.quit();

    logger.info('State Manager shutdown complete');
  }
}
