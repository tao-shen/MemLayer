# Memory Platform Blockchain SDK

TypeScript SDK for integrating with the Memory Platform blockchain features.

## Installation

```bash
npm install @memory-platform/blockchain-sdk
```

## Quick Start

### Initialize the SDK

```typescript
import { MemoryPlatformSDK } from '@memory-platform/blockchain-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

// In your React component
const wallet = useWallet();

const sdk = new MemoryPlatformSDK(
  {
    apiEndpoint: 'https://api.memoryplatform.com/v1/blockchain',
    network: 'devnet',
  },
  wallet
);
```

### Mint a Memory

```typescript
const result = await sdk.minting.mintMemory(
  {
    content: 'This is my memory content',
    agentId: 'agent-123',
    metadata: {
      type: 'episodic',
      importance: 0.8,
    },
  },
  {
    priority: 'medium',
  }
);

console.log('Minted asset:', result.assetId);
console.log('Arweave ID:', result.arweaveId);
console.log('Transaction:', result.transactionSignature);
```

### Batch Mint Memories

```typescript
const memories = [
  { content: 'Memory 1', agentId: 'agent-123' },
  { content: 'Memory 2', agentId: 'agent-123' },
  { content: 'Memory 3', agentId: 'agent-123' },
];

const batchResult = await sdk.minting.mintBatch(memories, {
  priority: 'high',
});

console.log('Batch ID:', batchResult.batchId);
console.log('Asset IDs:', batchResult.assetIds);
console.log('Total cost:', batchResult.totalCost);
```

### Estimate Minting Cost

```typescript
const estimate = await sdk.minting.estimateCost(10); // For 10 memories

console.log('Solana cost:', estimate.solanaCost);
console.log('Arweave cost:', estimate.arweaveCost);
console.log('Total cost:', estimate.totalCost);
console.log('USD cost:', estimate.totalCostUSD);
```

### Query User's Memories

```typescript
const memories = await sdk.indexer.getUserMemories(
  'wallet_address_here',
  {
    agentId: 'agent-123',
    limit: 10,
    offset: 0,
  }
);

memories.forEach((memory) => {
  console.log('Asset ID:', memory.assetId);
  console.log('Created:', memory.createdAt);
  console.log('Version:', memory.version);
});
```

### Get Memory Asset Details

```typescript
const asset = await sdk.indexer.getMemoryAsset('asset_id_here');

console.log('Owner:', asset.owner);
console.log('Arweave ID:', asset.arweaveId);
console.log('Content Hash:', asset.contentHash);
console.log('Metadata:', asset.metadata);
```

### Grant Access to a Memory

```typescript
await sdk.accessControl.grantAccess(
  'asset_id_here',
  'grantee_wallet_address',
  ['read', 'write'],
  new Date('2024-12-31'), // Expires at
  100 // Max access count
);

console.log('Access granted successfully');
```

### Revoke Access

```typescript
await sdk.accessControl.revokeAccess(
  'asset_id_here',
  'grantee_wallet_address'
);

console.log('Access revoked successfully');
```

### Check Access

```typescript
const hasAccess = await sdk.accessControl.checkAccess(
  'asset_id_here',
  'wallet_address_to_check'
);

console.log('Has access:', hasAccess);
```

### Get Access Policy

```typescript
const policy = await sdk.accessControl.getAccessPolicy('asset_id_here');

console.log('Owner:', policy.owner);
console.log('Grants:', policy.grants);
console.log('Default policy:', policy.defaultPolicy);
```

### Get Transfer History

```typescript
const transfers = await sdk.indexer.getTransferHistory('asset_id_here');

transfers.forEach((transfer) => {
  console.log('From:', transfer.fromAddress);
  console.log('To:', transfer.toAddress);
  console.log('Date:', transfer.transferredAt);
  console.log('Transaction:', transfer.transactionSignature);
});
```

### Get Batch Information

```typescript
const batch = await sdk.indexer.getBatchInfo('batch_id_here');

console.log('Memory count:', batch.memoryCount);
console.log('Total size:', batch.totalSizeBytes);
console.log('Status:', batch.status);
console.log('Cost:', batch.totalCostLamports);
```

### Get User Statistics

```typescript
const stats = await sdk.indexer.getUserStats('wallet_address_here');

console.log('Total memories:', stats.totalMemories);
console.log('Total batches:', stats.totalBatches);
console.log('Total transfers:', stats.totalTransfers);
console.log('Grants given:', stats.totalGrantsGiven);
console.log('Grants received:', stats.totalGrantsReceived);
```

