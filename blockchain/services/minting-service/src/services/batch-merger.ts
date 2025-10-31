/**
 * Batch Merger
 * Intelligently merges multiple small batches into larger ones for efficiency
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

/**
 * Batch candidate for merging
 */
interface BatchCandidate {
  batchId: string;
  itemCount: number;
  totalSize: number;
  walletAddress: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Merge result
 */
interface MergeResult {
  mergedBatchId: string;
  sourceBatchIds: string[];
  totalItems: number;
  totalSize: number;
  estimatedSavings: number;
}

/**
 * Merger configuration
 */
interface BatchMergerConfig {
  minBatchSizeForMerge: number;
  maxMergedBatchSize: number;
  mergeWindowMs: number;
  costSavingsThreshold: number;
}

/**
 * Batch Merger Implementation
 */
export class BatchMerger extends EventEmitter {
  private mergeCandidates: Map<string, BatchCandidate> = new Map();
  private mergeHistory: MergeResult[] = [];

  constructor(private config: BatchMergerConfig) {
    super();

    logger.info('Batch Merger initialized', { config });
  }

  /**
   * Add batch as merge candidate
   */
  addCandidate(candidate: BatchCandidate): void {
    this.mergeCandidates.set(candidate.batchId, candidate);

    logger.debug('Added merge candidate', {
      batchId: candidate.batchId,
      itemCount: candidate.itemCount,
      priority: candidate.priority,
    });

    // Check if merge is possible
    this.evaluateMergeOpportunities();
  }

  /**
   * Remove candidate
   */
  removeCandidate(batchId: string): void {
    this.mergeCandidates.delete(batchId);
  }

  /**
   * Evaluate merge opportunities
   */
  evaluateMergeOpportunities(): MergeResult[] {
    const results: MergeResult[] = [];

    // Group candidates by wallet address
    const candidatesByWallet = this.groupCandidatesByWallet();

    for (const [walletAddress, candidates] of candidatesByWallet.entries()) {
      // Skip if not enough candidates
      if (candidates.length < 2) {
        continue;
      }

      // Find mergeable groups
      const mergeGroups = this.findMergeableGroups(candidates);

      for (const group of mergeGroups) {
        const mergeResult = this.evaluateMerge(group);

        if (mergeResult && this.shouldMerge(mergeResult)) {
          results.push(mergeResult);

          logger.info('Merge opportunity identified', {
            walletAddress,
            sourceBatches: mergeResult.sourceBatchIds.length,
            totalItems: mergeResult.totalItems,
            estimatedSavings: mergeResult.estimatedSavings,
          });

          this.emit('merge:opportunity', mergeResult);
        }
      }
    }

    return results;
  }

  /**
   * Execute merge
   */
  async executeMerge(sourceBatchIds: string[]): Promise<MergeResult> {
    const candidates = sourceBatchIds
      .map((id) => this.mergeCandidates.get(id))
      .filter((c): c is BatchCandidate => c !== undefined);

    if (candidates.length < 2) {
      throw new Error('Need at least 2 batches to merge');
    }

    // Validate all batches are from same wallet
    const walletAddress = candidates[0].walletAddress;
    if (!candidates.every((c) => c.walletAddress === walletAddress)) {
      throw new Error('Cannot merge batches from different wallets');
    }

    const totalItems = candidates.reduce((sum, c) => sum + c.itemCount, 0);
    const totalSize = candidates.reduce((sum, c) => sum + c.totalSize, 0);

    // Validate merged size
    if (totalItems > this.config.maxMergedBatchSize) {
      throw new Error(
        `Merged batch would exceed max size: ${totalItems} > ${this.config.maxMergedBatchSize}`
      );
    }

    // Calculate savings
    const estimatedSavings = this.calculateSavings(candidates);

    const mergeResult: MergeResult = {
      mergedBatchId: `merged-${Date.now()}`,
      sourceBatchIds,
      totalItems,
      totalSize,
      estimatedSavings,
    };

    // Remove merged candidates
    for (const batchId of sourceBatchIds) {
      this.mergeCandidates.delete(batchId);
    }

    // Record merge
    this.mergeHistory.push(mergeResult);

    logger.info('Executed batch merge', {
      mergedBatchId: mergeResult.mergedBatchId,
      sourceBatches: sourceBatchIds.length,
      totalItems,
      estimatedSavings,
    });

    this.emit('merge:executed', mergeResult);

    return mergeResult;
  }

