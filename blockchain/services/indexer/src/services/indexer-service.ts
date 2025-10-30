import { EventListener } from './event-listener';
import { DataIndexer } from './data-indexer';
import { QueryEngine } from './query-engine';
import CacheManager from '../cache/cache-manager';
import { redis } from '../cache/redis-client';
import { db } from '../database/client';
import { config, connectionPool } from '../config';
import { logger } from '../utils/logger';
import { EventType, SyncStatus, ProgramEvent } from '../types';

export class IndexerService {
  private eventListener: EventListener;
  private dataIndexer: DataIndexer;
  private queryEngine: QueryEngine;
  private cacheManager: CacheManager;
  
  private syncStatus: SyncStatus;
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.eventListener = new EventListener();
    this.dataIndexer = new DataIndexer();
    this.queryEngine = new QueryEngine();
    this.cacheManager = new CacheManager();

    this.syncStatus = {
      currentSlot: 0,
      latestSlot: 0,
      syncLag: 0,
      isRunning: false,
      lastSyncTime: new Date(),
      eventsProcessed: 0,
      errorsCount: 0,
    };

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle memory minted events
    this.eventListener.on(EventType.MEMORY_MINTED, async (event: ProgramEvent) => {
      try {
        await this.dataIndexer.indexMemoryMinted(event);
        this.syncStatus.eventsProcessed++;
        
        // Invalidate cache for the owner
        const data = event.data;
        if (data.owner) {
          await this.cacheManager.invalidateUserMemories(data.owner.toBase58());
        }
      } catch (error) {
        logger.error('Error handling memory minted event:', error);
        this.syncStatus.errorsCount++;
      }
    });

    // Handle memory transferred events
    this.eventListener.on(EventType.MEMORY_TRANSFERRED, async (event: ProgramEvent) => {
      try {
        await this.dataIndexer.indexMemoryTransferred(event);
        this.syncStatus.eventsProcessed++;
        
        // Invalidate cache for both old and new owners
        const data = event.data;
        if (data.fromOwner) {
          await this.cacheManager.invalidateUserMemories(data.fromOwner.toBase58());
        }
        if (data.toOwner) {
          await this.cacheManager.invalidateUserMemories(data.toOwner.toBase58());
        }
        if (data.assetId) {
          await this.cacheManager.invalidateMemoryAsset(data.assetId);
        }
      } catch (error) {
        logger.error('Error handling memory transferred event:', error);
        this.syncStatus.errorsCount++;
      }
    });

    // Handle access policy updated events
    this.eventListener.on(EventType.ACCESS_POLICY_UPDATED, async (event: ProgramEvent) => {
      try {
        await this.dataIndexer.indexAccessPolicyUpdated(event);
        this.syncStatus.eventsProcessed++;
        
        // Invalidate access grants cache
        const data = event.data;
        if (data.owner) {
          await this.cacheManager.invalidateUserMemories(data.owner.toBase58());
        }
      } catch (error) {
        logger.error('Error handling access policy updated event:', error);
        this.syncStatus.errorsCount++;
      }
    });

    // Handle version created events
    this.eventListener.on(EventType.VERSION_CREATED, async (event: ProgramEvent) => {
      try {
        await this.dataIndexer.indexVersionCreated(event);
        this.syncStatus.eventsProcessed++;
        
        // Invalidate memory asset cache
        const data = event.data;
        if (data.assetId) {
          await this.cacheManager.invalidateMemoryAsset(data.assetId);
        }
      } catch (error) {
        logger.error('Error handling version created event:', error);
        this.syncStatus.errorsCount++;
      }
    });

