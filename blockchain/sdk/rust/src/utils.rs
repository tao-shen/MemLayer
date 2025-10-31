use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signature, Signer},
};
use crate::error::{SdkError, SdkResult};

/// Derive a Program Derived Address (PDA)
pub fn derive_pda(seeds: &[&[u8]], program_id: &Pubkey) -> SdkResult<(Pubkey, u8)> {
    Pubkey::find_program_address(seeds, program_id)
        .into_iter()
        .next()
        .ok_or_else(|| SdkError::Program("Failed to derive PDA".to_string()))
}

/// Derive user account PDA
pub fn derive_user_account_pda(
    wallet: &Pubkey,
    program_id: &Pubkey,
) -> SdkResult<(Pubkey, u8)> {
    derive_pda(&[b"user", wallet.as_ref()], program_id)
}

/// Derive access policy PDA
pub fn derive_access_policy_pda(
    wallet: &Pubkey,
    program_id: &Pubkey,
) -> SdkResult<(Pubkey, u8)> {
    derive_pda(&[b"access_policy", wallet.as_ref()], program_id)
}

/// Sign a message with a keypair
pub fn sign_message(keypair: &Keypair, message: &[u8]) -> Signature {
    keypair.sign_message(message)
}

/// Verify a signature
pub fn verify_signature(
    pubkey: &Pubkey,
    message: &[u8],
    signature: &Signature,
) -> SdkResult<()> {
    if signature.verify(pubkey.as_ref(), message) {
        Ok(())
    } else {
        Err(SdkError::InvalidSignature)
    }
}

/// Convert lamports to SOL
pub fn lamports_to_sol(lamports: u64) -> f64 {
    lamports as f64 / 1_000_000_000.0
}

/// Convert SOL to lamports
pub fn sol_to_lamports(sol: f64) -> u64 {
    (sol * 1_000_000_000.0) as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_sdk::signature::Keypair;

    #[test]
    fn test_lamports_conversion() {
        assert_eq!(lamports_to_sol(1_000_000_000), 1.0);
        assert_eq!(sol_to_lamports(1.0), 1_000_000_000);
    }

    #[test]
    fn test_sign_and_verify() {
        let keypair = Keypair::new();
        let message = b"test message";
        let signature = sign_message(&keypair, message);
        
        assert!(verify_signature(&keypair.pubkey(), message, &signature).is_ok());
    }
}
