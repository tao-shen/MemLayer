/**
 * Batch Manager
 * Manages batching of memory minting requests
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { IBatchManager } from '../interfaces';
import {
  MintRequest,
  BatchInfo,
  MemoryInput,
  MintOptions,
  ServiceConfig,
} from '../types';
import { logger, logBatchOperation } from '../utils/logger';
import { MintingError, MintingErrorCode, createBatchError } from '../utils/errors';

/**
 * Batch item
 */
interface BatchItem {
  requestId: string;
  request: MintRequest;
  addedAt: Date;
}

/**
 * Pending batch
 */
interface PendingBatch {
  batchId: string;
  items: BatchItem[];
  createdAt: Date;
  scheduledProcessing?: NodeJS.Timeout;
}

/**
 * Batch Manager Implementation
 */
export class BatchManager extends EventEmitter implements IBatchManager {
  private pendingBatches: Map<string, PendingBatch> = new Map();
  private processingBatches: Set<string> = new Set();
  private completedBatches: Map<string, BatchInfo> = new Map();
  private maxBatchSize: number;
  private batchTimeout: number;
  private maxConcurrentBatches: number;

  constructor(private config: ServiceConfig) {
    super();
    this.maxBatchSize = config.batch.size;
    this.batchTimeout = config.batch.timeoutMs;
    this.maxConcurrentBatches = config.batch.maxConcurrent;

    logger.info('Batch Manager initialized', {
      maxBatchSize: this.maxBatchSize,
      batchTimeout: this.batchTimeout,
      maxConcurrentBatches: this.maxConcurrentBatches,
    });
  }

