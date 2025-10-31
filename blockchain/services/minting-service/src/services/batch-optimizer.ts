/**
 * Batch Optimizer
 * Optimizes batch processing based on network conditions and historical data
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

/**
 * Network metrics
 */
interface NetworkMetrics {
  rpcLatency: number;          // Average RPC latency in ms
  transactionSuccessRate: number; // Success rate (0-1)
  networkCongestion: number;   // Congestion level (0-1)
  averageConfirmationTime: number; // Average confirmation time in ms
  gasPrice: number;            // Current gas price
  timestamp: Date;
}

/**
 * Batch performance metrics
 */
interface BatchPerformance {
  batchSize: number;
  processingTime: number;
  successRate: number;
  costPerMemory: number;
  timestamp: Date;
}

/**
 * Optimization recommendations
 */
interface OptimizationRecommendation {
  optimalBatchSize: number;
  recommendedTimeout: number;
  shouldMerge: boolean;
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

/**
 * Batch Optimizer Configuration
 */
interface BatchOptimizerConfig {
  minBatchSize: number;
  maxBatchSize: number;
  minTimeout: number;
  maxTimeout: number;
  metricsWindowSize: number;
  optimizationInterval: number;
}

/**
 * Batch Optimizer Implementation
 */
export class BatchOptimizer extends EventEmitter {
  private networkMetrics: NetworkMetrics[] = [];
  private batchPerformance: BatchPerformance[] = [];
  private currentBatchSize: number;
  private currentTimeout: number;
  private optimizationTimer?: NodeJS.Timeout;

  constructor(
    private config: BatchOptimizerConfig,
    initialBatchSize: number,
    initialTimeout: number
  ) {
    super();
    this.currentBatchSize = initialBatchSize;
    this.currentTimeout = initialTimeout;

    logger.info('Batch Optimizer initialized', {
      initialBatchSize,
      initialTimeout,
      config,
    });

    // Start optimization loop
    this.startOptimizationLoop();
  }

  /**
   * Record network metrics
   */
  recordNetworkMetrics(metrics: Omit<NetworkMetrics, 'timestamp'>): void {
    const entry: NetworkMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.networkMetrics.push(entry);

    // Keep only recent metrics
    const cutoff = Date.now() - this.config.metricsWindowSize;
    this.networkMetrics = this.networkMetrics.filter(
      (m) => m.timestamp.getTime() > cutoff
    );

    logger.debug('Recorded network metrics', { metrics: entry });
  }

  /**
   * Record batch performance
   */
  recordBatchPerformance(performance: Omit<BatchPerformance, 'timestamp'>): void {
    const entry: BatchPerformance = {
      ...performance,
      timestamp: new Date(),
    };

    this.batchPerformance.push(entry);

    // Keep only recent performance data
    const cutoff = Date.now() - this.config.metricsWindowSize;
    this.batchPerformance = this.batchPerformance.filter(
      (p) => p.timestamp.getTime() > cutoff
    );

    logger.debug('Recorded batch performance', { performance: entry });
  }

  /**
   * Get optimization recommendation
   */
  getOptimizationRecommendation(): OptimizationRecommendation {
    const networkCondition = this.analyzeNetworkCondition();
    const performanceTrend = this.analyzePerformanceTrend();

    // Calculate optimal batch size
    const optimalBatchSize = this.calculateOptimalBatchSize(
      networkCondition,
      performanceTrend
    );

    // Calculate recommended timeout
    const recommendedTimeout = this.calculateOptimalTimeout(
      networkCondition,
      optimalBatchSize
    );

    // Determine if batches should be merged
    const shouldMerge = this.shouldMergeBatches(networkCondition);

    // Determine priority
    const priority = this.determinePriority(networkCondition);

    const reason = this.generateRecommendationReason(
      networkCondition,
      performanceTrend,
      optimalBatchSize
    );

    return {
      optimalBatchSize,
      recommendedTimeout,
      shouldMerge,
      priority,
      reason,
    };
  }

  /**
   * Apply optimization
   */
  applyOptimization(recommendation: OptimizationRecommendation): void {
    const previousBatchSize = this.currentBatchSize;
    const previousTimeout = this.currentTimeout;

    this.currentBatchSize = recommendation.optimalBatchSize;
    this.currentTimeout = recommendation.recommendedTimeout;

    logger.info('Applied batch optimization', {
      previousBatchSize,
      newBatchSize: this.currentBatchSize,
      previousTimeout,
      newTimeout: this.currentTimeout,
      reason: recommendation.reason,
    });

    this.emit('optimization:applied', {
      previousBatchSize,
      newBatchSize: this.currentBatchSize,
      previousTimeout,
      newTimeout: this.currentTimeout,
      recommendation,
    });
  }

