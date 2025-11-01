/**
 * Batch Manager Usage Examples
 */

import { BatchManager } from '../batch-manager';
import { ServiceConfig, MintRequest } from '../../types';
import { config } from '../../config';

/**
 * Example 1: Basic batch usage
 */
async function exampleBasicBatch() {
  const batchManager = new BatchManager(config);

  // Listen to events
  batchManager.on('item:added', ({ requestId, batchId, batchSize }) => {
    console.log(`Item ${requestId} added to batch ${batchId}, size: ${batchSize}`);
  });

  batchManager.on('batch:created', ({ batchId, walletAddress }) => {
    console.log(`New batch created: ${batchId} for wallet ${walletAddress}`);
  });

  batchManager.on('batch:ready', ({ batchId, items }) => {
    console.log(`Batch ${batchId} ready for processing with ${items.length} items`);
  });

  batchManager.on('batch:completed', ({ batchId, itemCount, duration }) => {
    console.log(`Batch ${batchId} completed: ${itemCount} items in ${duration}ms`);
  });

  // Add items to batch
  const request: MintRequest = {
    walletAddress: 'YourWalletAddressHere',
    signature: 'signature',
    memory: {
      content: 'This is a memory content',
      metadata: {
        type: 'episodic',
        tags: ['example', 'test'],
        importance: 0.8,
      },
      agentId: 'agent-123',
      timestamp: new Date(),
    },
    options: {
      priority: 'medium',
      batch: true,
    },
  };

  try {
    const requestId = await batchManager.addToBatch(request);
    console.log('Request added:', requestId);

    // Get batch stats
    const stats = batchManager.getBatchStats();
    console.log('Batch stats:', stats);
  } catch (error: any) {
    console.error('Error:', error);
  }

  // Shutdown
  await batchManager.shutdown();
}

/**
 * Example 2: Multiple items triggering batch
 */
async function exampleMultipleItems() {
  const batchManager = new BatchManager(config);

  batchManager.on('batch:processing', ({ batchId, itemCount }) => {
    console.log(`Processing batch ${batchId} with ${itemCount} items`);
  });

  // Add multiple items
  const walletAddress = 'YourWalletAddressHere';
  const requestIds: string[] = [];

  for (let i = 0; i < 10; i++) {
    const request: MintRequest = {
      walletAddress,
      signature: 'signature',
      memory: {
        content: `Memory content ${i}`,
        metadata: {
          type: 'episodic',
          tags: [`item-${i}`],
        },
        agentId: 'agent-123',
        timestamp: new Date(),
      },
    };

    const requestId = await batchManager.addToBatch(request);
    requestIds.push(requestId);
    console.log(`Added item ${i + 1}/10: ${requestId}`);
  }

  console.log('All items added:', requestIds.length);

  // Wait a bit for processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Get final stats
  const stats = batchManager.getBatchStats();
  console.log('Final stats:', stats);

  await batchManager.shutdown();
}

/**
 * Example 3: Batch timeout trigger
 */
async function exampleBatchTimeout() {
  const batchManager = new BatchManager(config);

  batchManager.on('batch:ready', ({ batchId, items }) => {
    console.log(`Batch ${batchId} triggered by timeout with ${items.length} items`);
  });

  // Add just a few items (less than max batch size)
  const request: MintRequest = {
    walletAddress: 'YourWalletAddressHere',
    signature: 'signature',
    memory: {
      content: 'Memory content',
      metadata: {
        type: 'episodic',
      },
      agentId: 'agent-123',
      timestamp: new Date(),
    },
  };

  await batchManager.addToBatch(request);
  await batchManager.addToBatch(request);
  await batchManager.addToBatch(request);

  console.log('Added 3 items, waiting for timeout...');

  // Wait for batch timeout (configured in config.batch.timeoutMs)
  await new Promise((resolve) => setTimeout(resolve, config.batch.timeoutMs + 1000));

  await batchManager.shutdown();
}

