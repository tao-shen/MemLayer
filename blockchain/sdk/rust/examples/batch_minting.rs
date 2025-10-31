use memory_platform_sdk::{
    MemoryPlatformClient, MintMemoryRequest, BatchMintRequest, Priority,
};
use anchor_client::Cluster;
use solana_sdk::{pubkey::Pubkey, signature::Keypair};
use std::sync::Arc;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let payer = Arc::new(Keypair::new());
    let program_id = Pubkey::from_str("YourProgramIDHere111111111111111111111111111")?;
    let api_url = "https://api.memoryplatform.io".to_string();
    
    let client = MemoryPlatformClient::new(
        Cluster::Devnet,
        payer,
        program_id,
        api_url,
    )?;
    
    println!("Memory Platform SDK - Batch Minting Example\n");
    
    // Create multiple memories
    let mut memories = Vec::new();
    for i in 0..50 {
        memories.push(MintMemoryRequest {
            content: format!("Memory content #{}", i),
            metadata: serde_json::json!({
                "index": i,
                "type": "episodic",
                "batch": true
            }),
            agent_id: "agent-batch-test".to_string(),
            priority: Priority::Low,
        });
    }
    
    println!("Minting {} memories in batch...", memories.len());
    
    let batch_request = BatchMintRequest { memories };
    
    match client.mint_batch(batch_request).await {
        Ok(response) => {
            println!("\n✓ Batch minting completed!");
            println!("  Batch ID: {}", response.batch_id);
            println!("  Success: {}", response.success_count);
            println!("  Failed: {}", response.failed_count);
            println!("  Total cost: {} lamports", response.total_cost_lamports);
            println!("\n  Asset IDs:");
            for (i, asset_id) in response.asset_ids.iter().enumerate().take(5) {
                println!("    {}. {}", i + 1, asset_id);
            }
            if response.asset_ids.len() > 5 {
                println!("    ... and {} more", response.asset_ids.len() - 5);
            }
        }
        Err(e) => {
            println!("✗ Batch minting failed: {}", e);
        }
    }
    
    Ok(())
}
