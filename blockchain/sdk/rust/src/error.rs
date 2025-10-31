use thiserror::Error;

pub type SdkResult<T> = Result<T, SdkError>;

#[derive(Error, Debug)]
pub enum SdkError {
    #[error("Solana client error: {0}")]
    SolanaClient(#[from] solana_client::client_error::ClientError),

    #[error("Anchor error: {0}")]
    Anchor(#[from] anchor_client::ClientError),

    #[error("Program error: {0}")]
    Program(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("HTTP request error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Insufficient funds")]
    InsufficientFunds,

    #[error("Access denied")]
    AccessDenied,

    #[error("Asset not found: {0}")]
    AssetNotFound(String),

    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),

    #[error("Transaction failed: {0}")]
    TransactionFailed(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}
