use memory_platform_sdk::{
    MemoryPlatformClient, AccessGrant, Permission,
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
    
    println!("Memory Platform SDK - Access Control Example\n");
    
    // Asset ID to manage (replace with actual asset ID)
    let asset_id = "your-asset-id-here";
    
    // Grantee wallet address
    let grantee = Pubkey::from_str("GranteeWalletAddress111111111111111111111111")?;
    
    // 1. Get current access policy
    println!("1. Getting current access policy...");
    match client.get_access_policy(asset_id).await {
        Ok(policy) => {
            println!("   ✓ Current policy:");
            println!("     Owner: {}", policy.owner);
            println!("     Grants: {}", policy.grants.len());
            for grant in &policy.grants {
                println!("       - Grantee: {}", grant.grantee);
                println!("         Permissions: {:?}", grant.permissions);
                if let Some(expires) = grant.expires_at {
                    println!("         Expires: {}", expires);
                }
            }
        }
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    // 2. Grant read access
    println!("\n2. Granting read access...");
    let grant = AccessGrant {
        grantee: grantee.to_string(),
        permissions: vec![Permission::Read],
        expires_at: Some(chrono::Utc::now().timestamp() + 86400), // 24 hours
        max_access: Some(10),
        current_access: 0,
    };
    
    match client.grant_access(asset_id, &grantee, grant).await {
        Ok(sig) => println!("   ✓ Access granted: {}", sig),
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    // 3. Verify updated policy
    println!("\n3. Verifying updated policy...");
    match client.get_access_policy(asset_id).await {
        Ok(policy) => {
            println!("   ✓ Updated policy:");
            println!("     Total grants: {}", policy.grants.len());
        }
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    // 4. Revoke access
    println!("\n4. Revoking access...");
    match client.revoke_access(asset_id, &grantee).await {
        Ok(sig) => println!("   ✓ Access revoked: {}", sig),
        Err(e) => println!("   ✗ Error: {}", e),
    }
    
    println!("\n✓ Access control example completed!");
    
    Ok(())
}
