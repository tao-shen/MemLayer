use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::{Keypair, Signature},
        signer::Signer,
    },
    Client, Cluster, Program,
};
use reqwest;
use std::rc::Rc;
use std::sync::Arc;

use crate::{
    error::{SdkError, SdkResult},
    types::*,
    utils,
};

pub struct MemoryPlatformClient {
    program: Program<Arc<Keypair>>,
    api_base_url: String,
    http_client: reqwest::Client,
    program_id: Pubkey,
}

impl MemoryPlatformClient {
    /// Create a new Memory Platform SDK client
    pub fn new(
        cluster: Cluster,
        payer: Arc<Keypair>,
        program_id: Pubkey,
        api_base_url: String,
    ) -> SdkResult<Self> {
        let client = Client::new_with_options(
            cluster,
            payer.clone(),
            CommitmentConfig::confirmed(),
        );
        
        let program = client.program(program_id)?;
        let http_client = reqwest::Client::new();

        Ok(Self {
            program,
            api_base_url,
            http_client,
            program_id,
        })
    }

    /// Initialize user account on-chain
    pub async fn initialize_user(&self) -> SdkResult<Signature> {
        let wallet = self.program.payer();
        let (user_account, _bump) = utils::derive_user_account_pda(&wallet, &self.program_id)?;
        let (access_policy, _) = utils::derive_access_policy_pda(&wallet, &self.program_id)?;

        let sig = self
            .program
            .request()
            .accounts(memory_asset::accounts::InitializeUser {
                user: wallet,
                user_account,
                access_policy,
                system_program: solana_sdk::system_program::id(),
            })
            .args(memory_asset::instruction::InitializeUser {})
            .send()?;

        Ok(sig)
    }

    /// Mint a single memory as compressed NFT
    pub async fn mint_memory(&self, request: MintMemoryRequest) -> SdkResult<MintMemoryResponse> {
        let url = format!("{}/v1/blockchain/memories/mint", self.api_base_url);
        
        let response = self
            .http_client
            .post(&url)
            .json(&request)
            .send()
            .await?
            .json::<MintMemoryResponse>()
            .await?;

        Ok(response)
    }

    /// Mint multiple memories in a batch
    pub async fn mint_batch(&self, request: BatchMintRequest) -> SdkResult<BatchMintResponse> {
        let url = format!("{}/v1/blockchain/memories/mint-batch", self.api_base_url);
        
        let response = self
            .http_client
            .post(&url)
            .json(&request)
            .send()
            .await?
            .json::<BatchMintResponse>()
            .await?;

        Ok(response)
    }

    /// Get user's memory assets
    pub async fn get_user_memories(
        &self,
        wallet: &Pubkey,
        filter: Option<QueryFilter>,
    ) -> SdkResult<Vec<MemoryAsset>> {
        let mut url = format!(
            "{}/v1/blockchain/memories?wallet={}",
            self.api_base_url,
            wallet.to_string()
        );

        if let Some(f) = filter {
            if let Some(agent_id) = f.agent_id {
                url.push_str(&format!("&agentId={}", agent_id));
            }
            if let Some(start) = f.start_date {
                url.push_str(&format!("&startDate={}", start));
            }
            if let Some(end) = f.end_date {
                url.push_str(&format!("&endDate={}", end));
            }
            if let Some(limit) = f.limit {
                url.push_str(&format!("&limit={}", limit));
            }
            if let Some(offset) = f.offset {
                url.push_str(&format!("&offset={}", offset));
            }
        }

        let response = self
            .http_client
            .get(&url)
            .send()
            .await?
            .json::<Vec<MemoryAsset>>()
            .await?;

        Ok(response)
    }

