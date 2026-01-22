/// Program constants

/// Seed for user account PDA
pub const USER_ACCOUNT_SEED: &[u8] = b"user_account";

/// Seed for access policy account PDA
pub const ACCESS_POLICY_SEED: &[u8] = b"access_policy";

/// Maximum length for Arweave transaction ID
pub const MAX_ARWEAVE_ID_LEN: usize = 43;

/// Maximum length for metadata URI
pub const MAX_METADATA_URI_LEN: usize = 200;

/// Maximum length for batch ID
pub const MAX_BATCH_ID_LEN: usize = 64;

/// Maximum number of access grants per policy
pub const MAX_ACCESS_GRANTS: usize = 10;

/// Default memory asset version
pub const DEFAULT_VERSION: u32 = 1;
