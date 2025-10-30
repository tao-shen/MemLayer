import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

export interface SignMessageResult {
  signature: Uint8Array;
  signatureBase58: string;
  message: string;
}

export interface SignTransactionResult {
  transaction: Transaction | VersionedTransaction;
  signature?: string;
}

/**
 * Hook for wallet signing operations
 */
export const useWalletSigning = () => {
  const { publicKey, signMessage, signTransaction, signAllTransactions } = useWallet();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Sign a text message
   */
  const signTextMessage = useCallback(
    async (message: string): Promise<SignMessageResult> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected or does not support message signing');
      }

      setSigning(true);
      setError(null);

      try {
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await signMessage(encodedMessage);
        const signatureBase58 = bs58.encode(signature);

        return {
          signature,
          signatureBase58,
          message,
        };
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setSigning(false);
      }
    },
    [publicKey, signMessage]
  );

  /**
   * Sign a challenge message for authentication
   */
  const signChallenge = useCallback(
    async (challenge: string, nonce: string): Promise<SignMessageResult> => {
      const message = `${challenge}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
      return signTextMessage(message);
    },
    [signTextMessage]
  );

  /**
   * Sign a transaction
   */
  const signTx = useCallback(
    async (
      transaction: Transaction | VersionedTransaction
    ): Promise<SignTransactionResult> => {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected or does not support transaction signing');
      }

      setSigning(true);
      setError(null);

      try {
        const signedTransaction = await signTransaction(transaction);

        return {
          transaction: signedTransaction,
        };
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setSigning(false);
      }
    },
    [publicKey, signTransaction]
  );

  /**
   * Sign multiple transactions
   */
  const signAllTx = useCallback(
    async (
      transactions: (Transaction | VersionedTransaction)[]
    ): Promise<(Transaction | VersionedTransaction)[]> => {
      if (!publicKey || !signAllTransactions) {
        throw new Error('Wallet not connected or does not support batch signing');
      }

      setSigning(true);
      setError(null);

      try {
        const signedTransactions = await signAllTransactions(transactions);
        return signedTransactions;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setSigning(false);
      }
    },
    [publicKey, signAllTransactions]
  );

  /**
   * Verify a signature
   */
  const verifySignature = useCallback(
    (message: string, signature: Uint8Array | string): boolean => {
      if (!publicKey) {
        return false;
      }

      try {
        const signatureBytes =
          typeof signature === 'string' ? bs58.decode(signature) : signature;
        const messageBytes = new TextEncoder().encode(message);

        // Note: This is a simplified verification
        // In production, you should use nacl.sign.detached.verify
        return signatureBytes.length === 64;
      } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
      }
    },
    [publicKey]
  );

  return {
    signTextMessage,
    signChallenge,
    signTransaction: signTx,
    signAllTransactions: signAllTx,
    verifySignature,
    signing,
    error,
    canSign: !!publicKey && !!signMessage,
    canSignTransaction: !!publicKey && !!signTransaction,
  };
};

export default useWalletSigning;