  /**
   * Get merge statistics
   */
  getMergeStatistics(): {
    totalMerges: number;
    totalSavings: number;
    avgBatchesPerMerge: number;
    avgItemsPerMerge: number;
  } {
    if (this.mergeHistory.length === 0) {
      return {
        totalMerges: 0,
        totalSavings: 0,
        avgBatchesPerMerge: 0,
        avgItemsPerMerge: 0,
      };
    }

    const totalSavings = this.mergeHistory.reduce(
      (sum, m) => sum + m.estimatedSavings,
      0
    );

    const avgBatchesPerMerge =
      this.mergeHistory.reduce((sum, m) => sum + m.sourceBatchIds.length, 0) /
      this.mergeHistory.length;

    const avgItemsPerMerge =
      this.mergeHistory.reduce((sum, m) => sum + m.totalItems, 0) /
      this.mergeHistory.length;

    return {
      totalMerges: this.mergeHistory.length,
      totalSavings,
      avgBatchesPerMerge,
      avgItemsPerMerge,
    };
  }

  /**
   * Group candidates by wallet
   */
  private groupCandidatesByWallet(): Map<string, BatchCandidate[]> {
    const groups = new Map<string, BatchCandidate[]>();

    for (const candidate of this.mergeCandidates.values()) {
      const existing = groups.get(candidate.walletAddress) || [];
      existing.push(candidate);
      groups.set(candidate.walletAddress, existing);
    }

    return groups;
  }

  /**
   * Find mergeable groups
   */
  private findMergeableGroups(candidates: BatchCandidate[]): BatchCandidate[][] {
    const groups: BatchCandidate[][] = [];

    // Sort by creation time
    const sorted = [...candidates].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    let currentGroup: BatchCandidate[] = [];
    let currentSize = 0;

    for (const candidate of sorted) {
      // Check if candidate is too old
      const age = Date.now() - candidate.createdAt.getTime();
      if (age > this.config.mergeWindowMs) {
        continue;
      }

      // Check if candidate is too small
      if (candidate.itemCount < this.config.minBatchSizeForMerge) {
        // Try to add to current group
        if (currentSize + candidate.itemCount <= this.config.maxMergedBatchSize) {
          currentGroup.push(candidate);
          currentSize += candidate.itemCount;
        } else {
          // Start new group
          if (currentGroup.length >= 2) {
            groups.push(currentGroup);
          }
          currentGroup = [candidate];
          currentSize = candidate.itemCount;
        }
      } else {
        // Candidate is large enough, finalize current group
        if (currentGroup.length >= 2) {
          groups.push(currentGroup);
        }
        currentGroup = [];
        currentSize = 0;
      }
    }

    // Add final group
    if (currentGroup.length >= 2) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Evaluate merge
   */
  private evaluateMerge(candidates: BatchCandidate[]): MergeResult | null {
    if (candidates.length < 2) {
      return null;
    }

    const totalItems = candidates.reduce((sum, c) => sum + c.itemCount, 0);
    const totalSize = candidates.reduce((sum, c) => sum + c.totalSize, 0);

    // Check if within limits
    if (totalItems > this.config.maxMergedBatchSize) {
      return null;
    }

    const estimatedSavings = this.calculateSavings(candidates);

    return {
      mergedBatchId: `merge-eval-${Date.now()}`,
      sourceBatchIds: candidates.map((c) => c.batchId),
      totalItems,
      totalSize,
      estimatedSavings,
    };
  }

  /**
   * Calculate savings from merge
   */
  private calculateSavings(candidates: BatchCandidate[]): number {
    // Base transaction cost per batch
    const baseCostPerBatch = 5000; // lamports

    // Cost without merge
    const costWithoutMerge = candidates.length * baseCostPerBatch;

    // Cost with merge (single batch)
    const costWithMerge = baseCostPerBatch;

    // Savings
    const savings = costWithoutMerge - costWithMerge;

    return savings;
  }

  /**
   * Determine if merge should proceed
   */
  private shouldMerge(mergeResult: MergeResult): boolean {
    // Check if savings meet threshold
    if (mergeResult.estimatedSavings < this.config.costSavingsThreshold) {
      return false;
    }

    // Check if merge is beneficial
    const avgItemsPerBatch = mergeResult.totalItems / mergeResult.sourceBatchIds.length;
    if (avgItemsPerBatch > this.config.minBatchSizeForMerge) {
      // Batches are already reasonably sized
      return false;
    }

    return true;
  }

  /**
   * Clear old merge history
   */
  clearOldHistory(olderThan: Date): void {
    const initialLength = this.mergeHistory.length;

    this.mergeHistory = this.mergeHistory.filter(
      (m) => new Date(m.mergedBatchId.split('-')[1]) > olderThan
    );

    const cleared = initialLength - this.mergeHistory.length;

    if (cleared > 0) {
      logger.info('Cleared old merge history', { count: cleared });
    }
  }

  /**
   * Shutdown merger
   */
  shutdown(): void {
    this.mergeCandidates.clear();
    logger.info('Batch Merger shutdown complete');
  }
}
