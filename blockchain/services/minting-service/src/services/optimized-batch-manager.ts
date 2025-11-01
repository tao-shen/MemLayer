/**
 * Optimized Batch Manager
 * Enhanced batch manager with optimization and merging capabilities
 */

import { EventEmitter } from 'events';
import { BatchManager } from './batch-manager';
import { BatchOptimizer } from './batch-optimizer';
import { BatchMerger } from './batch-merger';
import { ServiceConfig } from '../types';
import { logger } from '../utils/logger';

/**
 * Optimized Batch Manager Configuration
 */
interface OptimizedBatchManagerConfig extends ServiceConfig {
  enableOptimization: boolean;
  enableMerging: boolean;
  optimizationInterval: number;
  metricsWindowSize: number;
}

/**
 * Optimized Batch Manager Implementation
 */
export class OptimizedBatchManager extends EventEmitter {
  private batchManager: BatchManager;
  private optimizer?: BatchOptimizer;
  private merger?: BatchMerger;
  private metricsCollectionTimer?: NodeJS.Timeout;

  constructor(private config: OptimizedBatchManagerConfig) {
    super();

    // Initialize base batch manager
    this.batchManager = new BatchManager(config);

    // Initialize optimizer if enabled
    if (config.enableOptimization) {
      this.optimizer = new BatchOptimizer(
        {
          minBatchSize: Math.floor(config.batch.size * 0.5),
          maxBatchSize: Math.floor(config.batch.size * 1.5),
          minTimeout: Math.floor(config.batch.timeoutMs * 0.5),
          maxTimeout: Math.floor(config.batch.timeoutMs * 2),
          metricsWindowSize: config.metricsWindowSize || 300000, // 5 minutes
          optimizationInterval: config.optimizationInterval || 60000, // 1 minute
        },
        config.batch.size,
        config.batch.timeoutMs
      );

      this.setupOptimizerListeners();
    }

    // Initialize merger if enabled
    if (config.enableMerging) {
      this.merger = new BatchMerger({
        minBatchSizeForMerge: Math.floor(config.batch.size * 0.3),
        maxMergedBatchSize: config.batch.size,
        mergeWindowMs: config.batch.timeoutMs * 2,
        costSavingsThreshold: 1000, // lamports
      });

      this.setupMergerListeners();
    }

    // Setup batch manager listeners
    this.setupBatchManagerListeners();

    // Start metrics collection
    if (config.enableOptimization) {
      this.startMetricsCollection();
    }

    logger.info('Optimized Batch Manager initialized', {
      enableOptimization: config.enableOptimization,
      enableMerging: config.enableMerging,
    });
  }

  /**
   * Add memory to batch (delegates to base manager)
   */
  async addToBatch(request: any): Promise<string> {
    return this.batchManager.addToBatch(request);
  }

  /**
   * Process batches (delegates to base manager)
   */
  async processBatches(): Promise<void> {
    return this.batchManager.processBatches();
  }

  /**
   * Get batch status (delegates to base manager)
   */
  async getBatchStatus(batchId: string): Promise<any> {
    return this.batchManager.getBatchStatus(batchId);
  }

  /**
   * Cancel batch (delegates to base manager)
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    return this.batchManager.cancelBatch(batchId);
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): {
    batch: ReturnType<typeof this.batchManager.getBatchStats>;
    optimizer?: ReturnType<typeof this.optimizer.getStatistics>;
    merger?: ReturnType<typeof this.merger.getMergeStatistics>;
  } {
    const stats: any = {
      batch: this.batchManager.getBatchStats(),
    };

    if (this.optimizer) {
      stats.optimizer = this.optimizer.getStatistics();
    }

    if (this.merger) {
      stats.merger = this.merger.getMergeStatistics();
    }

    return stats;
  }

  /**
   * Get current optimization settings
   */
  getCurrentSettings(): {
    batchSize: number;
    timeout: number;
  } {
    if (this.optimizer) {
      return {
        batchSize: this.optimizer.getCurrentBatchSize(),
        timeout: this.optimizer.getCurrentTimeout(),
      };
    }

    return {
      batchSize: this.config.batch.size,
      timeout: this.config.batch.timeoutMs,
    };
  }

  /**
   * Force optimization evaluation
   */
  forceOptimization(): void {
    if (!this.optimizer) {
      logger.warn('Optimization not enabled');
      return;
    }

    const recommendation = this.optimizer.getOptimizationRecommendation();
    this.optimizer.applyOptimization(recommendation);

    logger.info('Forced optimization applied', { recommendation });
  }

  /**
   * Force merge evaluation
   */
  forceMergeEvaluation(): void {
    if (!this.merger) {
      logger.warn('Merging not enabled');
      return;
    }

    const opportunities = this.merger.evaluateMergeOpportunities();

    logger.info('Merge evaluation completed', {
      opportunities: opportunities.length,
    });

    this.emit('merge:evaluation', { opportunities });
  }

