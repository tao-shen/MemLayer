/**
 * Queue Processor
 * Manages asynchronous job processing using Bull queue
 */

import Queue, { Job, JobOptions, QueueOptions } from 'bull';
import { EventEmitter } from 'events';
import { IQueueProcessor } from '../interfaces';
import { ServiceConfig, MintJobData, BatchJobData } from '../types';
import { logger } from '../utils/logger';
import { MintingError, MintingErrorCode } from '../utils/errors';

/**
 * Job types
 */
export enum JobType {
  MINT_MEMORY = 'mint_memory',
  MINT_BATCH = 'mint_batch',
  RETRY_FAILED = 'retry_failed',
}

/**
 * Job data union type
 */
export type QueueJobData = MintJobData | BatchJobData;

/**
 * Queue Processor Implementation
 */
export class QueueProcessor extends EventEmitter implements IQueueProcessor {
  private queue: Queue.Queue<QueueJobData>;
  private isProcessing: boolean = false;
  private concurrency: number;
  private maxRetries: number;

  // Job handlers (to be set by coordinator)
  private jobHandlers: Map<JobType, (data: any) => Promise<any>> = new Map();

  constructor(private config: ServiceConfig) {
    super();

    this.concurrency = config.queue.concurrency;
    this.maxRetries = config.queue.maxRetries;

    // Initialize Bull queue
    const queueOptions: QueueOptions = {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
      },
      defaultJobOptions: {
        attempts: this.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    };

    this.queue = new Queue(config.queue.name, queueOptions);

    this.setupQueueHandlers();
    this.setupQueueEvents();

    logger.info('Queue Processor initialized', {
      queueName: config.queue.name,
      concurrency: this.concurrency,
      maxRetries: this.maxRetries,
    });
  }

  /**
   * Set job handler
   */
  setJobHandler(jobType: JobType, handler: (data: any) => Promise<any>): void {
    this.jobHandlers.set(jobType, handler);
    logger.debug('Job handler registered', { jobType });
  }

