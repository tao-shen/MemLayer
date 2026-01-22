use anchor_lang::prelude::*;
use mpl_bubblegum::program::Bubblegum;
use spl_account_compression::{program::SplAccountCompression, Noop};
use crate::state::*;
use crate::constants::*;
use crate::errors::MemoryAssetError;

#[derive(Accounts)]
pub struct TransferMemory<'info> {
    #[account(
        mut,
        seeds = [USER_ACCOUNT_SEED, current_owner.key().as_ref()],
        bump = user_account.bump,
        has_one = owner @ MemoryAssetError::InvalidOwner
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        seeds = [ACCESS_POLICY_SEED, current_owner.key().as_ref()],
        bump = access_policy.bump,
        has_one = owner @ MemoryAssetError::InvalidOwner
    )]
    pub access_policy: Account<'info, AccessPolicyAccount>,

    /// Current owner of the memory asset
    #[account(mut)]
    pub current_owner: Signer<'info>,

    /// Alias for current_owner (for has_one constraint)
    pub owner: Signer<'info>,

    /// CHECK: New owner public key
    pub new_owner: UncheckedAccount<'info>,

    /// CHECK: Merkle tree account
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,

    /// CHECK: Tree authority PDA
    pub tree_authority: UncheckedAccount<'info>,

    /// CHECK: Bubblegum signer PDA
    pub bubblegum_signer: UncheckedAccount<'info>,

    /// CHECK: Log wrapper
    pub log_wrapper: Program<'info, Noop>,

    pub compression_program: Program<'info, SplAccountCompression>,
    pub bubblegum_program: Program<'info, Bubblegum>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<TransferMemory>,
    new_owner: Pubkey,
) -> Result<()> {
    let current_owner = &ctx.accounts.current_owner;
    let access_policy = &ctx.accounts.access_policy;

    // Verify current owner has transfer permission
    // (Owner always has permission, but we check for consistency)
    require!(
        current_owner.key() == access_policy.owner,
        MemoryAssetError::Unauthorized
    );

    // Validate new owner is different from current owner
    require!(
        new_owner != current_owner.key(),
        MemoryAssetError::InvalidOwner
    );

    msg!("Transferring memory asset");
    msg!("From: {}", current_owner.key());
    msg!("To: {}", new_owner);

    // Note: Actual Bubblegum transfer CPI call would be here
    // In production, you would call:
    // mpl_bubblegum::cpi::transfer(...)
    
    // The transfer would update the Merkle tree leaf with the new owner
    // and emit an event for indexers to track the ownership change

    // Emit transfer event
    emit!(TransferEvent {
        from: current_owner.key(),
        to: new_owner,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct TransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub timestamp: i64,
}