  /**
   * Get current batch size
   */
  getCurrentBatchSize(): number {
    return this.currentBatchSize;
  }

  /**
   * Get current timeout
   */
  getCurrentTimeout(): number {
    return this.currentTimeout;
  }

  /**
   * Get optimizer statistics
   */
  getStatistics(): {
    currentBatchSize: number;
    currentTimeout: number;
    avgNetworkLatency: number;
    avgSuccessRate: number;
    avgBatchProcessingTime: number;
    metricsCount: number;
  } {
    const avgNetworkLatency =
      this.networkMetrics.length > 0
        ? this.networkMetrics.reduce((sum, m) => sum + m.rpcLatency, 0) /
          this.networkMetrics.length
        : 0;

    const avgSuccessRate =
      this.networkMetrics.length > 0
        ? this.networkMetrics.reduce((sum, m) => sum + m.transactionSuccessRate, 0) /
          this.networkMetrics.length
        : 1;

    const avgBatchProcessingTime =
      this.batchPerformance.length > 0
        ? this.batchPerformance.reduce((sum, p) => sum + p.processingTime, 0) /
          this.batchPerformance.length
        : 0;

    return {
      currentBatchSize: this.currentBatchSize,
      currentTimeout: this.currentTimeout,
      avgNetworkLatency,
      avgSuccessRate,
      avgBatchProcessingTime,
      metricsCount: this.networkMetrics.length,
    };
  }

  /**
   * Analyze network condition
   */
  private analyzeNetworkCondition(): {
    latency: 'low' | 'medium' | 'high';
    congestion: 'low' | 'medium' | 'high';
    reliability: 'low' | 'medium' | 'high';
  } {
    if (this.networkMetrics.length === 0) {
      return {
        latency: 'medium',
        congestion: 'medium',
        reliability: 'high',
      };
    }

    const avgLatency =
      this.networkMetrics.reduce((sum, m) => sum + m.rpcLatency, 0) /
      this.networkMetrics.length;

    const avgCongestion =
      this.networkMetrics.reduce((sum, m) => sum + m.networkCongestion, 0) /
      this.networkMetrics.length;

    const avgSuccessRate =
      this.networkMetrics.reduce((sum, m) => sum + m.transactionSuccessRate, 0) /
      this.networkMetrics.length;

    return {
      latency: avgLatency < 100 ? 'low' : avgLatency < 300 ? 'medium' : 'high',
      congestion: avgCongestion < 0.3 ? 'low' : avgCongestion < 0.7 ? 'medium' : 'high',
      reliability: avgSuccessRate > 0.95 ? 'high' : avgSuccessRate > 0.85 ? 'medium' : 'low',
    };
  }

  /**
   * Analyze performance trend
   */
  private analyzePerformanceTrend(): {
    trend: 'improving' | 'stable' | 'degrading';
    avgCostPerMemory: number;
  } {
    if (this.batchPerformance.length < 2) {
      return {
        trend: 'stable',
        avgCostPerMemory: 0,
      };
    }

    const recentPerformance = this.batchPerformance.slice(-5);
    const avgCostPerMemory =
      recentPerformance.reduce((sum, p) => sum + p.costPerMemory, 0) /
      recentPerformance.length;

    // Compare recent vs older performance
    const midPoint = Math.floor(recentPerformance.length / 2);
    const olderAvg =
      recentPerformance
        .slice(0, midPoint)
        .reduce((sum, p) => sum + p.successRate, 0) / midPoint;
    const recentAvg =
      recentPerformance
        .slice(midPoint)
        .reduce((sum, p) => sum + p.successRate, 0) /
      (recentPerformance.length - midPoint);

    const trend =
      recentAvg > olderAvg + 0.05
        ? 'improving'
        : recentAvg < olderAvg - 0.05
        ? 'degrading'
        : 'stable';

    return {
      trend,
      avgCostPerMemory,
    };
  }