  /**
   * Add job to queue
   */
  async addJob(
    jobType: JobType,
    jobData: QueueJobData,
    options?: JobOptions
  ): Promise<string> {
    try {
      const job = await this.queue.add(jobType, jobData, options);

      logger.debug('Job added to queue', {
        jobId: job.id,
        jobType,
      });

      this.emit('job:added', {
        jobId: job.id,
        jobType,
      });

      return job.id.toString();
    } catch (error) {
      logger.error('Failed to add job to queue', {
        jobType,
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.QUEUE_ERROR,
        `Failed to add job to queue: ${error.message}`,
        { jobType, error },
        false
      );
    }
  }

  /**
   * Process job
   */
  async processJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      logger.debug('Processing job manually', {
        jobId,
        jobType: job.name,
      });

      // Get handler for job type
      const handler = this.jobHandlers.get(job.name as JobType);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.name}`);
      }

      // Process job
      const result = await handler(job.data);

      // Update job progress
      await job.progress(100);

      logger.info('Job processed successfully', {
        jobId,
        jobType: job.name,
      });

      return result;
    } catch (error) {
      logger.error('Failed to process job', {
        jobId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress();
      const failedReason = job.failedReason;
      const returnValue = job.returnvalue;

      return {
        jobId: job.id,
        jobType: job.name,
        state,
        progress,
        failedReason,
        returnValue,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      logger.error('Failed to get job status', {
        jobId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);

      if (!job) {
        logger.warn('Job not found for cancellation', { jobId });
        return false;
      }

      const state = await job.getState();

      // Can only cancel waiting or delayed jobs
      if (state === 'waiting' || state === 'delayed') {
        await job.remove();
        logger.info('Job cancelled', { jobId, state });
        return true;
      }

      logger.warn('Job cannot be cancelled in current state', {
        jobId,
        state,
      });
      return false;
    } catch (error) {
      logger.error('Failed to cancel job', {
        jobId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    try {
      const counts = await this.queue.getJobCounts();

      return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        paused: counts.paused || 0,
      };
    } catch (error) {
      logger.error('Failed to get queue stats', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Start processing
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      logger.warn('Queue processor already running');
      return;
    }

    this.isProcessing = true;

    logger.info('Starting queue processor', {
      concurrency: this.concurrency,
    });

    // Process jobs with concurrency
    this.queue.process('*', this.concurrency, async (job: Job<QueueJobData>) => {
      return await this.handleJob(job);
    });

    this.emit('processor:started');
  }

  /**
   * Stop processing
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      logger.warn('Queue processor not running');
      return;
    }

    logger.info('Stopping queue processor');

    await this.queue.pause(true); // Wait for active jobs to complete
    this.isProcessing = false;

    this.emit('processor:stopped');

    logger.info('Queue processor stopped');
  }

  /**
   * Pause queue
   */
  async pauseQueue(): Promise<void> {
    await this.queue.pause();
    logger.info('Queue paused');
  }

  /**
   * Resume queue
   */
  async resumeQueue(): Promise<void> {
    await this.queue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(grace: number = 24 * 3600 * 1000): Promise<void> {
    try {
      const cleaned = await this.queue.clean(grace, 'completed');
      logger.info('Cleaned old completed jobs', { count: cleaned.length });

      const failedCleaned = await this.queue.clean(7 * 24 * 3600 * 1000, 'failed');
      logger.info('Cleaned old failed jobs', { count: failedCleaned.length });
    } catch (error) {
      logger.error('Failed to clean old jobs', {
        error: error.message,
      });
    }
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(limit: number = 100): Promise<number> {
    try {
      const failedJobs = await this.queue.getFailed(0, limit);
      let retriedCount = 0;

      for (const job of failedJobs) {
        try {
          await job.retry();
          retriedCount++;
          logger.debug('Retried failed job', { jobId: job.id });
        } catch (error) {
          logger.warn('Failed to retry job', {
            jobId: job.id,
            error: error.message,
          });
        }
      }

      logger.info('Retried failed jobs', {
        total: failedJobs.length,
        retried: retriedCount,
      });

      return retriedCount;
    } catch (error) {
      logger.error('Failed to retry failed jobs', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle job processing
   */
  private async handleJob(job: Job<QueueJobData>): Promise<any> {
    const startTime = Date.now();

    try {
      logger.debug('Processing job', {
        jobId: job.id,
        jobType: job.name,
        attemptsMade: job.attemptsMade,
      });

      // Update progress
      await job.progress(10);

      // Get handler for job type
      const handler = this.jobHandlers.get(job.name as JobType);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.name}`);
      }

      // Process job
      await job.progress(25);
      const result = await handler(job.data);
      await job.progress(100);

      const duration = Date.now() - startTime;

      logger.info('Job completed', {
        jobId: job.id,
        jobType: job.name,
        duration,
      });

      this.emit('job:completed', {
        jobId: job.id,
        jobType: job.name,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Job failed', {
        jobId: job.id,
        jobType: job.name,
        attemptsMade: job.attemptsMade,
        duration,
        error: error.message,
      });

      this.emit('job:failed', {
        jobId: job.id,
        jobType: job.name,
        attemptsMade: job.attemptsMade,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Setup queue handlers
   */
  private setupQueueHandlers(): void {
    // These will be set by the coordinator
    logger.debug('Queue handlers setup ready');
  }

  /**
   * Setup queue events
   */
  private setupQueueEvents(): void {
    this.queue.on('error', (error) => {
      logger.error('Queue error', { error: error.message });
      this.emit('queue:error', error);
    });

    this.queue.on('waiting', (jobId) => {
      logger.debug('Job waiting', { jobId });
    });

    this.queue.on('active', (job) => {
      logger.debug('Job active', {
        jobId: job.id,
        jobType: job.name,
      });
    });

    this.queue.on('stalled', (job) => {
      logger.warn('Job stalled', {
        jobId: job.id,
        jobType: job.name,
      });
      this.emit('job:stalled', {
        jobId: job.id,
        jobType: job.name,
      });
    });

    this.queue.on('progress', (job, progress) => {
      logger.debug('Job progress', {
        jobId: job.id,
        progress,
      });
    });

    this.queue.on('completed', (job, result) => {
      logger.debug('Job completed event', {
        jobId: job.id,
        jobType: job.name,
      });
    });

    this.queue.on('failed', (job, error) => {
      logger.warn('Job failed event', {
        jobId: job?.id,
        jobType: job?.name,
        error: error.message,
      });
    });

    this.queue.on('paused', () => {
      logger.info('Queue paused');
    });

    this.queue.on('resumed', () => {
      logger.info('Queue resumed');
    });

    this.queue.on('cleaned', (jobs, type) => {
      logger.info('Queue cleaned', {
        count: jobs.length,
        type,
      });
    });
  }

  /**
   * Get queue instance
   */
  getQueue(): Queue.Queue<QueueJobData> {
    return this.queue;
  }

  /**
   * Check queue health
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.queue.isReady();
      return true;
    } catch (error) {
      logger.error('Queue health check failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Shutdown queue processor
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Queue Processor');

    await this.stopProcessing();
    await this.queue.close();

    logger.info('Queue Processor shutdown complete');
  }
}
