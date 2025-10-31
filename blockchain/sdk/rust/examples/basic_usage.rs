use memory_platform_sdk::{
    MemoryPlatformClient, MintMemoryRequest, Priority, QueryFilter,
};
use anchor_client::Cluster;
use solana_sdk::{pubkey::Pubkey, signature::Keypair};
use std::sync::Arc;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load keypair from file or environment
    let payer = Arc::new(Keypair::new());
    
    // Program ID (replace with actual deployed program ID)
    let program_id = Pubkey::from_str("YourProgramIDHere111111111111111111111111111")?;
    
    // API base URL
    let api_url = "https://api.memoryplatform.io".to_string();
    
    // Create client
    let client = MemoryPlatformClient::new(
        Cluster::Devnet,
        payer.clone(),
        program_id,
        api_url,
    )?;
    
    println!("Memory Platform SDK - Basic Usage Example\n");
    
    // 1. Initialize user account
    println!("1. Initializing user account...");
    match client.initialize_user().await {
        Ok(sig) => println!("   ✓ User initialized: {}", sig),
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    // 2. Mint a single memory
    println!("\n2. Minting a single memory...");
    let mint_request = MintMemoryRequest {
        content: "This is a test memory from Rust SDK".to_string(),
        metadata: serde_json::json!({
            "type": "episodic",
            "tags": ["test", "rust-sdk"]
        }),
        agent_id: "agent-123".to_string(),
        priority: Priority::Medium,
    };
    
    match client.mint_memory(mint_request).await {
        Ok(response) => {
            println!("   ✓ Memory minted!");
            println!("     Asset ID: {}", response.asset_id);
            println!("     Arweave ID: {}", response.arweave_id);
            println!("     Transaction: {}", response.transaction_signature);
            println!("     Cost: {} lamports", response.cost_lamports);
        }
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    // 3. Query user memories
    println!("\n3. Querying user memories...");
    let filter = QueryFilter {
        agent_id: Some("agent-123".to_string()),
        start_date: None,
        end_date: None,
        limit: Some(10),
        offset: None,
    };
    
    match client.get_user_memories(&payer.pubkey(), Some(filter)).await {
        Ok(memories) => {
            println!("   ✓ Found {} memories", memories.len());
            for memory in memories.iter().take(3) {
                println!("     - Asset ID: {}", memory.asset_id);
                println!("       Owner: {}", memory.owner);
                println!("       Version: {}", memory.version);
            }
        }
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    // 4. Estimate cost
    println!("\n4. Estimating cost for 100 memories...");
    match client.estimate_cost(100).await {
        Ok(estimate) => {
            println!("   ✓ Cost estimate:");
            println!("     Solana: {} lamports", estimate.solana_cost_lamports);
            println!("     Arweave: {} AR", estimate.arweave_cost_ar);
            println!("     Total: ${:.4} USD", estimate.total_cost_usd);
        }
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    println!("\n✓ Example completed!");
    
    Ok(())
}
