import React, { FC } from 'react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { useWalletSigning } from '../hooks/useWalletSigning';

export interface SignTransactionButtonProps {
  transaction: Transaction | VersionedTransaction;
  onSuccess?: (transaction: Transaction | VersionedTransaction) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component for signing transactions
 */
export const SignTransactionButton: FC<SignTransactionButtonProps> = ({
  transaction,
  onSuccess,
  onError,
  className = '',
  children = 'Sign Transaction',
}) => {
  const { signTransaction, signing, canSignTransaction } = useWalletSigning();

  const handleSign = async () => {
    try {
      const result = await signTransaction(transaction);
      onSuccess?.(result.transaction);
    } catch (error) {
      console.error('Error signing transaction:', error);
      onError?.(error as Error);
    }
  };

  if (!canSignTransaction) {
    return (
      <button disabled className={`sign-transaction-button disabled ${className}`}>
        Connect Wallet to Sign
      </button>
    );
  }

  return (
    <button
      onClick={handleSign}
      disabled={signing}
      className={`sign-transaction-button ${signing ? 'signing' : ''} ${className}`}
    >
      {signing ? 'Signing...' : children}
    </button>
  );
};

export default SignTransactionButton;
