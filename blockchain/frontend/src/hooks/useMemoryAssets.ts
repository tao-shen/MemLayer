import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface MemoryAsset {
  assetId: string;
  owner: string;
  arweaveId: string;
  version: number;
  batchId?: string;
  contentHash: string;
  encryptionKeyId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface AssetFilter {
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Hook for managing memory assets
 */
export const useMemoryAssets = (apiEndpoint: string = '/api/v1/blockchain') => {
  const { publicKey, signMessage } = useWallet();
  
  const [assets, setAssets] = useState<MemoryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch user's memory assets
   */
  const fetchAssets = useCallback(
    async (filters?: AssetFilter): Promise<MemoryAsset[]> => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters?.agentId) params.append('agentId', filters.agentId);
        if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
        if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const response = await fetch(
          `${apiEndpoint}/memories?walletAddress=${publicKey.toBase58()}&${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }

        const data = await response.json();
        setAssets(data.memories);
        return data.memories;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, apiEndpoint]
  );

  /**
   * Get a specific asset by ID
   */
  const getAsset = useCallback(
    async (assetId: string): Promise<MemoryAsset> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}/memories/${assetId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch asset');
        }

        return await response.json();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint]
  );

  /**
   * Transfer asset to another wallet
   */
  const transferAsset = useCallback(
    async (assetId: string, toAddress: string): Promise<void> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        // Sign transfer message
        const message = `Transfer asset ${assetId} to ${toAddress}\nTimestamp: ${Date.now()}`;
        const signature = await signMessage(new TextEncoder().encode(message));
        const signatureBase58 = Buffer.from(signature).toString('base64');

        const response = await fetch(`${apiEndpoint}/memories/${assetId}/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': publicKey.toBase58(),
            'X-Wallet-Signature': signatureBase58,
          },
          body: JSON.stringify({ toAddress }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to transfer asset');
        }

        // Refresh assets list
        await fetchAssets();
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, signMessage, apiEndpoint, fetchAssets]
  );

  /**
   * Grant access to an asset
   */
  const grantAccess = useCallback(
    async (
      assetId: string,
      granteeAddress: string,
      permissions: string[],
      expiresAt?: Date,
      maxAccess?: number
    ): Promise<void> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        // Sign grant message
        const message = `Grant access to ${assetId} for ${granteeAddress}\nTimestamp: ${Date.now()}`;
        const signature = await signMessage(new TextEncoder().encode(message));
        const signatureBase58 = Buffer.from(signature).toString('base64');

        const response = await fetch(`${apiEndpoint}/memories/${assetId}/grant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': publicKey.toBase58(),
            'X-Wallet-Signature': signatureBase58,
          },
          body: JSON.stringify({
            granteeAddress,
            permissions,
            expiresAt: expiresAt?.toISOString(),
            maxAccess,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to grant access');
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, signMessage, apiEndpoint]
  );

  /**
   * Revoke access to an asset
   */
  const revokeAccess = useCallback(
    async (assetId: string, granteeAddress: string): Promise<void> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        // Sign revoke message
        const message = `Revoke access to ${assetId} for ${granteeAddress}\nTimestamp: ${Date.now()}`;
        const signature = await signMessage(new TextEncoder().encode(message));
        const signatureBase58 = Buffer.from(signature).toString('base64');

        const response = await fetch(`${apiEndpoint}/memories/${assetId}/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': publicKey.toBase58(),
            'X-Wallet-Signature': signatureBase58,
          },
          body: JSON.stringify({ granteeAddress }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to revoke access');
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, signMessage, apiEndpoint]
  );

  // Auto-fetch assets when wallet connects
  useEffect(() => {
    if (publicKey) {
      fetchAssets().catch(console.error);
    }
  }, [publicKey, fetchAssets]);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    getAsset,
    transferAsset,
    grantAccess,
    revokeAccess,
    canManage: !!publicKey && !!signMessage,
  };
};

export default useMemoryAssets;