  /**
   * Setup optimizer listeners
   */
  private setupOptimizerListeners(): void {
    if (!this.optimizer) return;

    this.optimizer.on('optimization:applied', (data) => {
      logger.info('Batch optimization applied', data);

      // Update batch manager configuration
      // Note: This would require extending BatchManager to support dynamic config updates
      this.emit('optimization:applied', data);
    });
  }

  /**
   * Setup merger listeners
   */
  private setupMergerListeners(): void {
    if (!this.merger) return;

    this.merger.on('merge:opportunity', (mergeResult) => {
      logger.info('Merge opportunity detected', {
        sourceBatches: mergeResult.sourceBatchIds.length,
        totalItems: mergeResult.totalItems,
        savings: mergeResult.estimatedSavings,
      });

      this.emit('merge:opportunity', mergeResult);

      // Auto-execute merge if savings are significant
      if (mergeResult.estimatedSavings > 5000) {
        this.executeMerge(mergeResult.sourceBatchIds).catch((error) => {
          logger.error('Failed to execute auto-merge', { error: error.message });
        });
      }
    });

    this.merger.on('merge:executed', (mergeResult) => {
      logger.info('Batch merge executed', {
        mergedBatchId: mergeResult.mergedBatchId,
        sourceBatches: mergeResult.sourceBatchIds.length,
      });

      this.emit('merge:executed', mergeResult);
    });
  }

  /**
   * Setup batch manager listeners
   */
  private setupBatchManagerListeners(): void {
    this.batchManager.on('batch:created', (data) => {
      if (this.merger) {
        // Add as merge candidate
        this.merger.addCandidate({
          batchId: data.batchId,
          itemCount: 0,
          totalSize: 0,
          walletAddress: data.walletAddress,
          createdAt: new Date(),
          priority: 'medium',
        });
      }

      this.emit('batch:created', data);
    });

    this.batchManager.on('batch:completed', (data) => {
      if (this.optimizer) {
        // Record batch performance
        this.optimizer.recordBatchPerformance({
          batchSize: data.itemCount,
          processingTime: data.duration,
          successRate: 1.0,
          costPerMemory: 0, // Would be calculated from actual costs
        });
      }

      if (this.merger) {
        // Remove from merge candidates
        this.merger.removeCandidate(data.batchId);
      }

      this.emit('batch:completed', data);
    });

    this.batchManager.on('batch:failed', (data) => {
      if (this.optimizer) {
        // Record failure
        this.optimizer.recordBatchPerformance({
          batchSize: data.itemCount,
          processingTime: 0,
          successRate: 0,
          costPerMemory: 0,
        });
      }

      this.emit('batch:failed', data);
    });
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsCollectionTimer = setInterval(() => {
      this.collectNetworkMetrics().catch((error) => {
        logger.error('Failed to collect network metrics', { error: error.message });
      });
    }, 30000); // Every 30 seconds

    logger.info('Started metrics collection');
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics(): Promise<void> {
    if (!this.optimizer) return;

    try {
      // TODO: Implement actual network metrics collection
      // This would query Solana RPC for current network conditions

      // Placeholder metrics
      const metrics = {
        rpcLatency: Math.random() * 200 + 50, // 50-250ms
        transactionSuccessRate: 0.95 + Math.random() * 0.05, // 95-100%
        networkCongestion: Math.random() * 0.5, // 0-50%
        averageConfirmationTime: Math.random() * 10000 + 5000, // 5-15s
        gasPrice: Math.random() * 1000 + 5000, // 5000-6000 lamports
      };

      this.optimizer.recordNetworkMetrics(metrics);
    } catch (error: any) {
      logger.error('Error collecting network metrics', { error: error.message });
    }
  }

  /**
   * Execute merge
   */
  private async executeMerge(sourceBatchIds: string[]): Promise<void> {
    if (!this.merger) return;

    try {
      const mergeResult = await this.merger.executeMerge(sourceBatchIds);

      logger.info('Merge executed successfully', {
        mergedBatchId: mergeResult.mergedBatchId,
        savings: mergeResult.estimatedSavings,
      });

      // TODO: Implement actual batch merging in BatchManager
      // This would combine the source batches into a single batch
    } catch (error: any) {
      logger.error('Failed to execute merge', { error: error.message });
      throw error;
    }
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Optimized Batch Manager');

    // Stop metrics collection
    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
    }

    // Shutdown components
    if (this.optimizer) {
      this.optimizer.shutdown();
    }

    if (this.merger) {
      this.merger.shutdown();
    }

    await this.batchManager.shutdown();

    logger.info('Optimized Batch Manager shutdown complete');
  }
}
