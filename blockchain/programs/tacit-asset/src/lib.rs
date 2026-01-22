use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod state;
pub mod instructions;
pub mod errors;
pub mod constants;

use instructions::*;
use state::*;

#[program]
pub mod memory_asset {
    use super::*;

    /// Initialize a user account for memory asset management
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        instructions::initialize_user::handler(ctx)
    }

    /// Mint a memory as a compressed NFT
    pub fn mint_memory(
        ctx: Context<MintMemory>,
        arweave_id: String,
        content_hash: [u8; 32],
        metadata_uri: String,
    ) -> Result<()> {
        instructions::mint_memory::handler(ctx, arweave_id, content_hash, metadata_uri)
    }

    /// Update access policy for memory assets
    pub fn update_access_policy(
        ctx: Context<UpdateAccessPolicy>,
        grants: Vec<AccessGrant>,
        default_policy: PolicyType,
    ) -> Result<()> {
        instructions::update_access_policy::handler(ctx, grants, default_policy)
    }

    /// Transfer memory asset to a new owner
    pub fn transfer_memory(
        ctx: Context<TransferMemory>,
        new_owner: Pubkey,
    ) -> Result<()> {
        instructions::transfer_memory::handler(ctx, new_owner)
    }

    /// Create a new version of a memory asset
    pub fn create_version(
        ctx: Context<CreateVersion>,
        arweave_id: String,
        content_hash: [u8; 32],
    ) -> Result<()> {
        instructions::create_version::handler(ctx, arweave_id, content_hash)
    }
}
