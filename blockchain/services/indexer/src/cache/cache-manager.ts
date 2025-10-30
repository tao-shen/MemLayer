import { redis } from './redis-client';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  MemoryAsset,
  BatchInfo,
  TransferRecord,
  AccessGrant,
} from '../types';

export class CacheManager {
  private readonly ttl: number;
  private readonly keyPrefix: string = 'indexer:';

  // Cache statistics
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    this.ttl = config.cache.ttlSeconds;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(type: string, id: string): string {
    return `${this.keyPrefix}${type}:${id}`;
  }

  /**
   * Cache a memory asset
   */
  async cacheMemoryAsset(asset: MemoryAsset): Promise<void> {
    try {
      const key = this.getCacheKey('memory', asset.assetId);
      await redis.set(key, asset, this.ttl);
      logger.debug(`Cached memory asset: ${asset.assetId}`);
    } catch (error) {
      logger.error('Error caching memory asset:', error);
    }
  }

  /**
   * Get cached memory asset
   */
  async getCachedMemoryAsset(assetId: string): Promise<MemoryAsset | null> {
    try {
      const key = this.getCacheKey('memory', assetId);
      const cached = await redis.get<MemoryAsset>(key);
      
      if (cached) {
        this.hits++;
        logger.debug(`Cache hit for memory asset: ${assetId}`);
        return cached;
      }
      
      this.misses++;
      logger.debug(`Cache miss for memory asset: ${assetId}`);
      return null;
    } catch (error) {
      logger.error('Error getting cached memory asset:', error);
      return null;
    }
  }

  /**
   * Cache batch info
   */
  async cacheBatchInfo(batch: BatchInfo): Promise<void> {
    try {
      const key = this.getCacheKey('batch', batch.batchId);
      await redis.set(key, batch, this.ttl);
      logger.debug(`Cached batch info: ${batch.batchId}`);
    } catch (error) {
      logger.error('Error caching batch info:', error);
    }
  }

  /**
   * Get cached batch info
   */
  async getCachedBatchInfo(batchId: string): Promise<BatchInfo | null> {
    try {
      const key = this.getCacheKey('batch', batchId);
      const cached = await redis.get<BatchInfo>(key);
      
      if (cached) {
        this.hits++;
        logger.debug(`Cache hit for batch: ${batchId}`);
        return cached;
      }
      
      this.misses++;
      logger.debug(`Cache miss for batch: ${batchId}`);
      return null;
    } catch (error) {
      logger.error('Error getting cached batch info:', error);
      return null;
    }
  }

  /**
   * Cache user memories list
   */
  async cacheUserMemories(
    walletAddress: string,
    memories: MemoryAsset[],
    filterKey: string = 'default'
  ): Promise<void> {
    try {
      const key = this.getCacheKey('user_memories', `${walletAddress}:${filterKey}`);
      await redis.set(key, memories, this.ttl);
      logger.debug(`Cached user memories for: ${walletAddress}`);
    } catch (error) {
      logger.error('Error caching user memories:', error);
    }
  }

  /**
   * Get cached user memories list
   */
  async getCachedUserMemories(
    walletAddress: string,
    filterKey: string = 'default'
  ): Promise<MemoryAsset[] | null> {
    try {
      const key = this.getCacheKey('user_memories', `${walletAddress}:${filterKey}`);
      const cached = await redis.get<MemoryAsset[]>(key);
      
      if (cached) {
        this.hits++;
        logger.debug(`Cache hit for user memories: ${walletAddress}`);
        return cached;
      }
      
      this.misses++;
      logger.debug(`Cache miss for user memories: ${walletAddress}`);
      return null;
    } catch (error) {
      logger.error('Error getting cached user memories:', error);
      return null;
    }
  }

  /**
   * Cache transfer history
   */
  async cacheTransferHistory(assetId: string, history: TransferRecord[]): Promise<void> {
    try {
      const key = this.getCacheKey('transfers', assetId);
      await redis.set(key, history, this.ttl);
      logger.debug(`Cached transfer history for: ${assetId}`);
    } catch (error) {
      logger.error('Error caching transfer history:', error);
    }
  }

