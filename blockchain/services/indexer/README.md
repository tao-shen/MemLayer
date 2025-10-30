# Blockchain Indexer Service

索引器服务用于监听和索引 Solana 链上的记忆资产事件，提供快速查询接口。

## Features

- 🔍 实时监听 Solana 程序事件
- 📊 索引记忆资产、批次、转移历史
- ⚡ Redis 缓存加速查询
- 🔄 支持增量和全量同步
- 🛡️ 自动故障恢复和重试

## Architecture

```
┌─────────────────┐
│  Helius RPC     │
│  (Solana Node)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Event Listener  │
│  - Poll events  │
│  - Parse logs   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Indexer    │
│  - Transform    │
│  - Validate     │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
┌──────────────┐  ┌──────────┐
│ PostgreSQL   │  │  Redis   │
│  (Persistent)│  │  (Cache) │
└──────────────┘  └──────────┘
         │
         ▼
┌─────────────────┐
│  Query Engine   │
│  - Filter       │
│  - Paginate     │
└─────────────────┘
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Helius RPC
HELIUS_API_KEY=your_api_key_here
SOLANA_NETWORK=devnet

# Program ID
MEMORY_ASSET_PROGRAM_ID=your_program_id

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/memory_platform
REDIS_URL=redis://localhost:6379

# Indexer Settings
INDEXER_START_SLOT=0
INDEXER_BATCH_SIZE=100
INDEXER_POLL_INTERVAL=1000
```

### Getting Helius API Key

1. 访问 [Helius Dashboard](https://dashboard.helius.dev/)
2. 注册账户
3. 创建新项目
4. 复制 API Key

## Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev

# Run in production
npm start
```

## Usage

### Starting the Indexer

```typescript
import { IndexerService } from './services/indexer-service';

const indexer = new IndexerService();

// Start indexing from latest slot
await indexer.start();

// Start from specific slot
await indexer.start(12345678);
```

### Querying Data

```typescript
import { QueryEngine } from './services/query-engine';

const queryEngine = new QueryEngine();

// Get user's memories
const memories = await queryEngine.getUserMemories('wallet_address', {
  limit: 10,
  offset: 0,
  startDate: new Date('2024-01-01'),
});

// Get specific memory asset
const asset = await queryEngine.getMemoryAsset('asset_id');

// Get batch info
const batch = await queryEngine.getBatchInfo('batch_id');
```

## API Reference

### IndexerService

```typescript
class IndexerService {
  // Start indexing
  start(fromSlot?: number): Promise<void>;
  
  // Stop indexing
  stop(): Promise<void>;
  
  // Sync from chain
  syncFromChain(fromSlot?: number): Promise<void>;
  
  // Get sync status
  getSyncStatus(): SyncStatus;
}
```

### QueryEngine

```typescript
class QueryEngine {
  // Query user memories
  getUserMemories(
    walletAddress: string,
    filters?: MemoryFilter
  ): Promise<MemoryAsset[]>;
  
  // Get memory asset
  getMemoryAsset(assetId: string): Promise<MemoryAsset | null>;
  
  // Get batch info
  getBatchInfo(batchId: string): Promise<BatchInfo>;
  
  // Get transfer history
  getTransferHistory(assetId: string): Promise<TransferRecord[]>;
}
```

## Performance

- **Query Latency**: < 100ms (with cache)
- **Indexing Speed**: ~1000 transactions/second
- **Cache Hit Rate**: > 90%
- **Sync Lag**: < 5 seconds

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Metrics

- `indexer_blocks_processed`: Total blocks processed
- `indexer_events_indexed`: Total events indexed
- `indexer_sync_lag_seconds`: Sync lag in seconds
- `indexer_errors_total`: Total errors
- `cache_hit_rate`: Cache hit rate

## Troubleshooting

### Indexer is lagging behind

1. Check RPC connection health
2. Increase `INDEXER_BATCH_SIZE`
3. Add more RPC endpoints
4. Scale horizontally

### High memory usage

1. Reduce `CACHE_MAX_SIZE`
2. Decrease `CACHE_TTL_SECONDS`
3. Enable Redis eviction policy

### Missing events

1. Check `INDEXER_START_SLOT`
2. Run full resync: `npm run resync`
3. Verify program ID is correct

## Development

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback
npm run migrate:rollback
```

## License

MIT
