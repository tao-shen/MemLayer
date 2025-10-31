# Batch Processing Optimization

This document describes the batch processing optimization features implemented in the Memory Minting Service.

## Overview

The batch processing optimization system dynamically adjusts batch sizes and timeouts based on real-time network conditions and historical performance data to maximize efficiency and minimize costs.

## Components

### 1. Batch Optimizer

The `BatchOptimizer` continuously monitors network conditions and adjusts batch processing parameters.

**Features:**
- Dynamic batch size adjustment (50-150% of base size)
- Adaptive timeout configuration
- Network condition analysis
- Performance trend tracking
- Automatic optimization every minute

**Metrics Tracked:**
- RPC latency
- Transaction success rate
- Network congestion
- Average confirmation time
- Gas prices

**Optimization Strategy:**
- **Low latency + Low congestion** → Increase batch size, decrease timeout
- **High latency + High congestion** → Decrease batch size, increase timeout
- **Low reliability** → Significantly reduce batch size
- **Degrading performance** → Conservative adjustments

### 2. Batch Merger

The `BatchMerger` intelligently combines multiple small batches into larger ones to reduce transaction costs.

**Features:**
- Automatic merge opportunity detection
- Cost savings calculation
- Wallet-based batch grouping
- Time-window based merging
- Merge history tracking

**Merge Criteria:**
- Minimum 2 batches required
- Same wallet address
- Within merge time window
- Combined size within limits
- Estimated savings above threshold

**Benefits:**
- Reduced transaction fees
- Better resource utilization
- Improved throughput

### 3. Optimized Batch Manager

The `OptimizedBatchManager` integrates optimization and merging with the base batch manager.

**Features:**
- Seamless integration with existing batch processing
- Real-time metrics collection
- Automatic optimization application
- Auto-merge execution for high-savings opportunities
- Comprehensive statistics

## Configuration

```typescript
const config = {
  // Base batch configuration
  batch: {
    size: 50,              // Base batch size
    timeoutMs: 5000,       // Base timeout
    maxConcurrent: 3,      // Max concurrent batches
  },
  
  // Optimization settings
  enableOptimization: true,
  optimizationInterval: 60000,    // 1 minute
  metricsWindowSize: 300000,      // 5 minutes
  
  // Merging settings
  enableMerging: true,
};
```

## Usage

### Basic Usage

```typescript
import { OptimizedBatchManager } from './services/optimized-batch-manager';

// Initialize
const batchManager = new OptimizedBatchManager(config);

// Add memories to batch
const requestId = await batchManager.addToBatch({
  walletAddress: 'wallet-address',
  memory: {
    content: 'Memory content',
    metadata: {},
    agentId: 'agent-123',
  },
  options: {
    priority: 'medium',
  },
});

// Get statistics
const stats = batchManager.getStatistics();
console.log('Batch stats:', stats.batch);
console.log('Optimizer stats:', stats.optimizer);
console.log('Merger stats:', stats.merger);
```

### Monitoring Optimization

```typescript
// Listen to optimization events
batchManager.on('optimization:applied', (data) => {
  console.log('Optimization applied:', {
    previousBatchSize: data.previousBatchSize,
    newBatchSize: data.newBatchSize,
    previousTimeout: data.previousTimeout,
    newTimeout: data.newTimeout,
    reason: data.recommendation.reason,
  });
});

// Get current settings
const settings = batchManager.getCurrentSettings();
console.log('Current batch size:', settings.batchSize);
console.log('Current timeout:', settings.timeout);
```

### Monitoring Merges

```typescript
// Listen to merge events
batchManager.on('merge:opportunity', (mergeResult) => {
  console.log('Merge opportunity:', {
    sourceBatches: mergeResult.sourceBatchIds.length,
    totalItems: mergeResult.totalItems,
    estimatedSavings: mergeResult.estimatedSavings,
  });
});

batchManager.on('merge:executed', (mergeResult) => {
  console.log('Merge executed:', {
    mergedBatchId: mergeResult.mergedBatchId,
    savings: mergeResult.estimatedSavings,
  });
});

// Force merge evaluation
batchManager.forceMergeEvaluation();
```

### Manual Optimization

```typescript
// Force optimization evaluation and application
batchManager.forceOptimization();
```

## Performance Metrics

### Batch Optimizer Metrics

```typescript
const optimizerStats = batchManager.getStatistics().optimizer;

console.log({
  currentBatchSize: optimizerStats.currentBatchSize,
  currentTimeout: optimizerStats.currentTimeout,
  avgNetworkLatency: optimizerStats.avgNetworkLatency,
  avgSuccessRate: optimizerStats.avgSuccessRate,
  avgBatchProcessingTime: optimizerStats.avgBatchProcessingTime,
  metricsCount: optimizerStats.metricsCount,
});
```

### Batch Merger Metrics

