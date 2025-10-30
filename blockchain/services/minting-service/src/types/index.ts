/**
 * Type definitions for Memory Minting Service
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Memory input for minting
 */
export interface MemoryInput {
  content: string;
  metadata: MemoryMetadata;
  agentId: string;
  timestamp: Date;
}

/**
 * Memory metadata
 */
export interface MemoryMetadata {
  type: 'episodic' | 'semantic' | 'procedural';
  tags?: string[];
  importance?: number;
  context?: Record<string, any>;
  [key: string]: any;
}

/**
 * Mint request
 */
export interface MintRequest {
  walletAddress: string;
  signature: string;
  memory: MemoryInput;
  options?: MintOptions;
}

/**
 * Mint options
 */
export interface MintOptions {
  priority?: 'low' | 'medium' | 'high';
  batch?: boolean;
  maxRetries?: number;
  customPriorityFee?: number;
}

/**
 * Mint result
 */
export interface MintResult {
  requestId: string;
  assetId: string;
  arweaveId: string;
  transactionSignature: string;
  cost: CostBreakdown;
  timestamp: Date;
  status: 'success' | 'failed';
}

/**
 * Batch mint request
 */
export interface BatchMintRequest {
  walletAddress: string;
  signature: string;
  memories: MemoryInput[];
  options?: MintOptions;
}

/**
 * Batch mint result
 */
export interface BatchMintResult {
  batchId: string;
  assetIds: string[];
  totalCost: CostBreakdown;
  successCount: number;
  failedCount: number;
  results: MintResult[];
  timestamp: Date;
}

/**
 * Mint status
 */
export interface MintStatus {
  requestId: string;
  status: 'pending' | 'encrypting' | 'uploading' | 'minting' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  error?: string;
  result?: MintResult;
}

/**
 * Cost breakdown
 */
export interface CostBreakdown {
  solanaTransaction: number; // in lamports
  arweaveStorage: number; // in winston
  priorityFee: number; // in lamports
  total: number; // in lamports
  totalSOL: number; // in SOL
  totalAR: number; // in AR
}

/**
 * Cost estimate
 */
export interface CostEstimate {
  memoryCount: number;
  estimatedCost: CostBreakdown;
  breakdown: {
    perMemory: CostBreakdown;
    batchOverhead: CostBreakdown;
  };
}

/**
 * Batch info
 */
export interface BatchInfo {
  batchId: string;
  ownerAddress: string;
  memoryCount: number;
  totalSizeBytes: number;
  merkleTreeAddress: string;
  transactionSignature: string;
  totalCost: CostBreakdown;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
  error?: string;
}

/**
 * Queue job data
 */
export interface MintJobData {
  requestId: string;
  walletAddress: string;
  memory: MemoryInput;
  options: MintOptions;
  batchId?: string;
  retryCount: number;
}

/**
 * Batch job data
 */
export interface BatchJobData {
  batchId: string;
  walletAddress: string;
  memories: MemoryInput[];
  options: MintOptions;
  retryCount: number;
}

/**
 * Transaction builder options
 */
export interface TransactionBuilderOptions {
  priorityFee?: number;
  computeUnitLimit?: number;
  recentBlockhash?: string;
}

/**
 * Solana transaction result
 */
export interface SolanaTransactionResult {
  signature: string;
  slot: number;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  err: any;
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  solana: {
    rpcUrl: string;
    network: 'devnet' | 'testnet' | 'mainnet-beta';
    programId: string;
    walletPrivateKey: string;
  };
  arweave: {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    walletPath: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  batch: {
    size: number;
    timeoutMs: number;
    maxConcurrent: number;
  };
  queue: {
    name: string;
    concurrency: number;
    maxRetries: number;
  };
  cost: {
    defaultPriorityFee: number;
    maxPriorityFee: number;
  };
}

/**
 * Service health status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    solana: ServiceStatus;
    arweave: ServiceStatus;
    redis: ServiceStatus;
    postgres: ServiceStatus;
    queue: ServiceStatus;
  };
  metrics: {
    totalMinted: number;
    successRate: number;
    averageProcessingTime: number;
    queueSize: number;
  };
}

/**
 * Individual service status
 */
export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
  lastCheck: Date;
}

/**
 * Minting metrics
 */
export interface MintingMetrics {
  totalRequests: number;
  successfulMints: number;
  failedMints: number;
  averageProcessingTime: number;
  averageCost: CostBreakdown;
  batchesProcessed: number;
  queueSize: number;
  activeJobs: number;
}