/**
 * Example 4: Manual batch processing
 */
async function exampleManualProcessing() {
  const batchManager = new BatchManager(config);

  // Add items
  const request: MintRequest = {
    walletAddress: 'YourWalletAddressHere',
    signature: 'signature',
    memory: {
      content: 'Memory content',
      metadata: {
        type: 'episodic',
      },
      agentId: 'agent-123',
      timestamp: new Date(),
    },
  };

  await batchManager.addToBatch(request);
  await batchManager.addToBatch(request);

  console.log('Items added, manually triggering batch processing...');

  // Manually trigger processing
  await batchManager.processBatches();

  console.log('Manual processing complete');

  await batchManager.shutdown();
}

/**
 * Example 5: Batch cancellation
 */
async function exampleBatchCancellation() {
  const batchManager = new BatchManager(config);

  let batchId: string | null = null;

  batchManager.once('batch:created', ({ batchId: id }) => {
    batchId = id;
  });

  // Add item
  const request: MintRequest = {
    walletAddress: 'YourWalletAddressHere',
    signature: 'signature',
    memory: {
      content: 'Memory content',
      metadata: {
        type: 'episodic',
      },
      agentId: 'agent-123',
      timestamp: new Date(),
    },
  };

  await batchManager.addToBatch(request);

  // Wait a bit for batch creation
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (batchId) {
    console.log(`Cancelling batch ${batchId}...`);
    const cancelled = await batchManager.cancelBatch(batchId);
    console.log('Batch cancelled:', cancelled);
  }

  await batchManager.shutdown();
}

/**
 * Example 6: Monitoring batch statistics
 */
async function exampleBatchMonitoring() {
  const batchManager = new BatchManager(config);

  // Start monitoring
  const monitorInterval = setInterval(() => {
    const stats = batchManager.getBatchStats();
    console.log('Batch Statistics:', {
      pending: stats.pending,
      processing: stats.processing,
      completed: stats.completed,
      totalItems: stats.totalItems,
    });
  }, 1000);

  // Add items over time
  const request: MintRequest = {
    walletAddress: 'YourWalletAddressHere',
    signature: 'signature',
    memory: {
      content: 'Memory content',
      metadata: {
        type: 'episodic',
      },
      agentId: 'agent-123',
      timestamp: new Date(),
    },
  };

  for (let i = 0; i < 20; i++) {
    await batchManager.addToBatch(request);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Stop monitoring
  clearInterval(monitorInterval);

  await batchManager.shutdown();
}

/**
 * Example 7: Error handling
 */
async function exampleErrorHandling() {
  const batchManager = new BatchManager(config);

  batchManager.on('batch:failed', ({ batchId, itemCount, error }) => {
    console.error(`Batch ${batchId} failed with ${itemCount} items:`, error);
  });

  try {
    // Try to add invalid request
    const invalidRequest = {
      walletAddress: '',
      signature: 'signature',
      memory: {
        content: 'Memory content',
        metadata: {
          type: 'episodic',
        },
        agentId: 'agent-123',
        timestamp: new Date(),
      },
    } as MintRequest;

    await batchManager.addToBatch(invalidRequest);
  } catch (error: any) {
    console.error('Error adding to batch:', error.message);
  }

  await batchManager.shutdown();
}

// Export examples
export {
  exampleBasicBatch,
  exampleMultipleItems,
  exampleBatchTimeout,
  exampleManualProcessing,
  exampleBatchCancellation,
  exampleBatchMonitoring,
  exampleErrorHandling,
};

// Run example if executed directly
if (require.main === module) {
  console.log('Running Batch Manager Examples...\n');

  (async () => {
    console.log('=== Example 1: Basic Batch ===');
    await exampleBasicBatch();

    console.log('\n=== Example 2: Multiple Items ===');
    await exampleMultipleItems();

    console.log('\n=== Example 3: Batch Timeout ===');
    await exampleBatchTimeout();

    console.log('\nAll examples completed!');
  })().catch(console.error);
}
