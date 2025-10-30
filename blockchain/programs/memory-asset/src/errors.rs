use anchor_lang::prelude::*;

#[error_code]
pub enum MemoryAssetError {
    #[msg("Invalid Arweave transaction ID length")]
    InvalidArweaveIdLength,
    
    #[msg("Invalid metadata URI length")]
    InvalidMetadataUriLength,
    
    #[msg("Invalid batch ID length")]
    InvalidBatchIdLength,
    
    #[msg("Maximum number of access grants exceeded")]
    MaxAccessGrantsExceeded,
    
    #[msg("Access denied: insufficient permissions")]
    AccessDenied,
    
    #[msg("Access grant has expired")]
    AccessGrantExpired,
    
    #[msg("Access grant has reached maximum access count")]
    AccessGrantExhausted,
    
    #[msg("Invalid owner")]
    InvalidOwner,
    
    #[msg("Invalid content hash")]
    InvalidContentHash,
    
    #[msg("Memory asset not found")]
    MemoryAssetNotFound,
    
    #[msg("Version already exists")]
    VersionAlreadyExists,
    
    #[msg("Invalid version number")]
    InvalidVersion,
    
    #[msg("Unauthorized: only owner can perform this action")]
    Unauthorized,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid permissions bitmap")]
    InvalidPermissions,
}
