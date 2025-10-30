import { ArweaveClient, ArweaveTag } from './arweave-client';
import { EventEmitter } from 'events';
import { ErrorHandler, ArweaveError, withRetry, DEFAULT_RETRY_CONFIG } from './error-handler';

/**
 * Upload Manager
 * Handles uploading data to Arweave with progress tracking
 */
export class UploadManager extends EventEmitter {
  private uploadQueue: UploadTask[] = [];
  private activeUploads: Map<string, UploadTask> = new Map();
  private maxConcurrent: number = 3;
  private errorHandler: ErrorHandler;

  constructor(private client: ArweaveClient) {
    super();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Upload single file
   */
  async upload(data: Buffer, tags: ArweaveTag[], options?: UploadOptions): Promise<UploadResult> {
    const taskId = this.generateTaskId();
    const task: UploadTask = {
      id: taskId,
      data,
      tags,
      options: options || {},
      status: 'pending',
      createdAt: new Date(),
    };

    this.emit('upload:queued', { taskId, dataSize: data.length });

    try {
      // Create transaction
      task.status = 'creating';
      this.emit('upload:creating', { taskId });
      
      const transaction = await this.client.createTransaction(data, tags);
      task.transactionId = transaction.id;

      // Sign transaction
      task.status = 'signing';
      this.emit('upload:signing', { taskId, txId: transaction.id });
      
      await this.client.signTransaction(transaction);

      // Post transaction
      task.status = 'uploading';
      this.emit('upload:uploading', { taskId, txId: transaction.id });
      
      const postResult = await this.client.postTransaction(transaction);

      if (!postResult.success) {
        throw new Error(`Upload failed: ${postResult.statusText}`);
      }

      task.status = 'completed';
      task.completedAt = new Date();

      this.emit('upload:completed', {
        taskId,
        txId: transaction.id,
        duration: task.completedAt.getTime() - task.createdAt.getTime(),
      });

      return {
        txId: transaction.id,
        status: 'completed',
        dataSize: data.length,
        tags,
        timestamp: task.completedAt,
      };
    } catch (error) {
      task.status = 'failed';
      const arweaveError = this.errorHandler.handleError(error, 'upload');
      task.error = arweaveError.message;
      
      this.emit('upload:failed', { taskId, error: arweaveError.message, code: arweaveError.code });
      
      throw arweaveError;
    }
  }

  /**
   * Upload multiple files in batch
   */
  async uploadBatch(items: BatchUploadItem[]): Promise<BatchUploadResult> {
    const results: UploadResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    this.emit('batch:started', { count: items.length });

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await this.upload(items[i].data, items[i].tags, items[i].options);
        results.push(result);
        
        this.emit('batch:progress', {
          current: i + 1,
          total: items.length,
          percentage: ((i + 1) / items.length) * 100,
        });
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    this.emit('batch:completed', {
      total: items.length,
      successful: results.length,
      failed: errors.length,
    });

    return {
      successful: results,
      failed: errors,
      totalCount: items.length,
      successCount: results.length,
      failureCount: errors.length,
    };
  }

  /**
   * Upload with retry logic
   */
  async uploadWithRetry(
    data: Buffer,
    tags: ArweaveTag[],
    maxRetries: number = 3
  ): Promise<UploadResult> {
    return withRetry(
      () => this.upload(data, tags),
      {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries,
      },
      this.errorHandler,
      'uploadWithRetry'
    );
  }

  /**
   * Get upload progress
   */
  getProgress(taskId: string): UploadProgress | null {
    const task = this.activeUploads.get(taskId);
    if (!task) return null;

    return {
      taskId: task.id,
      status: task.status,
      transactionId: task.transactionId,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      error: task.error,
    };
  }

  /**
   * Cancel upload
   */
  async cancelUpload(taskId: string): Promise<boolean> {
    const task = this.activeUploads.get(taskId);
    if (!task) return false;

    task.status = 'cancelled';
    this.activeUploads.delete(taskId);
    
    this.emit('upload:cancelled', { taskId });
    return true;
  }

  /**
   * Get active uploads count
   */
  getActiveUploadsCount(): number {
    return this.activeUploads.size;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
 * Upload task
 */
interface UploadTask {
  id: string;
  data: Buffer;
  tags: ArweaveTag[];
  options: UploadOptions;
  status: 'pending' | 'creating' | 'signing' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Upload options
 */
export interface UploadOptions {
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

/**
 * Upload result
 */
export interface UploadResult {
  txId: string;
  status: string;
  dataSize: number;
  tags: ArweaveTag[];
  timestamp: Date;
}

/**
 * Batch upload item
 */
export interface BatchUploadItem {
  data: Buffer;
  tags: ArweaveTag[];
  options?: UploadOptions;
}

/**
 * Batch upload result
 */
export interface BatchUploadResult {
  successful: UploadResult[];
  failed: Array<{ index: number; error: string }>;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

/**
 * Upload progress
 */
export interface UploadProgress {
  taskId: string;
  status: string;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}
