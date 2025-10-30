use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::MemoryAssetError;

#[derive(Accounts)]
pub struct UpdateAccessPolicy<'info> {
    #[account(
        mut,
        seeds = [ACCESS_POLICY_SEED, owner.key().as_ref()],
        bump = access_policy.bump,
        has_one = owner @ MemoryAssetError::InvalidOwner
    )]
    pub access_policy: Account<'info, AccessPolicyAccount>,

    #[account(
        mut,
        seeds = [USER_ACCOUNT_SEED, owner.key().as_ref()],
        bump = user_account.bump,
        has_one = owner @ MemoryAssetError::InvalidOwner
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateAccessPolicy>,
    grants: Vec<AccessGrant>,
    default_policy: PolicyType,
) -> Result<()> {
    let access_policy = &mut ctx.accounts.access_policy;
    let user_account = &mut ctx.accounts.user_account;
    let clock = Clock::get()?;

    // Validate number of grants
    require!(
        grants.len() <= MAX_ACCESS_GRANTS,
        MemoryAssetError::MaxAccessGrantsExceeded
    );

    // Validate each grant
    for grant in &grants {
        // Validate permissions bitmap (only bits 0-2 should be set)
        require!(
            grant.permissions & 0b11111000 == 0,
            MemoryAssetError::InvalidPermissions
        );

        // Validate expiration timestamp if present
        if let Some(expires_at) = grant.expires_at {
            require!(
                expires_at > clock.unix_timestamp,
                MemoryAssetError::InvalidTimestamp
            );
        }

        // Validate that grantee is not the owner
        require!(
            grant.grantee != ctx.accounts.owner.key(),
            MemoryAssetError::InvalidOwner
        );
    }

    // Update access policy
    access_policy.grants = grants.clone();
    access_policy.default_policy = default_policy;
    access_policy.updated_at = clock.unix_timestamp;

    // Increment policy version
    user_account.access_policy_version = user_account
        .access_policy_version
        .checked_add(1)
        .ok_or(MemoryAssetError::ArithmeticOverflow)?;

    msg!("Access policy updated");
    msg!("Owner: {}", ctx.accounts.owner.key());
    msg!("Number of grants: {}", grants.len());
    msg!("Default policy: {:?}", default_policy);
    msg!("Policy version: {}", user_account.access_policy_version);

    Ok(())
}

/// Helper function to check if a user has access
pub fn check_access(
    access_policy: &AccessPolicyAccount,
    requester: &Pubkey,
    required_permission: u8,
) -> Result<bool> {
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Owner always has access
    if requester == &access_policy.owner {
        return Ok(true);
    }

    // Check grants
    for grant in &access_policy.grants {
        if grant.grantee == *requester {
            // Check if grant is valid
            if !grant.is_valid(current_time) {
                if grant.is_expired(current_time) {
                    return err!(MemoryAssetError::AccessGrantExpired);
                } else {
                    return err!(MemoryAssetError::AccessGrantExhausted);
                }
            }

            // Check if grant has required permission
            if grant.permissions & required_permission != 0 {
                return Ok(true);
            }
        }
    }

    // Check default policy
    match access_policy.default_policy {
        PolicyType::Allow => Ok(true),
        PolicyType::Deny => err!(MemoryAssetError::AccessDenied),
    }
}
