import { IndexerService } from './services/indexer-service';
import { validateConfig } from './config';
import { logger } from './utils/logger';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration validation failed:', error);
  process.exit(1);
}

// Create indexer service instance
const indexer = new IndexerService();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await indexer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await indexer.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the indexer
async function main() {
  try {
    logger.info('Starting Blockchain Indexer Service...');
    
    // Start indexer (will use last processed slot or config start slot)
    await indexer.start();
    
    logger.info('Blockchain Indexer Service is running');
    
    // Log health status periodically
    setInterval(async () => {
      const health = await indexer.healthCheck();
      if (!health.healthy) {
        logger.warn('Health check failed:', health);
      }
    }, 60000); // Every minute
  } catch (error) {
    logger.error('Failed to start indexer service:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { IndexerService };
export * from './types';
export * from './services/query-engine';
export * from './cache/cache-manager';

// Start if running directly
if (require.main === module) {
  main();
}
