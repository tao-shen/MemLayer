# Arweave Services

Comprehensive Arweave integration services with robust error handling, retry logic, and caching.

## Features

- **ArweaveClient**: Core client for interacting with Arweave network
- **UploadManager**: Handles file uploads with progress tracking and batch support
- **RetrievalService**: Retrieves data with caching and retry mechanisms
- **ErrorHandler**: Centralized error handling with classification and logging
- **Retry Logic**: Automatic retry with exponential backoff for transient errors

## Installation

```bash
npm install arweave
```

## Quick Start

### Basic Upload

```typescript
import { ArweaveClient, UploadManager } from './src';

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

const result = await uploadManager.upload(data, tags);
console.log('Transaction ID:', result.txId);
```

### Upload with Retry

```typescript
// Automatically retries up to 3 times with exponential backoff
const result = await uploadManager.uploadWithRetry(data, tags, 3);
```

### Batch Upload

```typescript
const items = [
  { data: Buffer.from('Memory 1'), tags: [{ name: 'ID', value: '1' }] },
  { data: Buffer.from('Memory 2'), tags: [{ name: 'ID', value: '2' }] },
  { data: Buffer.from('Memory 3'), tags: [{ name: 'ID', value: '3' }] },
];

const result = await uploadManager.uploadBatch(items);
console.log(`Uploaded ${result.successCount} items`);
```

### Retrieval with Caching

```typescript
import { RetrievalService } from './src';

const retrievalService = new RetrievalService(client);

// First call retrieves from Arweave
const data1 = await retrievalService.retrieveWithCache(txId);

// Second call retrieves from cache
const data2 = await retrievalService.retrieveWithCache(txId);
```

## Error Handling

### Error Types

The library provides comprehensive error classification:

- `NETWORK_ERROR`: Network connectivity issues
- `TIMEOUT_ERROR`: Request timeout
- `CONNECTION_REFUSED`: Connection refused by server
- `WALLET_NOT_LOADED`: Wallet not loaded
- `INSUFFICIENT_BALANCE`: Insufficient wallet balance
- `TRANSACTION_CREATION_FAILED`: Failed to create transaction
- `TRANSACTION_SIGNING_FAILED`: Failed to sign transaction
- `TRANSACTION_POST_FAILED`: Failed to post transaction
- `UPLOAD_FAILED`: Upload operation failed
- `UPLOAD_TIMEOUT`: Upload timeout
- `UPLOAD_TOO_LARGE`: Upload size exceeds limit
- `RETRIEVAL_FAILED`: Retrieval operation failed
- `DATA_NOT_FOUND`: Data not found on Arweave
- `GATEWAY_ERROR`: Gateway error
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded

### Handling Errors

```typescript
import { ArweaveError, ArweaveErrorCode } from './src';

try {
  const result = await uploadManager.upload(data, tags);
} catch (error) {
  if (error instanceof ArweaveError) {
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Is retryable:', error.isRetryable());

    switch (error.code) {
      case ArweaveErrorCode.INSUFFICIENT_BALANCE:
        console.log('Please add funds to your wallet');
        break;
      case ArweaveErrorCode.NETWORK_ERROR:
        console.log('Network error, retrying...');
        break;
      // Handle other error types
    }
  }
}
```

### Custom Retry Logic

```typescript
import { withRetry, DEFAULT_RETRY_CONFIG } from './src';

const result = await withRetry(
  () => uploadManager.upload(data, tags),
  {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    retryableErrors: [
      ArweaveErrorCode.NETWORK_ERROR,
      ArweaveErrorCode.TIMEOUT_ERROR,
    ],
  },
  errorHandler,
  'customUpload'
);
```

## Event Handling

### Upload Events

```typescript
uploadManager.on('upload:queued', ({ taskId, dataSize }) => {
  console.log(`Upload queued: ${taskId}, size: ${dataSize}`);
});

uploadManager.on('upload:creating', ({ taskId }) => {
  console.log(`Creating transaction: ${taskId}`);
});

uploadManager.on('upload:signing', ({ taskId, txId }) => {
  console.log(`Signing transaction: ${txId}`);
});

uploadManager.on('upload:uploading', ({ taskId, txId }) => {
  console.log(`Uploading: ${txId}`);
});

uploadManager.on('upload:completed', ({ taskId, txId, duration }) => {
  console.log(`Upload completed: ${txId} in ${duration}ms`);
});

uploadManager.on('upload:failed', ({ taskId, error, code }) => {
  console.error(`Upload failed: ${code} - ${error}`);
});
```

### Batch Events