## API Reference

### MemoryPlatformSDK

Main SDK class that provides access to all clients.

#### Constructor

```typescript
new MemoryPlatformSDK(config: SDKConfig, wallet: WalletAdapter)
```

#### Properties

- `minting: MemoryMintingClient` - Client for minting operations
- `accessControl: AccessControlClient` - Client for access control
- `indexer: IndexerClient` - Client for querying blockchain data

#### Methods

- `isWalletConnected(): boolean` - Check if wallet is connected
- `getWalletAddress(): string | null` - Get connected wallet address
- `updateWallet(wallet: WalletAdapter): void` - Update wallet adapter
- `updateConfig(config: Partial<SDKConfig>): void` - Update configuration

### MemoryMintingClient

Client for minting memories to the blockchain.

#### Methods

- `estimateCost(memoryCount: number): Promise<CostEstimate>`
- `mintMemory(memory: MemoryInput, options?: MintOptions): Promise<MintResult>`
- `mintBatch(memories: MemoryInput[], options?: MintOptions): Promise<BatchMintResult>`
- `getMintStatus(requestId: string): Promise<any>`
- `getBatchDetails(batchId: string): Promise<any>`

### AccessControlClient

Client for managing access control.

#### Methods

- `getAccessPolicy(assetId: string): Promise<AccessPolicy>`
- `grantAccess(assetId: string, granteeAddress: string, permissions: string[], expiresAt?: Date, maxAccess?: number): Promise<void>`
- `revokeAccess(assetId: string, granteeAddress: string): Promise<void>`
- `checkAccess(assetId: string, walletAddress: string): Promise<boolean>`
- `getAccessGrants(assetId: string): Promise<AccessGrant[]>`
- `updateAccessPolicy(assetId: string, policy: Partial<AccessPolicy>): Promise<void>`

### IndexerClient

Client for querying blockchain data.

#### Methods

- `getUserMemories(walletAddress: string, filters?: QueryFilter): Promise<MemoryAsset[]>`
- `getMemoryAsset(assetId: string): Promise<MemoryAsset>`
- `getTransferHistory(assetId: string): Promise<TransferRecord[]>`
- `getUserTransfers(walletAddress: string, filters?: QueryFilter): Promise<TransferRecord[]>`
- `getBatchInfo(batchId: string): Promise<BatchInfo>`
- `getUserBatches(walletAddress: string, filters?: QueryFilter): Promise<BatchInfo[]>`
- `getBatchMemories(batchId: string): Promise<MemoryAsset[]>`
- `searchByContentHash(contentHash: string): Promise<MemoryAsset[]>`
- `getUserStats(walletAddress: string): Promise<UserStats>`

## Types

### SDKConfig

```typescript
interface SDKConfig {
  apiEndpoint: string;
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
  rpcEndpoint?: string;
}
```

### MemoryInput

```typescript
interface MemoryInput {
  content: string;
  metadata?: Record<string, any>;
  agentId: string;
}
```

### MintOptions

```typescript
interface MintOptions {
  priority?: 'low' | 'medium' | 'high';
  batch?: boolean;
}
```

### MintResult

```typescript
interface MintResult {
  assetId: string;
  arweaveId: string;
  transactionSignature: string;
  cost: number;
  timestamp: Date;
}
```

## Error Handling

```typescript
try {
  const result = await sdk.minting.mintMemory(memory);
  console.log('Success:', result);
} catch (error) {
  if (error.response) {
    // API error
    console.error('API Error:', error.response.data);
  } else if (error.message.includes('Wallet')) {
    // Wallet error
    console.error('Wallet Error:', error.message);
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

## Best Practices

1. **Always check wallet connection** before performing operations
2. **Estimate costs** before minting to inform users
3. **Use batch minting** for multiple memories to save costs
4. **Handle errors gracefully** and provide user feedback
5. **Cache query results** when appropriate
6. **Use appropriate priority levels** based on urgency

## Examples

See the `/examples` directory for complete working examples:

- Basic minting
- Batch operations
- Access control management
- Querying and filtering

## Support

For issues and questions:
- GitHub Issues: https://github.com/tao-shen/Tacits/issues
- Documentation: https://docs.memoryplatform.com
- Discord: https://discord.gg/memoryplatform

## License

MIT
