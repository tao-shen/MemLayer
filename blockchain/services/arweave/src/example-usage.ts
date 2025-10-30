/**
 * Example usage of Arweave services with error handling
 */

import {
  ArweaveClient,
  UploadManager,
  RetrievalService,
  ArweaveError,
  ArweaveErrorCode,
  withRetry,
} from './index';

/**
 * Example 1: Basic upload with error handling
 */
async function exampleBasicUpload() {
  const client = new ArweaveClient({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
    walletPath: './wallet.json',
  });

  await client.initialize();

  const uploadManager = new UploadManager(client);

  const data = Buffer.from('Hello, Arweave!');
  const tags = [
    { name: 'App-Name', value: 'MemoryPlatform' },
    { name: 'Content-Type', value: 'text/plain' },
  ];

  try {
    const result = await uploadManager.upload(data, tags);
    console.log('Upload successful:', result.txId);
  } catch (error) {
    if (error instanceof ArweaveError) {
      console.error('Arweave error:', error.code, error.message);
      
      if (error.code === ArweaveErrorCode.INSUFFICIENT_BALANCE) {
        console.log('Please add funds to your wallet');
      } else if (error.isRetryable()) {
        console.log('This error is retryable, consider using uploadWithRetry');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example 2: Upload with automatic retry
 */
async function exampleUploadWithRetry() {
  const client = new ArweaveClient({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
    walletPath: './wallet.json',
  });

  await client.initialize();

  const uploadManager = new UploadManager(client);

  const data = Buffer.from('Hello, Arweave with retry!');
  const tags = [
    { name: 'App-Name', value: 'MemoryPlatform' },
    { name: 'Content-Type', value: 'text/plain' },
  ];

  try {
    // Automatically retries up to 3 times with exponential backoff
    const result = await uploadManager.uploadWithRetry(data, tags, 3);
    console.log('Upload successful after retries:', result.txId);
  } catch (error) {
    if (error instanceof ArweaveError) {
      console.error('Upload failed after all retries:', error.code, error.message);
    }
  }
}

/**
 * Example 3: Batch upload with error handling
 */
async function exampleBatchUpload() {
  const client = new ArweaveClient({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
    walletPath: './wallet.json',
  });

  await client.initialize();

  const uploadManager = new UploadManager(client);

  // Listen to events
  uploadManager.on('batch:started', ({ count }) => {
    console.log(`Starting batch upload of ${count} items`);
  });

  uploadManager.on('batch:progress', ({ current, total, percentage }) => {
    console.log(`Progress: ${current}/${total} (${percentage.toFixed(1)}%)`);
  });

  uploadManager.on('batch:completed', ({ total, successful, failed }) => {
    console.log(`Batch completed: ${successful} successful, ${failed} failed out of ${total}`);
  });

  uploadManager.on('upload:failed', ({ taskId, error, code }) => {
    console.error(`Upload ${taskId} failed with code ${code}: ${error}`);
  });

  const items = [
    {
      data: Buffer.from('Memory 1'),
      tags: [{ name: 'Memory-ID', value: '1' }],
    },
    {
      data: Buffer.from('Memory 2'),
      tags: [{ name: 'Memory-ID', value: '2' }],
    },
    {
      data: Buffer.from('Memory 3'),
      tags: [{ name: 'Memory-ID', value: '3' }],
    },
  ];

  try {
    const result = await uploadManager.uploadBatch(items);
    console.log('Batch upload result:', {
      successful: result.successCount,
      failed: result.failureCount,
    });

    // Process successful uploads
    for (const upload of result.successful) {
      console.log('Uploaded:', upload.txId);
    }

    // Handle failed uploads
    for (const failure of result.failed) {
      console.error(`Item ${failure.index} failed:`, failure.error);
    }
  } catch (error) {
    console.error('Batch upload error:', error);
  }
}

/**
 * Example 4: Retrieval with caching and retry
 */
async function exampleRetrieval() {
  const client = new ArweaveClient({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
  });

  await client.initialize();

  const retrievalService = new RetrievalService(client);

  const txId = 'YOUR_TRANSACTION_ID';

  try {
    // First retrieval - from Arweave
    console.log('Retrieving from Arweave...');
    const data1 = await retrievalService.retrieveWithCache(txId);
    console.log('Retrieved:', data1.length, 'bytes');

    // Second retrieval - from cache
    console.log('Retrieving from cache...');
    const data2 = await retrievalService.retrieveWithCache(txId);
    console.log('Retrieved from cache:', data2.length, 'bytes');

    // Get cache stats
    const stats = retrievalService.getCacheStats();
    console.log('Cache stats:', stats);
  } catch (error) {
    if (error instanceof ArweaveError) {
      console.error('Retrieval error:', error.code, error.message);
      
      if (error.code === ArweaveErrorCode.DATA_NOT_FOUND) {
        console.log('Transaction not found or not yet confirmed');
      }
    }
  }
}

/**
 * Example 5: Custom retry logic with withRetry helper
 */
async function exampleCustomRetry() {
  const client = new ArweaveClient({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
  });

  await client.initialize();

  try {
    const networkInfo = await withRetry(
      () => client.getNetworkInfo(),
      {
        maxRetries: 5,
        initialDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 2,
        retryableErrors: [
          ArweaveErrorCode.NETWORK_ERROR,
          ArweaveErrorCode.TIMEOUT_ERROR,
          ArweaveErrorCode.GATEWAY_ERROR,
        ],
      },
      client.getErrorHandler(),
      'getNetworkInfo'
    );

    console.log('Network info:', networkInfo);
  } catch (error) {
    console.error('Failed to get network info after retries:', error);
  }
}

/**
 * Example 6: Error statistics and logging
 */
async function exampleErrorStats() {
  const client = new ArweaveClient({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
    walletPath: './wallet.json',
  });

  await client.initialize();

  const uploadManager = new UploadManager(client);

  // Perform multiple operations
  const items = Array.from({ length: 10 }, (_, i) => ({
    data: Buffer.from(`Memory ${i}`),
    tags: [{ name: 'Memory-ID', value: String(i) }],
  }));

  await uploadManager.uploadBatch(items);

  // Get error statistics
  const errorHandler = uploadManager.getErrorHandler();
  const stats = errorHandler.getErrorStats();

  console.log('Error statistics:');
  console.log('Total errors:', stats.total);
  console.log('Retryable errors:', stats.retryable);
  console.log('Non-retryable errors:', stats.nonRetryable);
  console.log('Errors by code:', stats.byCode);

  // Get error log
  const errorLog = errorHandler.getErrorLog();
  console.log('\nRecent errors:');
  for (const entry of errorLog.slice(-5)) {
    console.log(`[${entry.timestamp.toISOString()}] ${entry.code}: ${entry.message}`);
  }
}

/**
 * Example 7: Handling specific error types
 */
async function exampleSpecificErrorHandling() {
  const client = new ArweaveClient({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
    walletPath: './wallet.json',
  });

  try {
    await client.initialize();

    const uploadManager = new UploadManager(client);
    const data = Buffer.from('Test data');
    const tags = [{ name: 'Test', value: 'true' }];

    const result = await uploadManager.upload(data, tags);
    console.log('Upload successful:', result.txId);
  } catch (error) {
    if (error instanceof ArweaveError) {
      switch (error.code) {
        case ArweaveErrorCode.WALLET_NOT_LOADED:
          console.error('Please load a wallet first');
          break;

        case ArweaveErrorCode.INSUFFICIENT_BALANCE:
          console.error('Insufficient balance. Please add funds to your wallet');
          // Get current balance
          try {
            const balance = await client.getBalance();
            console.log('Current balance:', balance, 'AR');
          } catch (e) {
            console.error('Could not get balance');
          }
          break;

        case ArweaveErrorCode.NETWORK_ERROR:
          console.error('Network error. Please check your connection');
          break;

        case ArweaveErrorCode.TIMEOUT_ERROR:
          console.error('Request timeout. Please try again');
          break;

        case ArweaveErrorCode.UPLOAD_TOO_LARGE:
          console.error('Upload too large. Maximum size exceeded');
          break;

        case ArweaveErrorCode.RATE_LIMIT_EXCEEDED:
          console.error('Rate limit exceeded. Please wait before retrying');
          break;

        default:
          console.error('Unexpected error:', error.code, error.message);
      }
    } else {
      console.error('Non-Arweave error:', error);
    }
  }
}

// Export examples
export {
  exampleBasicUpload,
  exampleUploadWithRetry,
  exampleBatchUpload,
  exampleRetrieval,
  exampleCustomRetry,
  exampleErrorStats,
  exampleSpecificErrorHandling,
};