```typescript
const mergerStats = batchManager.getStatistics().merger;

console.log({
  totalMerges: mergerStats.totalMerges,
  totalSavings: mergerStats.totalSavings,
  avgBatchesPerMerge: mergerStats.avgBatchesPerMerge,
  avgItemsPerMerge: mergerStats.avgItemsPerMerge,
});
```

## Optimization Scenarios

### Scenario 1: High Network Congestion

**Conditions:**
- High RPC latency (>300ms)
- High network congestion (>70%)
- Low success rate (<85%)

**Actions:**
- Reduce batch size by 30%
- Increase timeout by 50%
- Disable batch merging
- Set priority to HIGH

**Result:**
- Improved transaction success rate
- Reduced failed transactions
- Better reliability

### Scenario 2: Optimal Network Conditions

**Conditions:**
- Low RPC latency (<100ms)
- Low network congestion (<30%)
- High success rate (>95%)

**Actions:**
- Increase batch size by 20%
- Decrease timeout by 20%
- Enable aggressive batch merging
- Set priority to LOW

**Result:**
- Maximized throughput
- Reduced costs per memory
- Improved efficiency

### Scenario 3: Degrading Performance

**Conditions:**
- Performance trend: degrading
- Success rate declining
- Processing time increasing

**Actions:**
- Conservative batch size reduction
- Gradual timeout increase
- Disable merging temporarily
- Monitor closely

**Result:**
- Stabilized performance
- Prevented cascading failures
- Maintained service quality

## Cost Savings

### Batch Merging Savings

Example: Merging 5 small batches (10 items each) into 1 large batch (50 items)

**Without Merging:**
- 5 transactions × 5,000 lamports = 25,000 lamports
- Plus 5× priority fees

**With Merging:**
- 1 transaction × 5,000 lamports = 5,000 lamports
- Plus 1× priority fee

**Savings:**
- 20,000 lamports (80% reduction)
- 4× fewer priority fees

### Dynamic Sizing Savings

Example: Adjusting batch size based on network conditions

**Fixed Size (50 items):**
- High congestion: 30% failure rate
- Cost: 50 items × 5,000 lamports + 15 retries × 5,000 lamports = 325,000 lamports

**Dynamic Size (30 items during congestion):**
- High congestion: 5% failure rate
- Cost: 30 items × 5,000 lamports + 2 retries × 5,000 lamports = 160,000 lamports

**Savings:**
- 165,000 lamports (51% reduction)
- Better success rate

## Best Practices

1. **Enable Both Optimization and Merging**
   - Maximum efficiency gains
   - Complementary benefits

2. **Monitor Metrics Regularly**
   - Track optimization effectiveness
   - Identify patterns
   - Adjust thresholds if needed

3. **Set Appropriate Thresholds**
   - Cost savings threshold: 1,000-5,000 lamports
   - Merge window: 2× batch timeout
   - Min batch size for merge: 30% of max

4. **Handle Edge Cases**
   - Very small batches (< 5 items)
   - Very large batches (> 100 items)
   - Network outages

5. **Test in Devnet First**
   - Validate optimization logic
   - Tune parameters
   - Monitor behavior

## Troubleshooting

### Issue: Batch sizes too small

**Symptoms:**
- Frequent small batches
- High transaction costs
- Low throughput

**Solutions:**
- Increase min batch size
- Increase batch timeout
- Enable merging
- Check network conditions

### Issue: Batch sizes too large

**Symptoms:**
- High failure rate
- Long processing times
- Timeouts

**Solutions:**
- Decrease max batch size
- Check network congestion
- Review optimization thresholds
- Monitor RPC performance

### Issue: Merging not occurring

**Symptoms:**
- Many small batches
- No merge events
- High costs

**Solutions:**
- Check merge window setting
- Verify cost savings threshold
- Ensure same wallet batches
- Review merge criteria

### Issue: Excessive optimization changes

**Symptoms:**
- Frequent batch size changes
- Unstable performance
- Erratic behavior

**Solutions:**
- Increase optimization interval
- Widen threshold ranges
- Smooth metrics with longer window
- Add change dampening

## Future Enhancements

1. **Machine Learning Integration**
   - Predictive optimization
   - Pattern recognition
   - Anomaly detection

2. **Multi-Wallet Merging**
   - Cross-wallet batch merging
   - Shared cost optimization
   - Coordinated processing

3. **Advanced Scheduling**
   - Time-based optimization
   - Peak/off-peak handling
   - Scheduled batch processing

4. **Cost Prediction**
   - Real-time cost forecasting
   - Budget management
   - Cost alerts

5. **A/B Testing**
   - Strategy comparison
   - Performance benchmarking
   - Optimization validation

## References

- [Batch Manager](./src/services/batch-manager.ts)
- [Batch Optimizer](./src/services/batch-optimizer.ts)
- [Batch Merger](./src/services/batch-merger.ts)
- [Optimized Batch Manager](./src/services/optimized-batch-manager.ts)
