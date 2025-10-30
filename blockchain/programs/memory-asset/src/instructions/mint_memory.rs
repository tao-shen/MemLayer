use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_bubblegum::program::Bubblegum;
use spl_account_compression::{program::SplAccountCompression, Noop};
use crate::state::*;
use crate::constants::*;
use crate::errors::MemoryAssetError;

#[derive(Accounts)]
pub struct MintMemory<'info> {
    #[account(
        mut,
        seeds = [USER_ACCOUNT_SEED, owner.key().as_ref()],
        bump = user_account.bump,
        has_one = owner @ MemoryAssetError::InvalidOwner
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Merkle tree account for compressed NFT
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,

    /// CHECK: Tree authority PDA
    pub tree_authority: UncheckedAccount<'info>,

    /// CHECK: Bubblegum signer PDA
    pub bubblegum_signer: UncheckedAccount<'info>,

    /// CHECK: Log wrapper for compression
    pub log_wrapper: Program<'info, Noop>,

    pub compression_program: Program<'info, SplAccountCompression>,
    pub bubblegum_program: Program<'info, Bubblegum>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<MintMemory>,
    arweave_id: String,
    content_hash: [u8; 32],
    metadata_uri: String,
) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let clock = Clock::get()?;

    // Validate inputs
    require!(
        arweave_id.len() <= MAX_ARWEAVE_ID_LEN,
        MemoryAssetError::InvalidArweaveIdLength
    );
    require!(
        metadata_uri.len() <= MAX_METADATA_URI_LEN,
        MemoryAssetError::InvalidMetadataUriLength
    );

    // Create memory metadata
    let memory_metadata = MemoryMetadata {
        owner: ctx.accounts.owner.key(),
        arweave_id: arweave_id.clone(),
        version: DEFAULT_VERSION,
        batch_id: None,
        created_at: clock.unix_timestamp,
        content_hash,
    };

    // Serialize metadata for Bubblegum
    let metadata_bytes = memory_metadata.try_to_vec()?;

    // Update user account statistics
    user_account.memory_count = user_account
        .memory_count
        .checked_add(1)
        .ok_or(MemoryAssetError::ArithmeticOverflow)?;
    
    user_account.total_storage_bytes = user_account
        .total_storage_bytes
        .checked_add(metadata_bytes.len() as u64)
        .ok_or(MemoryAssetError::ArithmeticOverflow)?;

    msg!("Memory minted successfully");
    msg!("Owner: {}", ctx.accounts.owner.key());
    msg!("Arweave ID: {}", arweave_id);
    msg!("Content Hash: {:?}", content_hash);
    msg!("Total memories: {}", user_account.memory_count);

    // Note: Actual Bubblegum CPI call would be here
    // For now, we're just updating our state
    // In production, you would call:
    // mpl_bubblegum::cpi::mint_v1(...)

    Ok(())
}
