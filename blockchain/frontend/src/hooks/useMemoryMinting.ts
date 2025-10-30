import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

export interface MemoryInput {
  content: string;
  metadata?: Record<string, any>;
  agentId: string;
}

export interface MintOptions {
  priority?: 'low' | 'medium' | 'high';
  batch?: boolean;
}

export interface MintResult {
  assetId: string;
  arweaveId: string;
  transactionSignature: string;
  cost: number;
  timestamp: Date;
}

export interface CostEstimate {
  solanaCost: number;
  arweaveCost: number;
  totalCost: number;
  totalCostUSD?: number;
}

/**
 * Hook for minting memories to blockchain
 */
export const useMemoryMinting = (apiEndpoint: string = '/api/v1/blockchain') => {
  const { publicKey, signMessage } = useWallet();
  const { connection } = useConnection();
  
  const [minting, setMinting] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Estimate minting cost
   */
  const estimateCost = useCallback(
    async (memoryCount: number = 1): Promise<CostEstimate> => {
      setEstimating(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}/memories/estimate-cost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ memoryCount }),
        });

        if (!response.ok) {
          throw new Error('Failed to estimate cost');
        }

        const data = await response.json();
        return data.estimate;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setEstimating(false);
      }
    },
    [apiEndpoint]
  );

  /**
   * Mint a single memory
   */
  const mintMemory = useCallback(
    async (
      memory: MemoryInput,
      options?: MintOptions
    ): Promise<MintResult> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected');
      }

      setMinting(true);
      setError(null);

      try {
        // Sign authentication message
        const authMessage = `Mint memory\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
        const signature = await signMessage(new TextEncoder().encode(authMessage));
        const signatureBase58 = Buffer.from(signature).toString('base64');

        // Send mint request
        const response = await fetch(`${apiEndpoint}/memories/mint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': publicKey.toBase58(),
            'X-Wallet-Signature': signatureBase58,
          },
          body: JSON.stringify({
            memory,
            options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to mint memory');
        }

        const data = await response.json();
        return data.result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setMinting(false);
      }
    },
    [publicKey, signMessage, apiEndpoint]
  );

  /**
   * Mint multiple memories in a batch
   */
  const mintBatch = useCallback(
    async (
      memories: MemoryInput[],
      options?: MintOptions
    ): Promise<{
      batchId: string;
      assetIds: string[];
      totalCost: number;
      successCount: number;
      failedCount: number;
    }> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected');
      }

      setMinting(true);
      setError(null);

      try {
        // Sign authentication message
        const authMessage = `Mint batch\nWallet: ${publicKey.toBase58()}\nCount: ${memories.length}\nTimestamp: ${Date.now()}`;
        const signature = await signMessage(new TextEncoder().encode(authMessage));
        const signatureBase58 = Buffer.from(signature).toString('base64');

        // Send batch mint request
        const response = await fetch(`${apiEndpoint}/memories/mint-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': publicKey.toBase58(),
            'X-Wallet-Signature': signatureBase58,
          },
          body: JSON.stringify({
            memories,
            options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to mint batch');
        }

        const data = await response.json();
        return data.result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setMinting(false);
      }
    },
    [publicKey, signMessage, apiEndpoint]
  );

  /**
   * Get minting status
   */
  const getMintStatus = useCallback(
    async (requestId: string): Promise<any> => {
      try {
        const response = await fetch(`${apiEndpoint}/memories/status/${requestId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get mint status');
        }

        return await response.json();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      }
    },
    [apiEndpoint]
  );

  return {
    mintMemory,
    mintBatch,
    estimateCost,
    getMintStatus,
    minting,
    estimating,
    error,
    canMint: !!publicKey && !!signMessage,
  };
};

export default useMemoryMinting;
