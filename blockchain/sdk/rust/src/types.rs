use serde::{Deserialize, Serialize};
use solana_sdk::pubkey::Pubkey;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MintMemoryRequest {
    pub content: String,
    pub metadata: serde_json::Value,
    pub agent_id: String,
    pub priority: Priority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MintMemoryResponse {
    pub asset_id: String,
    pub arweave_id: String,
    pub transaction_signature: String,
    pub cost_lamports: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchMintRequest {
    pub memories: Vec<MintMemoryRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchMintResponse {
    pub batch_id: String,
    pub asset_ids: Vec<String>,
    pub total_cost_lamports: u64,
    pub success_count: usize,
    pub failed_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryAsset {
    pub asset_id: String,
    pub owner: String,
    pub arweave_id: String,
    pub version: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub metadata: serde_json::Value,
    pub batch_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessPolicy {
    pub owner: String,
    pub grants: Vec<AccessGrant>,
    pub default_policy: DefaultPolicy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DefaultPolicy {
    Deny,
    Allow,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessGrant {
    pub grantee: String,
    pub permissions: Vec<Permission>,
    pub expires_at: Option<i64>,
    pub max_access: Option<u32>,
    pub current_access: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Permission {
    Read,
    Write,
    Transfer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferRequest {
    pub asset_id: String,
    pub new_owner: Pubkey,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferResponse {
    pub transaction_signature: String,
    pub new_owner: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostEstimate {
    pub solana_cost_lamports: u64,
    pub arweave_cost_ar: f64,
    pub total_cost_usd: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryFilter {
    pub agent_id: Option<String>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}
