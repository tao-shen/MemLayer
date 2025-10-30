/**
 * Cost Estimator
 * Estimates costs for memory minting operations
 */

import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ICostEstimator } from '../interfaces';
import { CostEstimate, CostBreakdown, ServiceConfig } from '../types';
import { logger } from '../utils/logger';
import { createSolanaError } from '../utils/errors';

/**
 * Cost Estimator Implementation
 */
export class CostEstimator implements ICostEstimator {
  private connection: Connection;
  private defaultPriorityFee: number;
  private arweaveBasePrice: number = 0.00001; // Base price per byte in AR

  constructor(private config: ServiceConfig) {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.defaultPriorityFee = config.cost.defaultPriorityFee;

    logger.info('Cost Estimator initialized', {
      rpcUrl: config.solana.rpcUrl,
      defaultPriorityFee: this.defaultPriorityFee,
    });
  }

  /**
   * Estimate Solana transaction cost
   */
  async estimateSolanaTransactionCost(memoryCount: number): Promise<number> {
    try {
      // Base transaction fee (5000 lamports per signature)
      const baseTransactionFee = 5000;

      // Compressed NFT minting cost (very low, ~0.00005 SOL per mint)
      const mintCostPerMemory = 50; // lamports

      // Account rent (if needed, usually covered by program)
      const accountRent = 0;

      // Total cost
      const totalCost = baseTransactionFee + mintCostPerMemory * memoryCount + accountRent;

      logger.debug('Estimated Solana transaction cost', {
        memoryCount,
        baseTransactionFee,
        mintCostPerMemory,
        totalCost,
      });

      return totalCost;
    } catch (error) {
      logger.error('Failed to estimate Solana transaction cost', {
        memoryCount,
        error: error.message,
      });
      throw createSolanaError(`Failed to estimate Solana cost: ${error.message}`, { error });
    }
  }

