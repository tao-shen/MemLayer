use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = owner,
        space = UserAccount::LEN,
        seeds = [USER_ACCOUNT_SEED, owner.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        init,
        payer = owner,
        space = AccessPolicyAccount::LEN,
        seeds = [ACCESS_POLICY_SEED, owner.key().as_ref()],
        bump
    )]
    pub access_policy: Account<'info, AccessPolicyAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeUser>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    let access_policy = &mut ctx.accounts.access_policy;
    let owner = &ctx.accounts.owner;
    let clock = Clock::get()?;

    // Initialize user account
    user_account.owner = owner.key();
    user_account.access_policy_version = 1;
    user_account.memory_count = 0;
    user_account.total_storage_bytes = 0;
    user_account.created_at = clock.unix_timestamp;
    user_account.bump = ctx.bumps.user_account;

    // Initialize access policy with default deny
    access_policy.owner = owner.key();
    access_policy.grants = Vec::new();
    access_policy.default_policy = PolicyType::Deny;
    access_policy.updated_at = clock.unix_timestamp;
    access_policy.bump = ctx.bumps.access_policy;

    msg!("User account initialized for: {}", owner.key());
    msg!("Memory count: {}", user_account.memory_count);
    msg!("Access policy version: {}", user_account.access_policy_version);

    Ok(())
}