    /// Get a specific memory asset
    pub async fn get_memory_asset(&self, asset_id: &str) -> SdkResult<MemoryAsset> {
        let url = format!("{}/v1/blockchain/memories/{}", self.api_base_url, asset_id);
        
        let response = self
            .http_client
            .get(&url)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(response.json::<MemoryAsset>().await?)
        } else {
            Err(SdkError::AssetNotFound(asset_id.to_string()))
        }
    }

    /// Grant access to a memory asset
    pub async fn grant_access(
        &self,
        asset_id: &str,
        grantee: &Pubkey,
        grant: AccessGrant,
    ) -> SdkResult<Signature> {
        let url = format!(
            "{}/v1/blockchain/memories/{}/grant",
            self.api_base_url, asset_id
        );

        #[derive(serde::Serialize)]
        struct GrantRequest {
            grantee: String,
            grant: AccessGrant,
        }

        let request = GrantRequest {
            grantee: grantee.to_string(),
            grant,
        };

        let response = self
            .http_client
            .post(&url)
            .json(&request)
            .send()
            .await?;

        if response.status().is_success() {
            #[derive(serde::Deserialize)]
            struct GrantResponse {
                signature: String,
            }
            let resp = response.json::<GrantResponse>().await?;
            Ok(resp.signature.parse().map_err(|_| {
                SdkError::InvalidParameter("Invalid signature".to_string())
            })?)
        } else {
            Err(SdkError::TransactionFailed(
                "Failed to grant access".to_string(),
            ))
        }
    }

    /// Revoke access to a memory asset
    pub async fn revoke_access(&self, asset_id: &str, grantee: &Pubkey) -> SdkResult<Signature> {
        let url = format!(
            "{}/v1/blockchain/memories/{}/revoke",
            self.api_base_url, asset_id
        );

        #[derive(serde::Serialize)]
        struct RevokeRequest {
            grantee: String,
        }

        let request = RevokeRequest {
            grantee: grantee.to_string(),
        };

        let response = self
            .http_client
            .post(&url)
            .json(&request)
            .send()
            .await?;

        if response.status().is_success() {
            #[derive(serde::Deserialize)]
            struct RevokeResponse {
                signature: String,
            }
            let resp = response.json::<RevokeResponse>().await?;
            Ok(resp.signature.parse().map_err(|_| {
                SdkError::InvalidParameter("Invalid signature".to_string())
            })?)
        } else {
            Err(SdkError::TransactionFailed(
                "Failed to revoke access".to_string(),
            ))
        }
    }

    /// Transfer memory asset to a new owner
    pub async fn transfer_memory(&self, request: TransferRequest) -> SdkResult<TransferResponse> {
        let url = format!(
            "{}/v1/blockchain/memories/{}/transfer",
            self.api_base_url, request.asset_id
        );

        #[derive(serde::Serialize)]
        struct TransferReq {
            new_owner: String,
        }

        let req = TransferReq {
            new_owner: request.new_owner.to_string(),
        };

        let response = self
            .http_client
            .post(&url)
            .json(&req)
            .send()
            .await?
            .json::<TransferResponse>()
            .await?;

        Ok(response)
    }

    /// Get access policy for a memory asset
    pub async fn get_access_policy(&self, asset_id: &str) -> SdkResult<AccessPolicy> {
        let url = format!(
            "{}/v1/blockchain/memories/{}/policy",
            self.api_base_url, asset_id
        );

        let response = self
            .http_client
            .get(&url)
            .send()
            .await?
            .json::<AccessPolicy>()
            .await?;

        Ok(response)
    }

    /// Estimate cost for minting memories
    pub async fn estimate_cost(&self, memory_count: u32) -> SdkResult<CostEstimate> {
        let url = format!(
            "{}/v1/blockchain/cost/estimate?count={}",
            self.api_base_url, memory_count
        );

        let response = self
            .http_client
            .get(&url)
            .send()
            .await?
            .json::<CostEstimate>()
            .await?;

        Ok(response)
    }

    /// Get batch information
    pub async fn get_batch_info(&self, batch_id: &str) -> SdkResult<BatchMintResponse> {
        let url = format!("{}/v1/blockchain/batches/{}", self.api_base_url, batch_id);

        let response = self
            .http_client
            .get(&url)
            .send()
            .await?
            .json::<BatchMintResponse>()
            .await?;

        Ok(response)
    }
}

// Placeholder module for program types
mod memory_asset {
    pub mod accounts {
        use anchor_lang::prelude::*;

        #[derive(Accounts)]
        pub struct InitializeUser<'info> {
            #[account(mut)]
            pub user: Signer<'info>,
            #[account(mut)]
            pub user_account: AccountInfo<'info>,
            #[account(mut)]
            pub access_policy: AccountInfo<'info>,
            pub system_program: Program<'info, System>,
        }
    }

    pub mod instruction {
        use anchor_lang::prelude::*;

        #[derive(AnchorSerialize, AnchorDeserialize)]
        pub struct InitializeUser {}
    }
}
