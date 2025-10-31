# Memory Platform SDK Guide

Complete guide for integrating Memory Platform blockchain features into your applications.

## Overview

Memory Platform provides SDKs in multiple languages to interact with the blockchain-based memory asset system on Solana. This guide covers all available SDKs and their usage.

## Available SDKs

- **[TypeScript/JavaScript SDK](#typescript-sdk)** - For web and Node.js applications
- **[Rust SDK](#rust-sdk)** - For native Solana programs and Rust applications
- **[CLI Tool](#cli-tool)** - Command-line interface for all operations

## Quick Comparison

| Feature | TypeScript | Rust | CLI |
|---------|-----------|------|-----|
| Memory Minting | ✅ | ✅ | ✅ |
| Batch Operations | ✅ | ✅ | ✅ |
| Access Control | ✅ | ✅ | ✅ |
| Asset Transfer | ✅ | ✅ | ✅ |
| Indexer Queries | ✅ | ✅ | ✅ |
| Browser Support | ✅ | ❌ | ❌ |
| Native Performance | ❌ | ✅ | ❌ |
| Interactive Mode | ❌ | ❌ | ✅ |

## TypeScript SDK

### Installation

```bash
npm install @memory-platform/sdk
# or
yarn add @memory-platform/sdk
```

### Basic Usage

```typescript
import { MemoryPlatformSDK } from '@memory-platform/sdk';
import { Connection, Keypair } from '@solana/web3.js';

// Initialize SDK
const connection = new Connection('https://api.devnet.solana.com');
const wallet = Keypair.generate(); // or load from file
const programId = 'YourProgramID...';

const sdk = new MemoryPlatformSDK({
  connection,
  wallet,
  programId,
  apiBaseUrl: 'https://api.memoryplatform.io',
});

// Mint a memory
const result = await sdk.minting.mintMemory({
  content: 'My memory content',
  metadata: { type: 'episodic' },
  agentId: 'agent-123',
  priority: 'medium',
});

console.log('Asset ID:', result.assetId);
```

### Advanced Features

#### Batch Minting

```typescript
const memories = [
  { content: 'Memory 1', metadata: {}, agentId: 'agent-1' },
  { content: 'Memory 2', metadata: {}, agentId: 'agent-1' },
  // ... more memories
];

const batchResult = await sdk.minting.mintBatch(memories);
console.log('Batch ID:', batchResult.batchId);
console.log('Success:', batchResult.successCount);
```

#### Access Control

```typescript
// Grant access
await sdk.access.grantAccess('asset-id', {
  grantee: 'wallet-address',
  permissions: ['read'],
  expiresAt: Date.now() + 86400000, // 24 hours
  maxAccess: 10,
});

// Revoke access
await sdk.access.revokeAccess('asset-id', 'wallet-address');

// Check access
const hasAccess = await sdk.access.checkAccess('asset-id', 'wallet-address');
```

#### Query Memories

```typescript
// Get user memories
const memories = await sdk.indexer.getUserMemories(walletAddress, {
  agentId: 'agent-123',
  limit: 50,
  offset: 0,
});

// Get specific memory
const memory = await sdk.indexer.getMemoryAsset('asset-id');
```

### React Integration

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

function useMemoryPlatform() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const sdk = useMemo(() => {
    if (!wallet.publicKey) return null;
    
    return new MemoryPlatformSDK({
      connection,
      wallet: wallet as any,
      programId: process.env.NEXT_PUBLIC_PROGRAM_ID!,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL!,
    });
  }, [connection, wallet]);

  return sdk;
}

// Usage in component
function MyComponent() {
  const sdk = useMemoryPlatform();

  const mintMemory = async () => {
    if (!sdk) return;
    
    const result = await sdk.minting.mintMemory({
      content: 'My memory',
      metadata: {},
      agentId: 'my-agent',
    });
    
    console.log('Minted:', result.assetId);
  };

  return <button onClick={mintMemory}>Mint Memory</button>;
}
```

## Rust SDK

### Installation

Add to `Cargo.toml`:

```toml
[dependencies]
memory-platform-sdk = "0.1.0"
```

### Basic Usage

```rust
use memory_platform_sdk::{
    MemoryPlatformClient, MintMemoryRequest, Priority,
};
use anchor_client::Cluster;
use solana_sdk::signature::Keypair;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize client
    let payer = Arc::new(Keypair::new());
    let program_id = "YourProgramID...".parse()?;
    
    let client = MemoryPlatformClient::new(
        Cluster::Devnet,
        payer,
        program_id,
        "https://api.memoryplatform.io".to_string(),
    )?;

    // Mint a memory
    let request = MintMemoryRequest {
        content: "My memory content".to_string(),
        metadata: serde_json::json!({"type": "episodic"}),
        agent_id: "agent-123".to_string(),
        priority: Priority::Medium,
    };

    let response = client.mint_memory(request).await?;
    println!("Asset ID: {}", response.asset_id);

    Ok(())
}
```

### Advanced Features

#### Batch Operations

```rust
use memory_platform_sdk::BatchMintRequest;

let memories = vec![
    MintMemoryRequest { /* ... */ },
    MintMemoryRequest { /* ... */ },
];

let batch_request = BatchMintRequest { memories };
let response = client.mint_batch(batch_request).await?;

println!("Batch ID: {}", response.batch_id);
println!("Success: {}/{}", response.success_count, response.asset_ids.len());
```

#### Access Management

```rust
use memory_platform_sdk::{AccessGrant, Permission};

// Grant access
let grant = AccessGrant {
    grantee: grantee_pubkey.to_string(),
    permissions: vec![Permission::Read],
    expires_at: Some(chrono::Utc::now().timestamp() + 86400),
    max_access: Some(10),
    current_access: 0,
};

let sig = client.grant_access("asset-id", &grantee_pubkey, grant).await?;
println!("Access granted: {}", sig);
```

#### Query Operations

```rust
use memory_platform_sdk::QueryFilter;

let filter = QueryFilter {
    agent_id: Some("agent-123".to_string()),
    start_date: None,
    end_date: None,
    limit: Some(50),
    offset: Some(0),
};

let memories = client.get_user_memories(&wallet_pubkey, Some(filter)).await?;

for memory in memories {
    println!("Asset: {} - Owner: {}", memory.asset_id, memory.owner);
}
```

## CLI Tool

### Installation

```bash
npm install -g @memory-platform/cli
```

### Configuration

```bash
# Interactive setup
memory-cli config set

# Or set values directly
memory-cli config set --network devnet
memory-cli config set --rpc https://api.devnet.solana.com
memory-cli config set --wallet ~/.config/solana/id.json
```

### Common Operations

#### Mint Memory

```bash
# Interactive
memory-cli mint single

# Command-line
memory-cli mint single \
  --content "My memory" \
  --agent "agent-123" \
  --metadata '{"type":"episodic"}'
```

#### Batch Mint

```bash
# Generate template
memory-cli batch template memories.json --count 100

# Edit memories.json, then mint
memory-cli batch mint memories.json
```

#### Query Memories

```bash
# List all
memory-cli query list

# Filter by agent
memory-cli query list --agent agent-123 --limit 20

# Get specific memory
memory-cli query get <asset-id>
```

#### Access Control

```bash
# Grant access
memory-cli access grant <asset-id> \
  --grantee <wallet-address> \
  --permissions read,write

# Revoke access
memory-cli access revoke <asset-id> <wallet-address>
```

## Best Practices

### 1. Error Handling

Always handle errors appropriately:

```typescript
try {
  const result = await sdk.minting.mintMemory(request);
  console.log('Success:', result.assetId);
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Not enough SOL in wallet');
  } else if (error.code === 'TRANSACTION_FAILED') {
    console.error('Transaction failed:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### 2. Batch Operations

Use batch operations for multiple memories to save on transaction costs:

```typescript
// ❌ Bad: Multiple individual mints
for (const memory of memories) {
  await sdk.minting.mintMemory(memory);
}

// ✅ Good: Single batch mint
await sdk.minting.mintBatch(memories);
```

### 3. Cost Estimation

Always estimate costs before minting:

```typescript
const estimate = await sdk.minting.estimateCost(memories.length);
console.log(`Estimated cost: ${estimate.totalCostUsd} USD`);

// Confirm with user before proceeding
if (userConfirms) {
  await sdk.minting.mintBatch(memories);
}
```

### 4. Access Control

Implement proper access control:

```typescript
// Check access before allowing operations
const hasAccess = await sdk.access.checkAccess(assetId, userWallet);

if (!hasAccess) {
  throw new Error('Access denied');
}

// Proceed with operation
const memory = await sdk.indexer.getMemoryAsset(assetId);
```

### 5. Caching

Cache frequently accessed data:

```typescript
// Cache user memories
const cache = new Map();

async function getUserMemories(wallet: string) {
  if (cache.has(wallet)) {
    return cache.get(wallet);
  }

  const memories = await sdk.indexer.getUserMemories(wallet);
  cache.set(wallet, memories);
  
  // Invalidate after 1 minute
  setTimeout(() => cache.delete(wallet), 60000);
  
  return memories;
}
```

## Common Patterns

### Pattern 1: Memory Lifecycle

```typescript
// 1. Create and mint
const mintResult = await sdk.minting.mintMemory({
  content: 'Initial content',
  metadata: { version: 1 },
  agentId: 'agent-1',
});

// 2. Grant access to collaborator
await sdk.access.grantAccess(mintResult.assetId, {
  grantee: collaboratorWallet,
  permissions: ['read', 'write'],
});

// 3. Update (create new version)
const updateResult = await sdk.minting.createVersion(mintResult.assetId, {
  content: 'Updated content',
  metadata: { version: 2 },
});

// 4. Transfer ownership
await sdk.minting.transferMemory(mintResult.assetId, newOwnerWallet);
```

### Pattern 2: Bulk Import

```typescript
async function bulkImport(memories: Memory[]) {
  const BATCH_SIZE = 50;
  const results = [];

  for (let i = 0; i < memories.length; i += BATCH_SIZE) {
    const batch = memories.slice(i, i + BATCH_SIZE);
    const result = await sdk.minting.mintBatch(batch);
    results.push(result);
    
    console.log(`Processed ${i + batch.length}/${memories.length}`);
  }

  return results;
}
```

### Pattern 3: Access Management

```typescript
class MemoryAccessManager {
  constructor(private sdk: MemoryPlatformSDK) {}

  async shareWithTeam(assetId: string, teamMembers: string[]) {
    const promises = teamMembers.map(member =>
      this.sdk.access.grantAccess(assetId, {
        grantee: member,
        permissions: ['read'],
        expiresAt: Date.now() + 7 * 86400000, // 7 days
      })
    );

    await Promise.all(promises);
  }

  async revokeTeamAccess(assetId: string, teamMembers: string[]) {
    const promises = teamMembers.map(member =>
      this.sdk.access.revokeAccess(assetId, member)
    );

    await Promise.all(promises);
  }
}
```

## Troubleshooting

### Connection Issues

```typescript
// Test connection
try {
  const version = await connection.getVersion();
  console.log('Connected to Solana:', version);
} catch (error) {
  console.error('Connection failed:', error);
  // Try alternative RPC
}
```

### Transaction Failures

```typescript
// Add retry logic
async function mintWithRetry(request: MintRequest, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sdk.minting.mintMemory(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Insufficient Funds

```typescript
// Check balance before operations
const balance = await connection.getBalance(wallet.publicKey);
const requiredBalance = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL

if (balance < requiredBalance) {
  throw new Error(`Insufficient funds. Need ${requiredBalance} lamports, have ${balance}`);
}
```

## API Reference

For detailed API documentation, see:

- [TypeScript SDK API](./typescript/README.md)
- [Rust SDK API](./rust/README.md)
- [CLI Reference](../cli/README.md)

## Examples

Complete examples are available in the repository:

- [TypeScript Examples](./typescript/examples/)
- [Rust Examples](./rust/examples/)
- [CLI Examples](../cli/examples/)

## Support

- Documentation: https://docs.memoryplatform.io
- API Reference: https://api.memoryplatform.io/docs
- GitHub Issues: https://github.com/your-org/memory-platform/issues
- Discord: https://discord.gg/memoryplatform

## License

MIT