  /**
   * Calculate optimal batch size
   */
  private calculateOptimalBatchSize(
    networkCondition: ReturnType<typeof this.analyzeNetworkCondition>,
    performanceTrend: ReturnType<typeof this.analyzePerformanceTrend>
  ): number {
    let optimalSize = this.currentBatchSize;

    // Adjust based on network latency
    if (networkCondition.latency === 'low') {
      optimalSize = Math.min(optimalSize + 10, this.config.maxBatchSize);
    } else if (networkCondition.latency === 'high') {
      optimalSize = Math.max(optimalSize - 10, this.config.minBatchSize);
    }

    // Adjust based on congestion
    if (networkCondition.congestion === 'high') {
      optimalSize = Math.max(optimalSize - 5, this.config.minBatchSize);
    } else if (networkCondition.congestion === 'low') {
      optimalSize = Math.min(optimalSize + 5, this.config.maxBatchSize);
    }

    // Adjust based on reliability
    if (networkCondition.reliability === 'low') {
      optimalSize = Math.max(optimalSize - 15, this.config.minBatchSize);
    }

    // Adjust based on performance trend
    if (performanceTrend.trend === 'degrading') {
      optimalSize = Math.max(optimalSize - 5, this.config.minBatchSize);
    } else if (performanceTrend.trend === 'improving') {
      optimalSize = Math.min(optimalSize + 5, this.config.maxBatchSize);
    }

    // Ensure within bounds
    return Math.max(
      this.config.minBatchSize,
      Math.min(optimalSize, this.config.maxBatchSize)
    );
  }

  /**
   * Calculate optimal timeout
   */
  private calculateOptimalTimeout(
    networkCondition: ReturnType<typeof this.analyzeNetworkCondition>,
    batchSize: number
  ): number {
    let timeout = this.currentTimeout;

    // Adjust based on network conditions
    if (networkCondition.latency === 'high' || networkCondition.congestion === 'high') {
      timeout = Math.min(timeout * 1.5, this.config.maxTimeout);
    } else if (networkCondition.latency === 'low' && networkCondition.congestion === 'low') {
      timeout = Math.max(timeout * 0.8, this.config.minTimeout);
    }

    // Adjust based on batch size (larger batches can wait longer)
    const sizeRatio = batchSize / this.config.maxBatchSize;
    timeout = timeout * (0.5 + sizeRatio * 0.5);

    // Ensure within bounds
    return Math.max(
      this.config.minTimeout,
      Math.min(Math.round(timeout), this.config.maxTimeout)
    );
  }

  /**
   * Determine if batches should be merged
   */
  private shouldMergeBatches(
    networkCondition: ReturnType<typeof this.analyzeNetworkCondition>
  ): boolean {
    // Merge batches when network is good to maximize efficiency
    return (
      networkCondition.latency === 'low' &&
      networkCondition.congestion === 'low' &&
      networkCondition.reliability === 'high'
    );
  }

  /**
   * Determine priority level
   */
  private determinePriority(
    networkCondition: ReturnType<typeof this.analyzeNetworkCondition>
  ): 'low' | 'medium' | 'high' {
    if (networkCondition.reliability === 'low' || networkCondition.congestion === 'high') {
      return 'high';
    } else if (networkCondition.latency === 'high') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate recommendation reason
   */
  private generateRecommendationReason(
    networkCondition: ReturnType<typeof this.analyzeNetworkCondition>,
    performanceTrend: ReturnType<typeof this.analyzePerformanceTrend>,
    optimalSize: number
  ): string {
    const reasons: string[] = [];

    if (networkCondition.latency === 'high') {
      reasons.push('high network latency');
    }
    if (networkCondition.congestion === 'high') {
      reasons.push('high network congestion');
    }
    if (networkCondition.reliability === 'low') {
      reasons.push('low transaction success rate');
    }
    if (performanceTrend.trend === 'degrading') {
      reasons.push('degrading performance trend');
    }

    if (reasons.length === 0) {
      return `Optimal conditions: batch size ${optimalSize}`;
    }

    return `Adjusted for ${reasons.join(', ')}`;
  }

  /**
   * Start optimization loop
   */
  private startOptimizationLoop(): void {
    this.optimizationTimer = setInterval(() => {
      try {
        const recommendation = this.getOptimizationRecommendation();
        
        // Only apply if there's a significant change
        const sizeChange = Math.abs(recommendation.optimalBatchSize - this.currentBatchSize);
        const timeoutChange = Math.abs(recommendation.recommendedTimeout - this.currentTimeout);

        if (sizeChange >= 5 || timeoutChange >= 1000) {
          this.applyOptimization(recommendation);
        }
      } catch (error) {
        logger.error('Error in optimization loop', { error: error.message });
      }
    }, this.config.optimizationInterval);

    logger.info('Started optimization loop', {
      interval: this.config.optimizationInterval,
    });
  }

  /**
   * Shutdown optimizer
   */
  shutdown(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }

    logger.info('Batch Optimizer shutdown complete');
  }
}
