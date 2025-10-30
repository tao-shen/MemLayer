use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::MemoryAssetError;

#[derive(Accounts)]
pub struct CreateVersion<'info> {
    #[account(
        mut,
        seeds = [USER_ACCOUNT_SEED, owner.key().as_ref()],
        bump = user_account.bump,
        has_one = owner @ MemoryAssetError::InvalidOwner
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateVersion>,
    arweave_id: String,
    content_hash: [u8; 32],
) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let clock = Clock::get()?;

    // Validate Arweave ID length
    require!(
        arweave_id.len() <= MAX_ARWEAVE_ID_LEN,
        MemoryAssetError::InvalidArweaveIdLength
    );

    // Create new version record
    let new_version = MemoryVersion {
        version: user_account.memory_count as u32 + 1, // Simple versioning
        arweave_id: arweave_id.clone(),
        content_hash,
        created_at: clock.unix_timestamp,
    };

    msg!("New version created");
    msg!("Owner: {}", ctx.accounts.owner.key());
    msg!("Version: {}", new_version.version);
    msg!("Arweave ID: {}", arweave_id);
    msg!("Content Hash: {:?}", content_hash);
    msg!("Timestamp: {}", new_version.created_at);

    // Emit version creation event
    emit!(VersionCreatedEvent {
        owner: ctx.accounts.owner.key(),
        version: new_version.version,
        arweave_id: arweave_id.clone(),
        content_hash,
        timestamp: new_version.created_at,
    });

    // Note: In a full implementation, you would store version history
    // either in a separate account or in a vector within the user account
    // For now, we just emit the event for off-chain indexing

    Ok(())
}

#[event]
pub struct VersionCreatedEvent {
    pub owner: Pubkey,
    pub version: u32,
    pub arweave_id: String,
    pub content_hash: [u8; 32],
    pub timestamp: i64,
}
