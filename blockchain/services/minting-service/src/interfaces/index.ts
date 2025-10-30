/**
 * Service interfaces for Memory Minting Service
 */

import {
  MintRequest,
  MintResult,
  BatchMintRequest,
  BatchMintResult,
  MintStatus,
  CostEstimate,
  BatchInfo,
  HealthStatus,
  MintingMetrics,
} from '../types';

/**
 * Memory Minting Service Interface
 */
export interface IMemoryMintingService {
  /**
   * Mint a single memory as compressed NFT
   */
  mintMemory(request: MintRequest): Promise<MintResult>;

  /**
   * Mint multiple memories in batch
   */
  mintBatch(request: BatchMintRequest): Promise<BatchMintResult>;

  /**
   * Get minting status
   */
  getMintStatus(requestId: string): Promise<MintStatus>;

  /**
   * Estimate minting cost
   */
  estimateCost(memoryCount: number): Promise<CostEstimate>;

  /**
   * Get batch information
   */
  getBatchInfo(batchId: string): Promise<BatchInfo>;

  /**
   * Get service health status
   */
  getHealthStatus(): Promise<HealthStatus>;

  /**
   * Get minting metrics
   */
  getMetrics(): Promise<MintingMetrics>;
}

/**
 * Batch Manager Interface
 */
export interface IBatchManager {
  /**
   * Add memory to batch queue
   */
  addToBatch(request: MintRequest): Promise<string>;

  /**
   * Process pending batches
   */
  processBatches(): Promise<void>;

  /**
   * Get batch status
   */
  getBatchStatus(batchId: string): Promise<BatchInfo>;

  /**
   * Cancel batch
   */
  cancelBatch(batchId: string): Promise<boolean>;
}

/**
 * Minting Coordinator Interface
 */
export interface IMintingCoordinator {
  /**
   * Coordinate full minting process
   */
  coordinateMint(request: MintRequest): Promise<MintResult>;

  /**
   * Coordinate batch minting
   */
  coordinateBatchMint(request: BatchMintRequest): Promise<BatchMintResult>;

  /**
   * Rollback failed mint
   */
  rollbackMint(requestId: string): Promise<void>;
}

/**
 * Transaction Builder Interface
 */
export interface ITransactionBuilder {
  /**
   * Build mint transaction
   */
  buildMintTransaction(
    walletAddress: string,
    arweaveId: string,
    metadata: any
  ): Promise<any>;

  /**
   * Build batch mint transaction
   */
  buildBatchMintTransaction(
    walletAddress: string,
    items: Array<{ arweaveId: string; metadata: any }>
  ): Promise<any>;

  /**
   * Sign transaction
   */
  signTransaction(transaction: any): Promise<any>;

  /**
   * Send and confirm transaction
   */
  sendAndConfirmTransaction(transaction: any): Promise<string>;

  /**
   * Calculate priority fee
   */
  calculatePriorityFee(priority: 'low' | 'medium' | 'high'): Promise<number>;
}

/**
 * Cost Estimator Interface
 */
export interface ICostEstimator {
  /**
   * Estimate Solana transaction cost
   */
  estimateSolanaTransactionCost(memoryCount: number): Promise<number>;

  /**
   * Estimate Arweave storage cost
   */
  estimateArweaveStorageCost(dataSize: number): Promise<number>;

  /**
   * Estimate total cost
   */
  estimateTotalCost(memoryCount: number, dataSize: number): Promise<CostEstimate>;

  /**
   * Get current network fees
   */
  getCurrentNetworkFees(): Promise<{ solana: number; arweave: number }>;
}

/**
 * Queue Processor Interface
 */
export interface IQueueProcessor {
  /**
   * Add job to queue
   */
  addJob(jobData: any): Promise<string>;

  /**
   * Process job
   */
  processJob(jobId: string): Promise<void>;

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Promise<any>;

  /**
   * Cancel job
   */
  cancelJob(jobId: string): Promise<boolean>;

  /**
   * Get queue statistics
   */
  getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
}

/**
 * State Manager Interface
 */
export interface IStateManager {
  /**
   * Save mint request state
   */
  saveMintState(requestId: string, state: MintStatus): Promise<void>;

  /**
   * Get mint request state
   */
  getMintState(requestId: string): Promise<MintStatus | null>;

  /**
   * Update mint state
   */
  updateMintState(requestId: string, updates: Partial<MintStatus>): Promise<void>;

  /**
   * Delete mint state
   */
  deleteMintState(requestId: string): Promise<void>;

  /**
   * Save batch state
   */
  saveBatchState(batchId: string, state: BatchInfo): Promise<void>;

  /**
   * Get batch state
   */
  getBatchState(batchId: string): Promise<BatchInfo | null>;
}
