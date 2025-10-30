/**
 * Configuration management for Memory Minting Service
 */

import dotenv from 'dotenv';
import { ServiceConfig } from '../types';

// Load environment variables
dotenv.config();

/**
 * Get required environment variable
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable
 */
function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get numeric environment variable
 */
function getNumericEnvVar(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value for ${key}: ${value}`);
  }
  return parsed;
}

/**
 * Load service configuration from environment variables
 */
export function loadConfig(): ServiceConfig {
  return {
    solana: {
      rpcUrl: getEnvVar('SOLANA_RPC_URL', 'https://api.devnet.solana.com'),
      network: getEnvVar('SOLANA_NETWORK', 'devnet') as 'devnet' | 'testnet' | 'mainnet-beta',
      programId: getEnvVar('PROGRAM_ID'),
      walletPrivateKey: getEnvVar('WALLET_PRIVATE_KEY'),
    },
    arweave: {
      host: getOptionalEnvVar('ARWEAVE_HOST', 'arweave.net'),
      port: getNumericEnvVar('ARWEAVE_PORT', 443),
      protocol: getOptionalEnvVar('ARWEAVE_PROTOCOL', 'https') as 'http' | 'https',
      walletPath: getEnvVar('ARWEAVE_WALLET_PATH'),
    },
    redis: {
      host: getOptionalEnvVar('REDIS_HOST', 'localhost'),
      port: getNumericEnvVar('REDIS_PORT', 6379),
      password: process.env.REDIS_PASSWORD,
      db: getNumericEnvVar('REDIS_DB', 0),
    },
    postgres: {
      host: getOptionalEnvVar('POSTGRES_HOST', 'localhost'),
      port: getNumericEnvVar('POSTGRES_PORT', 5432),
      database: getEnvVar('POSTGRES_DB', 'memory_platform'),
      user: getEnvVar('POSTGRES_USER', 'postgres'),
      password: getEnvVar('POSTGRES_PASSWORD'),
    },
    batch: {
      size: getNumericEnvVar('BATCH_SIZE', 50),
      timeoutMs: getNumericEnvVar('BATCH_TIMEOUT_MS', 5000),
      maxConcurrent: getNumericEnvVar('MAX_CONCURRENT_BATCHES', 3),
    },
    queue: {
      name: getOptionalEnvVar('QUEUE_NAME', 'memory-minting'),
      concurrency: getNumericEnvVar('QUEUE_CONCURRENCY', 5),
      maxRetries: getNumericEnvVar('QUEUE_MAX_RETRIES', 3),
    },
    cost: {
      defaultPriorityFee: getNumericEnvVar('DEFAULT_PRIORITY_FEE', 5000),
      maxPriorityFee: getNumericEnvVar('MAX_PRIORITY_FEE', 50000),
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: ServiceConfig): void {
  // Validate Solana configuration
  if (!['devnet', 'testnet', 'mainnet-beta'].includes(config.solana.network)) {
    throw new Error(`Invalid Solana network: ${config.solana.network}`);
  }

  // Validate batch configuration
  if (config.batch.size < 1 || config.batch.size > 100) {
    throw new Error(`Invalid batch size: ${config.batch.size}. Must be between 1 and 100`);
  }

  if (config.batch.timeoutMs < 1000) {
    throw new Error(`Invalid batch timeout: ${config.batch.timeoutMs}. Must be at least 1000ms`);
  }

  // Validate queue configuration
  if (config.queue.concurrency < 1) {
    throw new Error(`Invalid queue concurrency: ${config.queue.concurrency}. Must be at least 1`);
  }

  // Validate cost configuration
  if (config.cost.defaultPriorityFee < 0) {
    throw new Error(`Invalid default priority fee: ${config.cost.defaultPriorityFee}`);
  }

  if (config.cost.maxPriorityFee < config.cost.defaultPriorityFee) {
    throw new Error('Max priority fee must be greater than or equal to default priority fee');
  }
}

/**
 * Get configuration with validation
 */
export function getConfig(): ServiceConfig {
  const config = loadConfig();
  validateConfig(config);
  return config;
}

/**
 * Export default configuration
 */
export const config = getConfig();
