# Memory Platform Rust SDK

Official Rust SDK for interacting with the Memory Platform blockchain integration on Solana.

## Features

- 🔐 **Solana Program Integration**: Direct interaction with Memory Asset smart contracts
- 💾 **Memory Minting**: Mint memories as compressed NFTs on Solana
- 📦 **Batch Operations**: Efficient batch minting for multiple memories
- 🔑 **Access Control**: Manage memory access permissions on-chain
- 🔄 **Asset Transfer**: Transfer memory ownership between wallets
- 📊 **Indexer Queries**: Fast queries for user memories and metadata
- 💰 **Cost Estimation**: Estimate transaction costs before execution

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
memory-platform-sdk = "0.1.0"
```

Or install via cargo:

```bash
cargo add memory-platform-sdk
```

## Quick Start

```rust
use memory_platform_sdk::{
    MemoryPlatformClient, MintMemoryRequest, Priority,
};
use anchor_client::Cluster;
use solana_sdk::{pubkey::Pubkey, signature::Keypair};
use std::sync::Arc;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load your keypair
    let payer = Arc::new(Keypair::new());
    
    // Program ID
    let program_id = Pubkey::from_str("YourProgramIDHere")?;
    
    // Create client
    let client = MemoryPlatformClient::new(
        Cluster::Devnet,
        payer,
        program_id,
        "https://api.memoryplatform.io".to_string(),
    )?;
    
    // Initialize user account
    let sig = client.initialize_user().await?;
    println!("User initialized: {}", sig);
    
    // Mint a memory
    let request = MintMemoryRequest {
        content: "My first memory".to_string(),
        metadata: serde_json::json!({"type": "episodic"}),
        agent_id: "agent-1".to_string(),
        priority: Priority::Medium,
    };
    
    let response = client.mint_memory(request).await?;
    println!("Memory minted: {}", response.asset_id);
    
    Ok(())
}
```

## Usage Examples

### Initialize User Account

Before minting memories, initialize your user account on-chain:

```rust
let signature = client.initialize_user().await?;
println!("User account initialized: {}", signature);
```

### Mint a Single Memory

```rust
let request = MintMemoryRequest {
    content: "This is my memory content".to_string(),
    metadata: serde_json::json!({
        "type": "episodic",
        "tags": ["important", "work"],
        "context": "Meeting notes"
    }),
    agent_id: "my-agent-id".to_string(),
    priority: Priority::High,
};

let response = client.mint_memory(request).await?;
println!("Asset ID: {}", response.asset_id);
println!("Arweave ID: {}", response.arweave_id);
println!("Cost: {} lamports", response.cost_lamports);
```

### Batch Mint Memories

```rust
use memory_platform_sdk::BatchMintRequest;

let memories = vec![
    MintMemoryRequest { /* ... */ },
    MintMemoryRequest { /* ... */ },
    // ... more memories
];

let batch_request = BatchMintRequest { memories };
let response = client.mint_batch(batch_request).await?;

println!("Batch ID: {}", response.batch_id);
println!("Success: {}/{}", response.success_count, response.asset_ids.len());
```

### Query User Memories

```rust
use memory_platform_sdk::QueryFilter;

let filter = QueryFilter {
    agent_id: Some("my-agent".to_string()),
    start_date: Some(1234567890),
    end_date: None,
    limit: Some(50),
    offset: Some(0),
};

let memories = client.get_user_memories(&wallet_pubkey, Some(filter)).await?;

for memory in memories {
    println!("Asset: {} - Owner: {}", memory.asset_id, memory.owner);
}
```

### Grant Access to Memory

```rust
use memory_platform_sdk::{AccessGrant, Permission};

let grant = AccessGrant {
    grantee: grantee_pubkey.to_string(),
    permissions: vec![Permission::Read],
    expires_at: Some(chrono::Utc::now().timestamp() + 86400), // 24 hours
    max_access: Some(10),
    current_access: 0,
};

let sig = client.grant_access("asset-id", &grantee_pubkey, grant).await?;
println!("Access granted: {}", sig);
```

### Transfer Memory Asset

```rust
use memory_platform_sdk::TransferRequest;

let request = TransferRequest {
    asset_id: "your-asset-id".to_string(),
    new_owner: new_owner_pubkey,
};

let response = client.transfer_memory(request).await?;
println!("Transferred to: {}", response.new_owner);
```

### Estimate Costs

```rust
let estimate = client.estimate_cost(100).await?;
println!("Cost for 100 memories:");
println!("  Solana: {} lamports", estimate.solana_cost_lamports);
println!("  Arweave: {} AR", estimate.arweave_cost_ar);
println!("  Total: ${:.4}", estimate.total_cost_usd);
```

## Configuration

### Cluster Selection

```rust
use anchor_client::Cluster;

// Devnet (for testing)
let cluster = Cluster::Devnet;

// Mainnet
let cluster = Cluster::Mainnet;

// Custom RPC
let cluster = Cluster::Custom(
    "https://your-rpc-url.com".to_string(),
    "wss://your-ws-url.com".to_string(),
);
```

### Loading Keypair

```rust
use solana_sdk::signature::{Keypair, read_keypair_file};

// From file
let keypair = read_keypair_file("~/.config/solana/id.json")?;

// From bytes
let keypair = Keypair::from_bytes(&bytes)?;

// Generate new (for testing)
let keypair = Keypair::new();
```

## Error Handling

The SDK uses a custom `SdkError` type for error handling:

```rust
use memory_platform_sdk::SdkError;

match client.mint_memory(request).await {
    Ok(response) => println!("Success: {}", response.asset_id),
    Err(SdkError::InsufficientFunds) => {
        println!("Not enough SOL in wallet");
    }
    Err(SdkError::AccessDenied) => {
        println!("Access denied to this resource");
    }
    Err(e) => println!("Error: {}", e),
}
```

## Examples

Run the included examples:

```bash
# Basic usage
cargo run --example basic_usage

# Batch minting
cargo run --example batch_minting

# Access control
cargo run --example access_control
```

## API Reference

### MemoryPlatformClient

Main client for interacting with the Memory Platform.

#### Methods

- `new(cluster, payer, program_id, api_base_url)` - Create a new client
- `initialize_user()` - Initialize user account on-chain
- `mint_memory(request)` - Mint a single memory
- `mint_batch(request)` - Mint multiple memories in batch
- `get_user_memories(wallet, filter)` - Query user's memories
- `get_memory_asset(asset_id)` - Get specific memory asset
- `grant_access(asset_id, grantee, grant)` - Grant access to memory
- `revoke_access(asset_id, grantee)` - Revoke access to memory
- `transfer_memory(request)` - Transfer memory ownership
- `get_access_policy(asset_id)` - Get memory access policy
- `estimate_cost(memory_count)` - Estimate minting costs
- `get_batch_info(batch_id)` - Get batch information

## Testing

Run tests:

```bash
cargo test
```

Run tests with output:

```bash
cargo test -- --nocapture
```

## Requirements

- Rust 1.70 or higher
- Solana CLI tools (for local development)
- Active Solana wallet with SOL for transactions

## Environment Setup

For local development:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Set to devnet
solana config set --url devnet

# Create wallet
solana-keygen new

# Airdrop SOL (devnet only)
solana airdrop 2
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

- Documentation: https://docs.memoryplatform.io
- Issues: https://github.com/tao-shen/Tacits/issues
- Discord: https://discord.gg/memoryplatform

## Related

- [TypeScript SDK](../typescript/README.md)
- [CLI Tool](../../cli/README.md)
- [API Documentation](../../docs/API_GUIDE.md)
