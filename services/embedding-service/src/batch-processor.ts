import { getEmbeddingClient } from './client';
import { createLogger } from '@agent-memory/shared';

const logger = createLogger('BatchProcessor');

export interface BatchJob {
  id: string;
  texts: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: number[][];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class BatchProcessor {
  private jobs: Map<string, BatchJob> = new Map();
  private queue: string[] = [];
  private processing: boolean = false;
  private batchSize: number;

  constructor(batchSize: number = 100) {
    this.batchSize = batchSize;
  }

  /**
   * Submit a batch job
   */
  submitJob(id: string, texts: string[]): BatchJob {
    const job: BatchJob = {
      id,
      texts,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    this.queue.push(id);

    logger.info('Batch job submitted', { jobId: id, textCount: texts.length });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue().catch((error) => {
        logger.error('Error processing queue', error);
      });
    }

    return job;
  }

  /**
   * Get job status
   */
  getJob(id: string): BatchJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const jobId = this.queue.shift();
        if (!jobId) continue;

        const job = this.jobs.get(jobId);
        if (!job) continue;

        await this.processJob(job);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: BatchJob): Promise<void> {
    try {
      job.status = 'processing';
      logger.info('Processing batch job', { jobId: job.id, textCount: job.texts.length });

      const client = getEmbeddingClient();
      const results: number[][] = [];

      // Process in batches
      for (let i = 0; i < job.texts.length; i += this.batchSize) {
        const batch = job.texts.slice(i, i + this.batchSize);
        const batchResults = await client.generateBatchEmbeddings(batch);
        results.push(...batchResults);

        // Update progress
        job.progress = Math.min(100, Math.round(((i + batch.length) / job.texts.length) * 100));
        logger.debug('Batch progress', { jobId: job.id, progress: job.progress });
      }

      job.results = results;
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();

      logger.info('Batch job completed', {
        jobId: job.id,
        textCount: job.texts.length,
        duration: job.completedAt.getTime() - job.createdAt.getTime(),
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Batch job failed', error as Error, { jobId: job.id });
    }
  }

  /**
   * Clear completed jobs older than specified time
   */
  clearOldJobs(maxAgeMs: number = 3600000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        now - job.createdAt.getTime() > maxAgeMs
      ) {
        this.jobs.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Cleared old batch jobs', { count: cleared });
    }

    return cleared;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    totalJobs: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    queueLength: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      totalJobs: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      queueLength: this.queue.length,
    };
  }
}

// Singleton instance
let batchProcessor: BatchProcessor;

export function getBatchProcessor(): BatchProcessor {
  if (!batchProcessor) {
    const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE || '100');
    batchProcessor = new BatchProcessor(batchSize);
  }
  return batchProcessor;
}