  /**
   * Get cached transfer history
   */
  async getCachedTransferHistory(assetId: string): Promise<TransferRecord[] | null> {
    try {
      const key = this.getCacheKey('transfers', assetId);
      const cached = await redis.get<TransferRecord[]>(key);
      
      if (cached) {
        this.hits++;
        logger.debug(`Cache hit for transfer history: ${assetId}`);
        return cached;
      }
      
      this.misses++;
      logger.debug(`Cache miss for transfer history: ${assetId}`);
      return null;
    } catch (error) {
      logger.error('Error getting cached transfer history:', error);
      return null;
    }
  }

  /**
   * Cache access grants
   */
  async cacheAccessGrants(assetId: string, grants: AccessGrant[]): Promise<void> {
    try {
      const key = this.getCacheKey('grants', assetId);
      await redis.set(key, grants, this.ttl * 5); // Longer TTL for access grants
      logger.debug(`Cached access grants for: ${assetId}`);
    } catch (error) {
      logger.error('Error caching access grants:', error);
    }
  }

  /**
   * Get cached access grants
   */
  async getCachedAccessGrants(assetId: string): Promise<AccessGrant[] | null> {
    try {
      const key = this.getCacheKey('grants', assetId);
      const cached = await redis.get<AccessGrant[]>(key);
      
      if (cached) {
        this.hits++;
        logger.debug(`Cache hit for access grants: ${assetId}`);
        return cached;
      }
      
      this.misses++;
      logger.debug(`Cache miss for access grants: ${assetId}`);
      return null;
    } catch (error) {
      logger.error('Error getting cached access grants:', error);
      return null;
    }
  }

  /**
   * Invalidate cache for a memory asset
   */
  async invalidateMemoryAsset(assetId: string): Promise<void> {
    try {
      const key = this.getCacheKey('memory', assetId);
      await redis.del(key);
      
      // Also invalidate related caches
      await this.invalidateTransferHistory(assetId);
      await this.invalidateAccessGrants(assetId);
      
      logger.debug(`Invalidated cache for memory asset: ${assetId}`);
    } catch (error) {
      logger.error('Error invalidating memory asset cache:', error);
    }
  }

  /**
   * Invalidate cache for user memories
   */
  async invalidateUserMemories(walletAddress: string): Promise<void> {
    try {
      const pattern = this.getCacheKey('user_memories', `${walletAddress}:*`);
      const keys = await redis.keys(pattern);
      
      for (const key of keys) {
        await redis.del(key);
      }
      
      logger.debug(`Invalidated user memories cache for: ${walletAddress}`);
    } catch (error) {
      logger.error('Error invalidating user memories cache:', error);
    }
  }

  /**
   * Invalidate cache for batch info
   */
  async invalidateBatchInfo(batchId: string): Promise<void> {
    try {
      const key = this.getCacheKey('batch', batchId);
      await redis.del(key);
      logger.debug(`Invalidated cache for batch: ${batchId}`);
    } catch (error) {
      logger.error('Error invalidating batch cache:', error);
    }
  }

  /**
   * Invalidate cache for transfer history
   */
  async invalidateTransferHistory(assetId: string): Promise<void> {
    try {
      const key = this.getCacheKey('transfers', assetId);
      await redis.del(key);
      logger.debug(`Invalidated transfer history cache for: ${assetId}`);
    } catch (error) {
      logger.error('Error invalidating transfer history cache:', error);
    }
  }

  /**
   * Invalidate cache for access grants
   */
  async invalidateAccessGrants(assetId: string): Promise<void> {
    try {
      const key = this.getCacheKey('grants', assetId);
      await redis.del(key);
      logger.debug(`Invalidated access grants cache for: ${assetId}`);
    } catch (error) {
      logger.error('Error invalidating access grants cache:', error);
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(walletAddresses: string[]): Promise<void> {
    logger.info(`Warming up cache for ${walletAddresses.length} wallets`);
    
    // This would be implemented based on your query engine
    // For now, it's a placeholder
    for (const address of walletAddresses) {
      // Fetch and cache user's most recent memories
      // This would call your query engine and cache the results
    }
    
    logger.info('Cache warm-up completed');
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await redis.keys(pattern);
      
      for (const key of keys) {
        await redis.del(key);
      }
      
      logger.info('Cleared all indexer cache');
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    logger.info('Cache statistics reset');
  }
}

export default CacheManager;
