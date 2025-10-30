import { ArweaveClient } from './arweave-client';
import { EventEmitter } from 'events';
import { ErrorHandler, withRetry, DEFAULT_RETRY_CONFIG } from './error-handler';

/**
 * Retrieval Service
 * Handles retrieving data from Arweave with caching and retry logic
 */
export class RetrievalService extends EventEmitter {
  private cache: Map<string, CachedData> = new Map();
  private cacheTTL: number = 3600000; // 1 hour
  private maxCacheSize: number = 100;
  private errorHandler: ErrorHandler;

  constructor(private client: ArweaveClient) {
    super();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Retrieve data by transaction ID
   */
  async retrieve(txId: string): Promise<Buffer> {
    try {
      this.emit('retrieve:started', { txId });

      const data = await this.client.getTransactionData(txId);

      this.emit('retrieve:completed', { txId, size: data.length });

      return data;
    } catch (error) {
      const arweaveError = this.errorHandler.handleError(error, 'retrieve');
      this.emit('retrieve:failed', { txId, error: arweaveError.message, code: arweaveError.code });
      throw arweaveError;
    }
  }

  /**
   * Retrieve with caching
   */
  async retrieveWithCache(txId: string): Promise<Buffer> {
    // Check cache first
    const cached = this.getFromCache(txId);
    if (cached) {
      this.emit('cache:hit', { txId });
      return cached;
    }

    this.emit('cache:miss', { txId });

    // Retrieve from Arweave
    const data = await this.retrieve(txId);

    // Store in cache
    this.addToCache(txId, data);

    return data;
  }

  /**
   * Retrieve with retry logic
   */
  async retrieveWithRetry(txId: string, maxRetries: number = 3): Promise<Buffer> {
    return withRetry(
      () => this.retrieve(txId),
      {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries,
      },
      this.errorHandler,
      'retrieveWithRetry'
    );
  }

  /**
   * Batch retrieve multiple transactions
   */
  async batchRetrieve(txIds: string[]): Promise<Map<string, Buffer>> {
    const results = new Map<string, Buffer>();
    const errors: Array<{ txId: string; error: string }> = [];

    this.emit('batch:started', { count: txIds.length });

    for (let i = 0; i < txIds.length; i++) {
      const txId = txIds[i];

      try {
        const data = await this.retrieveWithCache(txId);
        results.set(txId, data);

        this.emit('batch:progress', {
          current: i + 1,
          total: txIds.length,
          percentage: ((i + 1) / txIds.length) * 100,
        });
      } catch (error) {
        errors.push({ txId, error: error.message });
      }
    }

    this.emit('batch:completed', {
      total: txIds.length,
      successful: results.size,
      failed: errors.length,
    });

    if (errors.length > 0) {
      console.warn(`Batch retrieval had ${errors.length} failures:`, errors);
    }

    return results;
  }

  /**
   * Verify data integrity
   */
  async verifyData(txId: string, expectedHash: string): Promise<boolean> {
    try {
      const data = await this.retrieve(txId);
      const crypto = await import('crypto');
      const actualHash = crypto.createHash('sha256').update(data).digest('hex');

      const isValid = actualHash === expectedHash;

      this.emit('verify:completed', { txId, isValid });

      return isValid;
    } catch (error) {
      this.emit('verify:failed', { txId, error: error.message });
      return false;
    }
  }

  /**
   * Get transaction metadata
   */
  async getMetadata(txId: string): Promise<TransactionMetadata> {
    try {
      const tx = await this.client.getTransaction(txId);
      const status = await this.client.getTransactionStatus(txId);

      const tags: Record<string, string> = {};
      tx.get('tags').forEach((tag: any) => {
        const name = tag.get('name', { decode: true, string: true });
        const value = tag.get('value', { decode: true, string: true });
        tags[name] = value;
      });

      return {
        txId,
        dataSize: parseInt(tx.data_size),
        tags,
        confirmed: status.confirmed,
        blockHeight: status.blockHeight,
        timestamp: tx.get('timestamp', { decode: true, string: false }),
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }

  /**
   * Stream large data
   */
  async *streamData(txId: string, chunkSize: number = 1024 * 1024): AsyncGenerator<Buffer> {
    const data = await this.retrieve(txId);
    let offset = 0;

    while (offset < data.length) {
      const chunk = data.slice(offset, offset + chunkSize);
      yield chunk;
      offset += chunkSize;

      this.emit('stream:chunk', {
        txId,
        offset,
        total: data.length,
        percentage: (offset / data.length) * 100,
      });
    }

    this.emit('stream:completed', { txId });
  }

  /**
   * Add data to cache
   */
  private addToCache(txId: string, data: Buffer): void {
    // Evict oldest if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(txId, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get data from cache
   */
  private getFromCache(txId: string): Buffer | null {
    const cached = this.cache.get(txId);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(txId);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    let totalSize = 0;
    for (const cached of this.cache.values()) {
      totalSize += cached.data.length;
    }

    return {
      entries: this.cache.size,
      totalSize,
      maxSize: this.maxCacheSize,
      ttl: this.cacheTTL,
    };
  }

  /**
   * Set cache TTL
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * Set max cache size
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;

    // Evict excess entries
    while (this.cache.size > this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error handler
   */
  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }
}

/**
 * Cached data
 */
interface CachedData {
  data: Buffer;
  timestamp: number;
}

/**
 * Transaction metadata
 */
export interface TransactionMetadata {
  txId: string;
  dataSize: number;
  tags: Record<string, string>;
  confirmed: boolean | any;
  blockHeight?: number;
  timestamp: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  entries: number;
  totalSize: number;
  maxSize: number;
  ttl: number;
}