    // Handle batch created events
    this.eventListener.on(EventType.BATCH_CREATED, async (event: ProgramEvent) => {
      try {
        await this.dataIndexer.indexBatchCreated(event);
        this.syncStatus.eventsProcessed++;
        
        // Invalidate batch cache
        const data = event.data;
        if (data.batchId) {
          await this.cacheManager.invalidateBatchInfo(data.batchId);
        }
        if (data.owner) {
          await this.cacheManager.invalidateUserMemories(data.owner.toBase58());
        }
      } catch (error) {
        logger.error('Error handling batch created event:', error);
        this.syncStatus.errorsCount++;
      }
    });
  }

  /**
   * Start the indexer service
   */
  async start(fromSlot?: number): Promise<void> {
    if (this.isRunning) {
      logger.warn('Indexer service is already running');
      return;
    }

    try {
      logger.info('Starting indexer service...');

      // Connect to Redis
      await redis.connect();
      logger.info('Connected to Redis');

      // Check database connection
      const dbHealthy = await db.healthCheck();
      if (!dbHealthy) {
        throw new Error('Database health check failed');
      }
      logger.info('Database connection verified');

      // Check Solana connection
      const rpcHealthy = await connectionPool.healthCheck();
      if (!rpcHealthy) {
        throw new Error('Solana RPC health check failed');
      }
      logger.info('Solana RPC connection verified');

      // Get latest slot from chain
      const connection = connectionPool.getConnection();
      const latestSlot = await connection.getSlot();
      this.syncStatus.latestSlot = latestSlot;

      // Determine starting slot
      const startSlot = fromSlot || await this.getLastProcessedSlot() || config.indexer.startSlot;
      this.syncStatus.currentSlot = startSlot;

      logger.info(`Starting indexer from slot ${startSlot} (latest: ${latestSlot})`);

      // Start event listener
      await this.eventListener.start(startSlot);

      // Start sync status monitoring
      this.startSyncMonitoring();

      this.isRunning = true;
      this.syncStatus.isRunning = true;

      logger.info('Indexer service started successfully');
    } catch (error) {
      logger.error('Error starting indexer service:', error);
      throw error;
    }
  }

  /**
   * Stop the indexer service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Indexer service is not running');
      return;
    }

    try {
      logger.info('Stopping indexer service...');

      // Stop event listener
      await this.eventListener.stop();

      // Stop sync monitoring
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // Disconnect from Redis
      await redis.disconnect();

      this.isRunning = false;
      this.syncStatus.isRunning = false;

      logger.info('Indexer service stopped');
    } catch (error) {
      logger.error('Error stopping indexer service:', error);
      throw error;
    }
  }

  /**
   * Sync from chain (full or incremental)
   */
  async syncFromChain(fromSlot?: number): Promise<void> {
    try {
      logger.info('Starting chain sync...');

      const startSlot = fromSlot || await this.getLastProcessedSlot() || config.indexer.startSlot;
      
      // Stop current listener if running
      if (this.eventListener.isListening()) {
        await this.eventListener.stop();
      }

      // Start from specified slot
      await this.eventListener.start(startSlot);

      logger.info(`Chain sync started from slot ${startSlot}`);
    } catch (error) {
      logger.error('Error syncing from chain:', error);
      throw error;
    }
  }

  /**
   * Perform full resync (clear and reindex)
   */
  async fullResync(): Promise<void> {
    try {
      logger.info('Starting full resync...');

      // Stop indexer
      await this.stop();

      // Clear all data
      await this.dataIndexer.clearAll();
      await this.cacheManager.clearAll();

      // Reset sync status
      this.syncStatus.eventsProcessed = 0;
      this.syncStatus.errorsCount = 0;

      // Start from beginning
      await this.start(config.indexer.startSlot);

      logger.info('Full resync completed');
    } catch (error) {
      logger.error('Error during full resync:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      ...this.syncStatus,
      currentSlot: this.eventListener.getCurrentSlot(),
    };
  }

  /**
   * Get query engine for external use
   */
  getQueryEngine(): QueryEngine {
    return this.queryEngine;
  }

  /**
   * Get cache manager for external use
   */
  getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Start monitoring sync status
   */
  private startSyncMonitoring(): void {
    this.syncInterval = setInterval(async () => {
      try {
        const connection = connectionPool.getConnection();
        const latestSlot = await connection.getSlot();
        const currentSlot = this.eventListener.getCurrentSlot();

        this.syncStatus.latestSlot = latestSlot;
        this.syncStatus.currentSlot = currentSlot;
        this.syncStatus.syncLag = latestSlot - currentSlot;
        this.syncStatus.lastSyncTime = new Date();

        // Save last processed slot
        await this.saveLastProcessedSlot(currentSlot);

        // Log sync status
        if (this.syncStatus.syncLag > 100) {
          logger.warn(`Sync lag is high: ${this.syncStatus.syncLag} slots`);
        } else {
          logger.debug(`Sync status: slot ${currentSlot}/${latestSlot}, lag: ${this.syncStatus.syncLag}`);
        }

        // Log cache stats periodically
        const cacheStats = this.cacheManager.getStats();
        logger.debug(`Cache stats: ${cacheStats.hits} hits, ${cacheStats.misses} misses, ${cacheStats.hitRate}% hit rate`);
      } catch (error) {
        logger.error('Error monitoring sync status:', error);
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Get last processed slot from database
   */
  private async getLastProcessedSlot(): Promise<number | null> {
    try {
      const result = await db.query<{ value: string }>(
        'SELECT value FROM indexer_state WHERE key = $1',
        ['last_processed_slot']
      );

      if (result.rows.length > 0) {
        return parseInt(result.rows[0].value);
      }

      return null;
    } catch (error) {
      logger.error('Error getting last processed slot:', error);
      return null;
    }
  }

  /**
   * Save last processed slot to database
   */
  private async saveLastProcessedSlot(slot: number): Promise<void> {
    try {
      await db.query(
        `INSERT INTO indexer_state (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        ['last_processed_slot', slot.toString()]
      );
    } catch (error) {
      logger.error('Error saving last processed slot:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: {
      database: boolean;
      redis: boolean;
      rpc: boolean;
    };
    syncStatus: SyncStatus;
  }> {
    const dbHealthy = await db.healthCheck();
    const redisHealthy = await redis.healthCheck();
    const rpcHealthy = await connectionPool.healthCheck();

    return {
      healthy: dbHealthy && redisHealthy && rpcHealthy && this.isRunning,
      services: {
        database: dbHealthy,
        redis: redisHealthy,
        rpc: rpcHealthy,
      },
      syncStatus: this.getSyncStatus(),
    };
  }
}

export default IndexerService;
