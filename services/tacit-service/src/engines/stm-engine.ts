import * as cache from '@agent-memory/cache';
import { createLogger } from '@agent-memory/shared';

const logger = createLogger('STMEngine');

export interface STMConfig {
  defaultWindowSize?: number;
  ttl?: number;
}

export class STMEngine {
  private defaultWindowSize: number;
  private ttl: number;

  constructor(config: STMConfig = {}) {
    this.defaultWindowSize = config.defaultWindowSize || 10;
    this.ttl = config.ttl || 3600; // 1 hour default
  }

  /**
   * Add content to short-term memory
   */
  async addToSTM(sessionId: string, content: string): Promise<void> {
    try {
      const key = this.getSTMKey(sessionId);
      const windowSize = await this.getWindowSize(sessionId);

      // Add to list (right push)
      await cache.rpush(key, content);

      // Trim to window size (keep only last N items)
      const length = await cache.llen(key);
      if (length > windowSize) {
        await cache.ltrim(key, length - windowSize, -1);
      }

      // Set expiration
      await cache.expire(key, this.ttl);

      logger.debug('Added to STM', { sessionId, contentLength: content.length, windowSize });
    } catch (error) {
      logger.error('Failed to add to STM', error as Error, { sessionId });
      throw error;
    }
  }

  /**
   * Get short-term memory contents
   */
  async getSTM(sessionId: string): Promise<string[]> {
    try {
      const key = this.getSTMKey(sessionId);
      const contents = await cache.lrange(key, 0, -1);

      logger.debug('Retrieved STM', { sessionId, count: contents.length });
      return contents;
    } catch (error) {
      logger.error('Failed to get STM', error as Error, { sessionId });
      throw error;
    }
  }

  /**
   * Get STM as a single concatenated string
   */
  async getSTMAsString(sessionId: string, separator: string = '\n'): Promise<string> {
    const contents = await this.getSTM(sessionId);
    return contents.join(separator);
  }

  /**
   * Clear short-term memory
   */
  async clearSTM(sessionId: string): Promise<void> {
    try {
      const key = this.getSTMKey(sessionId);
      await cache.del(key);

      logger.info('Cleared STM', { sessionId });
    } catch (error) {
      logger.error('Failed to clear STM', error as Error, { sessionId });
      throw error;
    }
  }

  /**
   * Set window size for a session
   */
  async setWindowSize(sessionId: string, size: number): Promise<void> {
    if (size < 1 || size > 100) {
      throw new Error('Window size must be between 1 and 100');
    }

    try {
      const key = this.getWindowSizeKey(sessionId);
      await cache.set(key, size.toString(), this.ttl);

      // Trim existing STM to new size
      const stmKey = this.getSTMKey(sessionId);
      const length = await cache.llen(stmKey);
      if (length > size) {
        await cache.ltrim(stmKey, length - size, -1);
      }

      logger.info('Set window size', { sessionId, size });
    } catch (error) {
      logger.error('Failed to set window size', error as Error, { sessionId, size });
      throw error;
    }
  }

  /**
   * Get window size for a session
   */
  async getWindowSize(sessionId: string): Promise<number> {
    try {
      const key = this.getWindowSizeKey(sessionId);
      const size = await cache.get<string>(key);
      return size ? parseInt(size) : this.defaultWindowSize;
    } catch (error) {
      logger.error('Failed to get window size', error as Error, { sessionId });
      return this.defaultWindowSize;
    }
  }

  /**
   * Get STM length
   */
  async getSTMLength(sessionId: string): Promise<number> {
    try {
      const key = this.getSTMKey(sessionId);
      return await cache.llen(key);
    } catch (error) {
      logger.error('Failed to get STM length', error as Error, { sessionId });
      return 0;
    }
  }

  /**
   * Check if STM exists for session
   */
  async hasSTM(sessionId: string): Promise<boolean> {
    try {
      const key = this.getSTMKey(sessionId);
      return await cache.exists(key);
    } catch (error) {
      logger.error('Failed to check STM existence', error as Error, { sessionId });
      return false;
    }
  }

  /**
   * Get TTL for STM
   */
  async getSTMTTL(sessionId: string): Promise<number> {
    try {
      const key = this.getSTMKey(sessionId);
      return await cache.ttl(key);
    } catch (error) {
      logger.error('Failed to get STM TTL', error as Error, { sessionId });
      return -1;
    }
  }

  /**
   * Refresh STM expiration
   */
  async refreshSTM(sessionId: string): Promise<void> {
    try {
      const key = this.getSTMKey(sessionId);
      await cache.expire(key, this.ttl);

      logger.debug('Refreshed STM expiration', { sessionId });
    } catch (error) {
      logger.error('Failed to refresh STM', error as Error, { sessionId });
      throw error;
    }
  }

  /**
   * Get statistics for all sessions
   */
  async getStats(): Promise<{
    totalSessions: number;
    totalItems: number;
    averageWindowSize: number;
  }> {
    try {
      const pattern = 'stm:*';
      const keys = await cache.keys(pattern);
      const sessionKeys = keys.filter((k: string) => !k.includes(':window_size'));

      let totalItems = 0;
      for (const key of sessionKeys) {
        const length = await cache.llen(key);
        totalItems += length;
      }

      return {
        totalSessions: sessionKeys.length,
        totalItems,
        averageWindowSize: sessionKeys.length > 0 ? totalItems / sessionKeys.length : 0,
      };
    } catch (error) {
      logger.error('Failed to get STM stats', error as Error);
      return { totalSessions: 0, totalItems: 0, averageWindowSize: 0 };
    }
  }

  /**
   * Generate Redis key for STM
   */
  private getSTMKey(sessionId: string): string {
    return `stm:${sessionId}`;
  }

  /**
   * Generate Redis key for window size
   */
  private getWindowSizeKey(sessionId: string): string {
    return `stm:${sessionId}:window_size`;
  }
}

// Singleton instance
let stmEngine: STMEngine;

export function getSTMEngine(config?: STMConfig): STMEngine {
  if (!stmEngine) {
    stmEngine = new STMEngine(config);
  }
  return stmEngine;
}