```typescript
uploadManager.on('batch:started', ({ count }) => {
  console.log(`Starting batch of ${count} items`);
});

uploadManager.on('batch:progress', ({ current, total, percentage }) => {
  console.log(`Progress: ${current}/${total} (${percentage.toFixed(1)}%)`);
});

uploadManager.on('batch:completed', ({ total, successful, failed }) => {
  console.log(`Batch completed: ${successful}/${total} successful`);
});
```

### Retrieval Events

```typescript
retrievalService.on('retrieve:started', ({ txId }) => {
  console.log(`Retrieving: ${txId}`);
});

retrievalService.on('retrieve:completed', ({ txId, size }) => {
  console.log(`Retrieved: ${txId}, size: ${size} bytes`);
});

retrievalService.on('cache:hit', ({ txId }) => {
  console.log(`Cache hit: ${txId}`);
});

retrievalService.on('cache:miss', ({ txId }) => {
  console.log(`Cache miss: ${txId}`);
});
```

## Error Statistics

```typescript
const errorHandler = uploadManager.getErrorHandler();

// Get error statistics
const stats = errorHandler.getErrorStats();
console.log('Total errors:', stats.total);
console.log('Retryable errors:', stats.retryable);
console.log('Errors by code:', stats.byCode);

// Get error log
const errorLog = errorHandler.getErrorLog();
for (const entry of errorLog) {
  console.log(`[${entry.timestamp}] ${entry.code}: ${entry.message}`);
}

// Clear error log
errorHandler.clearErrorLog();
```

## Configuration

### ArweaveClient Configuration

```typescript
interface ArweaveConfig {
  host: string;              // Arweave gateway host
  port: number;              // Gateway port
  protocol: 'http' | 'https'; // Protocol
  timeout: number;           // Request timeout in ms
  logging: boolean;          // Enable logging
  walletPath?: string;       // Path to wallet file
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number;           // Maximum retry attempts
  initialDelay: number;         // Initial delay in ms
  maxDelay: number;             // Maximum delay in ms
  backoffMultiplier: number;    // Backoff multiplier
  retryableErrors: ArweaveErrorCode[]; // Errors to retry
}
```

## Best Practices

1. **Always use retry logic for uploads**: Network issues are common, use `uploadWithRetry()` for better reliability.

2. **Handle specific error types**: Different errors require different handling strategies.

3. **Use batch uploads for multiple files**: More efficient than individual uploads.

4. **Enable caching for retrievals**: Reduces network calls and improves performance.

5. **Monitor error statistics**: Track errors to identify patterns and issues.

6. **Set appropriate timeouts**: Balance between reliability and performance.

7. **Use events for progress tracking**: Provide feedback to users during long operations.

## Examples

See `src/example-usage.ts` for comprehensive examples covering:

- Basic upload with error handling
- Upload with automatic retry
- Batch upload with progress tracking
- Retrieval with caching
- Custom retry logic
- Error statistics and logging
- Handling specific error types

## API Reference

### ArweaveClient

- `initialize()`: Initialize client and load wallet
- `loadWallet(path)`: Load wallet from file
- `getBalance(address?)`: Get wallet balance
- `getNetworkInfo()`: Get network information
- `getTransactionStatus(txId)`: Get transaction status
- `getTransaction(txId)`: Get transaction
- `getTransactionData(txId)`: Get transaction data
- `createTransaction(data, tags)`: Create transaction
- `signTransaction(tx)`: Sign transaction
- `postTransaction(tx)`: Post transaction
- `estimateCost(dataSize)`: Estimate upload cost

### UploadManager

- `upload(data, tags, options?)`: Upload single file
- `uploadBatch(items)`: Upload multiple files
- `uploadWithRetry(data, tags, maxRetries)`: Upload with retry
- `getProgress(taskId)`: Get upload progress
- `cancelUpload(taskId)`: Cancel upload
- `getActiveUploadsCount()`: Get active uploads count

### RetrievalService

- `retrieve(txId)`: Retrieve data
- `retrieveWithCache(txId)`: Retrieve with caching
- `retrieveWithRetry(txId, maxRetries)`: Retrieve with retry
- `batchRetrieve(txIds)`: Retrieve multiple transactions
- `verifyData(txId, expectedHash)`: Verify data integrity
- `getMetadata(txId)`: Get transaction metadata
- `streamData(txId, chunkSize)`: Stream large data
- `getCacheStats()`: Get cache statistics
- `clearCache()`: Clear cache

### ErrorHandler

- `handleError(error, context?)`: Handle and classify error
- `getErrorLog()`: Get error log
- `getErrorStats()`: Get error statistics
- `clearErrorLog()`: Clear error log

## License

MIT