  /**
   * Estimate Arweave storage cost
   */
  async estimateArweaveStorageCost(dataSize: number): Promise<number> {
    try {
      // Arweave pricing: approximately 0.00001 AR per byte
      // This is a simplified estimation
      const costInAR = dataSize * this.arweaveBasePrice;

      // Convert to winston (1 AR = 1e12 winston)
      const costInWinston = Math.ceil(costInAR * 1e12);

      logger.debug('Estimated Arweave storage cost', {
        dataSize,
        costInAR,
        costInWinston,
      });

      return costInWinston;
    } catch (error) {
      logger.error('Failed to estimate Arweave storage cost', {
        dataSize,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Estimate total cost
   */
  async estimateTotalCost(memoryCount: number, dataSize: number): Promise<CostEstimate> {
    try {
      // Estimate Solana transaction cost
      const solanaTransaction = await this.estimateSolanaTransactionCost(memoryCount);

      // Estimate Arweave storage cost
      const arweaveStorage = await this.estimateArweaveStorageCost(dataSize);

      // Priority fee
      const priorityFee = this.defaultPriorityFee * memoryCount;

      // Total in lamports
      const totalLamports = solanaTransaction + priorityFee;

      // Convert to SOL
      const totalSOL = totalLamports / LAMPORTS_PER_SOL;

      // Convert winston to AR (1 AR = 1e12 winston)
      const totalAR = arweaveStorage / 1e12;

      // Per memory cost
      const perMemoryCost: CostBreakdown = {
        solanaTransaction: Math.ceil(solanaTransaction / memoryCount),
        arweaveStorage: Math.ceil(arweaveStorage / memoryCount),
        priorityFee: this.defaultPriorityFee,
        total: Math.ceil((solanaTransaction + priorityFee) / memoryCount),
        totalSOL: totalSOL / memoryCount,
        totalAR: totalAR / memoryCount,
      };

      // Batch overhead (savings from batching)
      const singleMemoryCost = await this.estimateSolanaTransactionCost(1);
      const batchSavings = singleMemoryCost * memoryCount - solanaTransaction;

      const batchOverhead: CostBreakdown = {
        solanaTransaction: -batchSavings, // Negative means savings
        arweaveStorage: 0,
        priorityFee: 0,
        total: -batchSavings,
        totalSOL: -batchSavings / LAMPORTS_PER_SOL,
        totalAR: 0,
      };

      const estimate: CostEstimate = {
        memoryCount,
        estimatedCost: {
          solanaTransaction,
          arweaveStorage,
          priorityFee,
          total: totalLamports,
          totalSOL,
          totalAR,
        },
        breakdown: {
          perMemory: perMemoryCost,
          batchOverhead,
        },
      };

      logger.info('Cost estimation completed', {
        memoryCount,
        dataSize,
        totalSOL,
        totalAR,
      });

      return estimate;
    } catch (error) {
      logger.error('Failed to estimate total cost', {
        memoryCount,
        dataSize,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get current network fees
   */
  async getCurrentNetworkFees(): Promise<{ solana: number; arweave: number }> {
    try {
      // Get recent blockhash to estimate current fees
      const { feeCalculator } = await this.connection.getRecentBlockhash();
      const solanaFee = feeCalculator?.lamportsPerSignature || 5000;

      // Arweave fee (simplified, in reality would query Arweave network)
      const arweaveFee = this.arweaveBasePrice;

      logger.debug('Current network fees', {
        solana: solanaFee,
        arweave: arweaveFee,
      });

      return {
        solana: solanaFee,
        arweave: arweaveFee,
      };
    } catch (error) {
      logger.error('Failed to get current network fees', {
        error: error.message,
      });

      // Return default values on error
      return {
        solana: 5000,
        arweave: this.arweaveBasePrice,
      };
    }
  }

  /**
   * Calculate priority fee based on priority level
   */
  calculatePriorityFee(priority: 'low' | 'medium' | 'high'): number {
    const fees = {
      low: this.defaultPriorityFee * 0.5,
      medium: this.defaultPriorityFee,
      high: this.defaultPriorityFee * 2,
    };

    const fee = Math.min(fees[priority], this.config.cost.maxPriorityFee);

    logger.debug('Calculated priority fee', {
      priority,
      fee,
    });

    return fee;
  }

  /**
   * Estimate cost with custom priority
   */
  async estimateWithPriority(
    memoryCount: number,
    dataSize: number,
    priority: 'low' | 'medium' | 'high'
  ): Promise<CostEstimate> {
    const estimate = await this.estimateTotalCost(memoryCount, dataSize);

    // Adjust priority fee
    const priorityFee = this.calculatePriorityFee(priority) * memoryCount;
    const priorityDiff = priorityFee - estimate.estimatedCost.priorityFee;

    estimate.estimatedCost.priorityFee = priorityFee;
    estimate.estimatedCost.total += priorityDiff;
    estimate.estimatedCost.totalSOL = estimate.estimatedCost.total / LAMPORTS_PER_SOL;

    return estimate;
  }

  /**
   * Compare batch vs individual minting costs
   */
  async compareBatchCost(memoryCount: number, dataSize: number): Promise<{
    batch: CostEstimate;
    individual: CostEstimate;
    savings: {
      lamports: number;
      sol: number;
      percentage: number;
    };
  }> {
    // Batch cost
    const batchCost = await this.estimateTotalCost(memoryCount, dataSize);

    // Individual cost (sum of single mints)
    const singleCost = await this.estimateTotalCost(1, Math.ceil(dataSize / memoryCount));
    const individualTotal = singleCost.estimatedCost.total * memoryCount;
    const individualSOL = individualTotal / LAMPORTS_PER_SOL;

    const individualCost: CostEstimate = {
      memoryCount,
      estimatedCost: {
        ...singleCost.estimatedCost,
        total: individualTotal,
        totalSOL: individualSOL,
      },
      breakdown: singleCost.breakdown,
    };

    // Calculate savings
    const savingsLamports = individualTotal - batchCost.estimatedCost.total;
    const savingsSOL = savingsLamports / LAMPORTS_PER_SOL;
    const savingsPercentage = (savingsLamports / individualTotal) * 100;

    logger.info('Batch cost comparison', {
      memoryCount,
      batchCost: batchCost.estimatedCost.totalSOL,
      individualCost: individualSOL,
      savings: savingsSOL,
      savingsPercentage: savingsPercentage.toFixed(2) + '%',
    });

    return {
      batch: batchCost,
      individual: individualCost,
      savings: {
        lamports: savingsLamports,
        sol: savingsSOL,
        percentage: savingsPercentage,
      },
    };
  }

  /**
   * Format cost for display
   */
  formatCost(cost: CostBreakdown): string {
    return `${cost.totalSOL.toFixed(6)} SOL + ${cost.totalAR.toFixed(6)} AR`;
  }
}
