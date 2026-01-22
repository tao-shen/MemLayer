use anchor_lang::prelude::*;

/// User account storing memory asset configuration and access policies
#[account]
pub struct UserAccount {
    /// Owner of this account
    pub owner: Pubkey,
    /// Version of the access policy
    pub access_policy_version: u32,
    /// Total number of memories minted
    pub memory_count: u64,
    /// Total storage bytes used
    pub total_storage_bytes: u64,
    /// Account creation timestamp
    pub created_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl UserAccount {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        4 +  // access_policy_version
        8 +  // memory_count
        8 +  // total_storage_bytes
        8 +  // created_at
        1;   // bump
}

/// Memory asset metadata stored in Merkle tree leaf
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct MemoryMetadata {
    /// Owner of the memory asset
    pub owner: Pubkey,
    /// Arweave transaction ID
    pub arweave_id: String,
    /// Version number
    pub version: u32,
    /// Optional batch ID
    pub batch_id: Option<String>,
    /// Creation timestamp
    pub created_at: i64,
    /// SHA-256 hash of the content
    pub content_hash: [u8; 32],
}

/// Access policy account for managing permissions
#[account]
pub struct AccessPolicyAccount {
    /// Owner of this policy
    pub owner: Pubkey,
    /// List of access grants
    pub grants: Vec<AccessGrant>,
    /// Default policy (deny or allow)
    pub default_policy: PolicyType,
    /// Last update timestamp
    pub updated_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl AccessPolicyAccount {
    pub const MAX_GRANTS: usize = 10;
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        4 + (AccessGrant::LEN * Self::MAX_GRANTS) + // grants vec
        1 +  // default_policy
        8 +  // updated_at
        1;   // bump
}

/// Access grant for a specific grantee
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct AccessGrant {
    /// Grantee's public key
    pub grantee: Pubkey,
    /// Permissions bitmap (read=1, write=2, transfer=4)
    pub permissions: u8,
    /// Optional expiration timestamp
    pub expires_at: Option<i64>,
    /// Optional maximum access count
    pub max_access: Option<u32>,
    /// Current access count
    pub current_access: u32,
}

impl AccessGrant {
    pub const LEN: usize = 32 + // grantee
        1 +  // permissions
        9 +  // expires_at (1 + 8)
        5 +  // max_access (1 + 4)
        4;   // current_access

    /// Check if grant has read permission
    pub fn can_read(&self) -> bool {
        self.permissions & 0b001 != 0
    }

    /// Check if grant has write permission
    pub fn can_write(&self) -> bool {
        self.permissions & 0b010 != 0
    }

    /// Check if grant has transfer permission
    pub fn can_transfer(&self) -> bool {
        self.permissions & 0b100 != 0
    }

    /// Check if grant is expired
    pub fn is_expired(&self, current_time: i64) -> bool {
        if let Some(expires_at) = self.expires_at {
            current_time > expires_at
        } else {
            false
        }
    }

    /// Check if grant has reached max access
    pub fn is_access_exhausted(&self) -> bool {
        if let Some(max_access) = self.max_access {
            self.current_access >= max_access
        } else {
            false
        }
    }

    /// Check if grant is valid
    pub fn is_valid(&self, current_time: i64) -> bool {
        !self.is_expired(current_time) && !self.is_access_exhausted()
    }
}

/// Policy type enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum PolicyType {
    Deny,
    Allow,
}

/// Memory version record
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct MemoryVersion {
    /// Version number
    pub version: u32,
    /// Arweave transaction ID
    pub arweave_id: String,
    /// Content hash
    pub content_hash: [u8; 32],
    /// Creation timestamp
    pub created_at: i64,
}