  /**
   * Add memory to batch queue
   */
  async addToBatch(request: MintRequest): Promise<string> {
    const requestId = uuidv4();

    try {
      // Validate request
      this.validateRequest(request);

      // Find or create appropriate batch
      const batch = this.findOrCreateBatch(request.walletAddress);

      // Add item to batch
      const item: BatchItem = {
        requestId,
        request,
        addedAt: new Date(),
      };

      batch.items.push(item);

      logger.debug('Added item to batch', {
        requestId,
        batchId: batch.batchId,
        batchSize: batch.items.length,
        walletAddress: request.walletAddress,
      });

      this.emit('item:added', {
        requestId,
        batchId: batch.batchId,
        batchSize: batch.items.length,
      });

      // Check if batch should be processed
      if (batch.items.length >= this.maxBatchSize) {
        logger.info('Batch reached max size, triggering processing', {
          batchId: batch.batchId,
          size: batch.items.length,
        });
        await this.triggerBatchProcessing(batch.batchId);
      } else if (!batch.scheduledProcessing) {
        // Schedule timeout-based processing
        batch.scheduledProcessing = setTimeout(() => {
          this.triggerBatchProcessing(batch.batchId).catch((error) => {
            logger.error('Failed to trigger batch processing', {
              batchId: batch.batchId,
              error: error.message,
            });
          });
        }, this.batchTimeout);

        logger.debug('Scheduled batch processing', {
          batchId: batch.batchId,
          timeout: this.batchTimeout,
        });
      }

      return requestId;
    } catch (error) {
      logger.error('Failed to add item to batch', {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process pending batches
   */
  async processBatches(): Promise<void> {
    const startTime = Date.now();

    try {
      // Get batches ready for processing
      const batchesToProcess = Array.from(this.pendingBatches.values()).filter(
        (batch) => batch.items.length > 0
      );

      if (batchesToProcess.length === 0) {
        logger.debug('No batches to process');
        return;
      }

      logger.info('Processing batches', {
        count: batchesToProcess.length,
        totalItems: batchesToProcess.reduce((sum, b) => sum + b.items.length, 0),
      });

      // Process batches with concurrency limit
      const processingPromises: Promise<void>[] = [];

      for (const batch of batchesToProcess) {
        // Wait if max concurrent batches reached
        while (this.processingBatches.size >= this.maxConcurrentBatches) {
          await this.sleep(100);
        }

        processingPromises.push(this.processBatch(batch));
      }

      await Promise.all(processingPromises);

      const duration = Date.now() - startTime;
      logger.info('Completed processing batches', {
        count: batchesToProcess.length,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logBatchOperation('processBatches', {
        duration,
        error,
      });
      throw error;
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<BatchInfo> {
    // Check completed batches
    const completed = this.completedBatches.get(batchId);
    if (completed) {
      return completed;
    }

    // Check pending batches
    const pending = this.pendingBatches.get(batchId);
    if (pending) {
      return {
        batchId: pending.batchId,
        ownerAddress: pending.items[0]?.request.walletAddress || '',
        memoryCount: pending.items.length,
        totalSizeBytes: this.calculateBatchSize(pending.items),
        merkleTreeAddress: '',
        transactionSignature: '',
        totalCost: {
          solanaTransaction: 0,
          arweaveStorage: 0,
          priorityFee: 0,
          total: 0,
          totalSOL: 0,
          totalAR: 0,
        },
        status: 'pending',
        createdAt: pending.createdAt,
      };
    }

    // Check processing batches
    if (this.processingBatches.has(batchId)) {
      return {
        batchId,
        ownerAddress: '',
        memoryCount: 0,
        totalSizeBytes: 0,
        merkleTreeAddress: '',
        transactionSignature: '',
        totalCost: {
          solanaTransaction: 0,
          arweaveStorage: 0,
          priorityFee: 0,
          total: 0,
          totalSOL: 0,
          totalAR: 0,
        },
        status: 'processing',
        createdAt: new Date(),
      };
    }

    throw new MintingError(
      MintingErrorCode.RECORD_NOT_FOUND,
      `Batch not found: ${batchId}`,
      { batchId },
      false
    );
  }

  /**
   * Cancel batch
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    const batch = this.pendingBatches.get(batchId);

    if (!batch) {
      logger.warn('Batch not found for cancellation', { batchId });
      return false;
    }

    // Clear scheduled processing
    if (batch.scheduledProcessing) {
      clearTimeout(batch.scheduledProcessing);
    }

    // Remove batch
    this.pendingBatches.delete(batchId);

    logger.info('Batch cancelled', {
      batchId,
      itemCount: batch.items.length,
    });

    this.emit('batch:cancelled', {
      batchId,
      itemCount: batch.items.length,
    });

    return true;
  }

  /**
   * Get batch statistics
   */
  getBatchStats(): {
    pending: number;
    processing: number;
    completed: number;
    totalItems: number;
  } {
    const totalItems = Array.from(this.pendingBatches.values()).reduce(
      (sum, batch) => sum + batch.items.length,
      0
    );

    return {
      pending: this.pendingBatches.size,
      processing: this.processingBatches.size,
      completed: this.completedBatches.size,
      totalItems,
    };
  }

  /**
   * Clear completed batches
   */
  clearCompletedBatches(olderThan?: Date): void {
    const cutoffTime = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    let cleared = 0;
    for (const [batchId, batch] of this.completedBatches.entries()) {
      if (batch.createdAt < cutoffTime) {
        this.completedBatches.delete(batchId);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Cleared completed batches', { count: cleared });
    }
  }

  /**
   * Find or create batch for wallet
   */
  private findOrCreateBatch(walletAddress: string): PendingBatch {
    // Try to find existing batch for this wallet
    for (const batch of this.pendingBatches.values()) {
      if (
        batch.items.length > 0 &&
        batch.items[0].request.walletAddress === walletAddress &&
        batch.items.length < this.maxBatchSize
      ) {
        return batch;
      }
    }

    // Create new batch
    const batchId = uuidv4();
    const batch: PendingBatch = {
      batchId,
      items: [],
      createdAt: new Date(),
    };

    this.pendingBatches.set(batchId, batch);

    logger.debug('Created new batch', { batchId, walletAddress });

    this.emit('batch:created', { batchId, walletAddress });

    return batch;
  }

  /**
   * Trigger batch processing
   */
  private async triggerBatchProcessing(batchId: string): Promise<void> {
    const batch = this.pendingBatches.get(batchId);

    if (!batch) {
      logger.warn('Batch not found for processing', { batchId });
      return;
    }

    if (batch.items.length === 0) {
      logger.warn('Batch is empty, skipping processing', { batchId });
      this.pendingBatches.delete(batchId);
      return;
    }

    // Clear scheduled processing
    if (batch.scheduledProcessing) {
      clearTimeout(batch.scheduledProcessing);
      batch.scheduledProcessing = undefined;
    }

    // Process batch
    await this.processBatch(batch);
  }

  /**
   * Process a single batch
   */
  private async processBatch(batch: PendingBatch): Promise<void> {
    const { batchId, items } = batch;
    const startTime = Date.now();

    try {
      // Mark as processing
      this.processingBatches.add(batchId);
      this.pendingBatches.delete(batchId);

      logger.info('Processing batch', {
        batchId,
        itemCount: items.length,
      });

      this.emit('batch:processing', {
        batchId,
        itemCount: items.length,
      });

      // TODO: Implement actual batch processing logic
      // This will be implemented in the MintingCoordinator
      // For now, we'll emit an event for the coordinator to handle

      this.emit('batch:ready', {
        batchId,
        items: items.map((item) => ({
          requestId: item.requestId,
          memory: item.request.memory,
          options: item.request.options,
        })),
        walletAddress: items[0].request.walletAddress,
      });

      const duration = Date.now() - startTime;

      // Create batch info (placeholder)
      const batchInfo: BatchInfo = {
        batchId,
        ownerAddress: items[0].request.walletAddress,
        memoryCount: items.length,
        totalSizeBytes: this.calculateBatchSize(items),
        merkleTreeAddress: '',
        transactionSignature: '',
        totalCost: {
          solanaTransaction: 0,
          arweaveStorage: 0,
          priorityFee: 0,
          total: 0,
          totalSOL: 0,
          totalAR: 0,
        },
        status: 'completed',
        createdAt: batch.createdAt,
        confirmedAt: new Date(),
      };

      // Store completed batch
      this.completedBatches.set(batchId, batchInfo);
      this.processingBatches.delete(batchId);

      logBatchOperation('processBatch', {
        batchId,
        memoryCount: items.length,
        successCount: items.length,
        failedCount: 0,
        duration,
      });

      this.emit('batch:completed', {
        batchId,
        itemCount: items.length,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.processingBatches.delete(batchId);

      logBatchOperation('processBatch', {
        batchId,
        memoryCount: items.length,
        duration,
        error,
      });

      this.emit('batch:failed', {
        batchId,
        itemCount: items.length,
        error: error.message,
      });

      throw createBatchError(`Failed to process batch: ${error.message}`, {
        batchId,
        itemCount: items.length,
        error,
      });
    }
  }

  /**
   * Calculate batch size in bytes
   */
  private calculateBatchSize(items: BatchItem[]): number {
    return items.reduce((total, item) => {
      const contentSize = Buffer.from(item.request.memory.content).length;
      const metadataSize = Buffer.from(JSON.stringify(item.request.memory.metadata)).length;
      return total + contentSize + metadataSize;
    }, 0);
  }

  /**
   * Validate request
   */
  private validateRequest(request: MintRequest): void {
    if (!request.walletAddress) {
      throw new MintingError(
        MintingErrorCode.INVALID_REQUEST,
        'Wallet address is required',
        { request },
        false
      );
    }

    if (!request.memory) {
      throw new MintingError(
        MintingErrorCode.INVALID_REQUEST,
        'Memory data is required',
        { request },
        false
      );
    }

    if (!request.memory.content) {
      throw new MintingError(
        MintingErrorCode.INVALID_MEMORY_DATA,
        'Memory content is required',
        { request },
        false
      );
    }

    if (!request.memory.agentId) {
      throw new MintingError(
        MintingErrorCode.INVALID_MEMORY_DATA,
        'Agent ID is required',
        { request },
        false
      );
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Shutdown batch manager
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Batch Manager');

    // Clear all scheduled processing
    for (const batch of this.pendingBatches.values()) {
      if (batch.scheduledProcessing) {
        clearTimeout(batch.scheduledProcessing);
      }
    }

    // Wait for processing batches to complete
    while (this.processingBatches.size > 0) {
      await this.sleep(100);
    }

    logger.info('Batch Manager shutdown complete');
  }
}
