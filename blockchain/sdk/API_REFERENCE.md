# Memory Platform SDK API Reference

Complete API reference for all Memory Platform SDKs.

## Table of Contents

- [TypeScript SDK](#typescript-sdk)
  - [MemoryPlatformSDK](#memoryplatformsdk)
  - [MemoryMintingClient](#memorymintingclient)
  - [AccessControlClient](#accesscontrolclient)
  - [IndexerClient](#indexerclient)
- [Rust SDK](#rust-sdk)
  - [MemoryPlatformClient](#memoryplatformclient)
- [Types](#types)
- [Errors](#errors)

---

## TypeScript SDK

### MemoryPlatformSDK

Main SDK class that provides access to all functionality.

#### Constructor

```typescript
new MemoryPlatformSDK(config: SDKConfig)
```

**Parameters:**

- `config.connection`: Solana Connection instance
- `config.wallet`: Wallet adapter or Keypair
- `config.programId`: Program ID string
- `config.apiBaseUrl`: API base URL string

**Example:**

```typescript
const sdk = new MemoryPlatformSDK({
  connection: new Connection('https://api.devnet.solana.com'),
  wallet: myWallet,
  programId: 'YourProgramID...',
  apiBaseUrl: 'https://api.memoryplatform.io',
});
```

#### Properties

- `minting`: MemoryMintingClient - Memory minting operations
- `access`: AccessControlClient - Access control operations
- `indexer`: IndexerClient - Query and indexing operations

---

### MemoryMintingClient

Handles memory minting and related operations.

#### mintMemory()

Mint a single memory as a compressed NFT.

```typescript
async mintMemory(request: MintMemoryRequest): Promise<MintMemoryResponse>
```

**Parameters:**

```typescript
interface MintMemoryRequest {
  content: string;              // Memory content
  metadata: Record<string, any>; // Metadata object
  agentId: string;              // Agent identifier
  priority?: 'low' | 'medium' | 'high'; // Priority level
}
```

**Returns:**

```typescript
interface MintMemoryResponse {
  assetId: string;              // Unique asset identifier
  arweaveId: string;            // Arweave transaction ID
  transactionSignature: string; // Solana transaction signature
  costLamports: number;         // Cost in lamports
}
```

**Example:**

```typescript
const result = await sdk.minting.mintMemory({
  content: 'My memory content',
  metadata: { type: 'episodic', tags: ['important'] },
  agentId: 'agent-123',
  priority: 'medium',
});
```

#### mintBatch()

Mint multiple memories in a single batch.

```typescript
async mintBatch(memories: MintMemoryRequest[]): Promise<BatchMintResponse>
```

**Parameters:**

- `memories`: Array of MintMemoryRequest objects

**Returns:**

```typescript
interface BatchMintResponse {
  batchId: string;              // Unique batch identifier
  assetIds: string[];           // Array of minted asset IDs
  totalCost: number;            // Total cost in lamports
  successCount: number;         // Number of successful mints
  failedCount: number;          // Number of failed mints
}
```

**Example:**

```typescript
const result = await sdk.minting.mintBatch([
  { content: 'Memory 1', metadata: {}, agentId: 'agent-1' },
  { content: 'Memory 2', metadata: {}, agentId: 'agent-1' },
]);
```

#### estimateCost()

Estimate the cost of minting memories.

```typescript
async estimateCost(count: number): Promise<CostEstimate>
```

**Parameters:**

- `count`: Number of memories to estimate

**Returns:**

```typescript
interface CostEstimate {
  solanaCostLamports: number;   // Solana transaction cost
  arweaveCostAr: number;        // Arweave storage cost
  totalCostUsd: number;         // Total cost in USD
}
```

**Example:**

```typescript
const estimate = await sdk.minting.estimateCost(100);
console.log(`Cost for 100 memories: $${estimate.totalCostUsd}`);
```

#### transferMemory()

Transfer memory asset ownership.

```typescript
async transferMemory(assetId: string, newOwner: string): Promise<TransferResponse>
```

**Parameters:**

- `assetId`: Asset identifier
- `newOwner`: New owner wallet address

**Returns:**

```typescript
interface TransferResponse {
  transactionSignature: string; // Transaction signature
  newOwner: string;             // New owner address
}
```

**Example:**

```typescript
const result = await sdk.minting.transferMemory(
  'asset-id',
  'new-owner-wallet-address'
);
```

---

### AccessControlClient

Manages memory access permissions.

#### grantAccess()

Grant access to a memory asset.

```typescript
async grantAccess(
  assetId: string,
  grant: AccessGrant
): Promise<string>
```

**Parameters:**

```typescript
interface AccessGrant {
  grantee: string;              // Grantee wallet address
  permissions: Permission[];    // Array of permissions
  expiresAt?: number;           // Expiration timestamp (optional)
  maxAccess?: number;           // Maximum access count (optional)
}

type Permission = 'read' | 'write' | 'transfer';
```

**Returns:**

- Transaction signature (string)

**Example:**

```typescript
const signature = await sdk.access.grantAccess('asset-id', {
  grantee: 'wallet-address',
  permissions: ['read', 'write'],
  expiresAt: Date.now() + 86400000, // 24 hours
  maxAccess: 10,
});
```

#### revokeAccess()

Revoke access to a memory asset.

```typescript
async revokeAccess(
  assetId: string,
  grantee: string
): Promise<string>
```

**Parameters:**

- `assetId`: Asset identifier
- `grantee`: Grantee wallet address

**Returns:**

- Transaction signature (string)

**Example:**

```typescript
const signature = await sdk.access.revokeAccess(
  'asset-id',
  'wallet-address'
);
```

#### checkAccess()

Check if a wallet has access to a memory.

```typescript
async checkAccess(
  assetId: string,
  wallet: string
): Promise<boolean>
```

**Parameters:**

- `assetId`: Asset identifier
- `wallet`: Wallet address to check

**Returns:**

- `true` if access is granted, `false` otherwise

**Example:**

```typescript
const hasAccess = await sdk.access.checkAccess('asset-id', 'wallet-address');
if (hasAccess) {
  // Allow access
}
```

#### getAccessPolicy()

Get the access policy for a memory asset.

```typescript
async getAccessPolicy(assetId: string): Promise<AccessPolicy>
```

**Parameters:**

- `assetId`: Asset identifier

**Returns:**

```typescript
interface AccessPolicy {
  owner: string;                // Owner wallet address
  grants: AccessGrant[];        // Array of access grants
  defaultPolicy: 'allow' | 'deny'; // Default policy
}
```

**Example:**

```typescript
const policy = await sdk.access.getAccessPolicy('asset-id');
console.log('Owner:', policy.owner);
console.log('Grants:', policy.grants.length);
```

---

### IndexerClient

Query and retrieve memory assets.

#### getUserMemories()

Get memories owned by a wallet.

```typescript
async getUserMemories(
  wallet: string,
  filter?: QueryFilter
): Promise<MemoryAsset[]>
```

**Parameters:**

```typescript
interface QueryFilter {
  agentId?: string;             // Filter by agent ID
  startDate?: number;           // Start date timestamp
  endDate?: number;             // End date timestamp
  limit?: number;               // Maximum results
  offset?: number;              // Pagination offset
}
```

**Returns:**

```typescript
interface MemoryAsset {
  assetId: string;              // Asset identifier
  owner: string;                // Owner wallet address
  arweaveId: string;            // Arweave transaction ID
  version: number;              // Version number
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
  metadata: Record<string, any>; // Metadata object
  batchId?: string;             // Batch ID (if applicable)
}
```

**Example:**

```typescript
const memories = await sdk.indexer.getUserMemories('wallet-address', {
  agentId: 'agent-123',
  limit: 50,
  offset: 0,
});
```

#### getMemoryAsset()

Get a specific memory asset.

```typescript
async getMemoryAsset(assetId: string): Promise<MemoryAsset>
```

**Parameters:**

- `assetId`: Asset identifier

**Returns:**

- MemoryAsset object

**Example:**

```typescript
const memory = await sdk.indexer.getMemoryAsset('asset-id');
console.log('Owner:', memory.owner);
console.log('Version:', memory.version);
```

#### getBatchInfo()

Get information about a batch.

```typescript
async getBatchInfo(batchId: string): Promise<BatchInfo>
```

**Parameters:**

- `batchId`: Batch identifier

**Returns:**

```typescript
interface BatchInfo {
  batchId: string;              // Batch identifier
  assetIds: string[];           // Array of asset IDs
  totalCost: number;            // Total cost in lamports
  successCount: number;         // Successful mints
  failedCount: number;          // Failed mints
  createdAt: Date;              // Creation timestamp
}
```

**Example:**

```typescript
const batch = await sdk.indexer.getBatchInfo('batch-id');
console.log('Assets:', batch.assetIds.length);
console.log('Success rate:', batch.successCount / batch.assetIds.length);
```

---

## Rust SDK

### MemoryPlatformClient

Main client for Rust SDK.

#### new()

Create a new client instance.

```rust
pub fn new(
    cluster: Cluster,
    payer: Arc<Keypair>,
    program_id: Pubkey,
    api_base_url: String,
) -> SdkResult<Self>
```

**Parameters:**

- `cluster`: Solana cluster (Devnet, Mainnet, or Custom)
- `payer`: Keypair for signing transactions
- `program_id`: Program public key
- `api_base_url`: API base URL

**Example:**

```rust
let client = MemoryPlatformClient::new(
    Cluster::Devnet,
    payer,
    program_id,
    "https://api.memoryplatform.io".to_string(),
)?;
```

#### initialize_user()

Initialize user account on-chain.

```rust
pub async fn initialize_user(&self) -> SdkResult<Signature>
```

**Returns:**

- Transaction signature

**Example:**

```rust
let signature = client.initialize_user().await?;
println!("User initialized: {}", signature);
```

#### mint_memory()

Mint a single memory.

```rust
pub async fn mint_memory(
    &self,
    request: MintMemoryRequest
) -> SdkResult<MintMemoryResponse>
```

**Parameters:**

```rust
pub struct MintMemoryRequest {
    pub content: String,
    pub metadata: serde_json::Value,
    pub agent_id: String,
    pub priority: Priority,
}

pub enum Priority {
    Low,
    Medium,
    High,
}
```

**Returns:**

```rust
pub struct MintMemoryResponse {
    pub asset_id: String,
    pub arweave_id: String,
    pub transaction_signature: String,
    pub cost_lamports: u64,
}
```

**Example:**

```rust
let request = MintMemoryRequest {
    content: "My memory".to_string(),
    metadata: serde_json::json!({"type": "episodic"}),
    agent_id: "agent-123".to_string(),
    priority: Priority::Medium,
};

let response = client.mint_memory(request).await?;
```

#### mint_batch()

Mint multiple memories in batch.

```rust
pub async fn mint_batch(
    &self,
    request: BatchMintRequest
) -> SdkResult<BatchMintResponse>
```

**Parameters:**

```rust
pub struct BatchMintRequest {
    pub memories: Vec<MintMemoryRequest>,
}
```

**Returns:**

```rust
pub struct BatchMintResponse {
    pub batch_id: String,
    pub asset_ids: Vec<String>,
    pub total_cost_lamports: u64,
    pub success_count: usize,
    pub failed_count: usize,
}
```

**Example:**

```rust
let batch_request = BatchMintRequest {
    memories: vec![
        MintMemoryRequest { /* ... */ },
        MintMemoryRequest { /* ... */ },
    ],
};

let response = client.mint_batch(batch_request).await?;
```

---

## Types

### Common Types

#### Priority

```typescript
type Priority = 'low' | 'medium' | 'high';
```

Priority level for minting operations.

#### Permission

```typescript
type Permission = 'read' | 'write' | 'transfer';
```

Access permission types.

#### Network

```typescript
type Network = 'devnet' | 'mainnet';
```

Solana network selection.

---

## Errors

### TypeScript SDK Errors

```typescript
class SDKError extends Error {
  code: string;
  details?: any;
}
```

**Error Codes:**

- `INSUFFICIENT_FUNDS` - Not enough SOL in wallet
- `TRANSACTION_FAILED` - Transaction failed to execute
- `INVALID_SIGNATURE` - Invalid wallet signature
- `ACCESS_DENIED` - Access to resource denied
- `ASSET_NOT_FOUND` - Asset does not exist
- `NETWORK_ERROR` - Network connection error
- `INVALID_PARAMETER` - Invalid parameter provided

### Rust SDK Errors

```rust
pub enum SdkError {
    SolanaClient(ClientError),
    Anchor(ClientError),
    Program(String),
    Serialization(serde_json::Error),
    Http(reqwest::Error),
    InvalidSignature,
    InsufficientFunds,
    AccessDenied,
    AssetNotFound(String),
    InvalidParameter(String),
    TransactionFailed(String),
    Unknown(String),
}
```

---

## Rate Limits

API rate limits:

- **Free tier**: 100 requests/minute
- **Pro tier**: 1000 requests/minute
- **Enterprise**: Custom limits

Batch operations count as a single request regardless of batch size.

---

## Support

For questions or issues:

- Documentation: https://docs.memoryplatform.io
- GitHub: https://github.com/your-org/memory-platform
- Discord: https://discord.gg/memoryplatform
