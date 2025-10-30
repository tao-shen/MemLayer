import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface TransferRecord {
  id: number;
  assetId: string;
  fromAddress: string;
  toAddress: string;
  transactionSignature: string;
  transferredAt: Date;
}

export interface BatchInfo {
  batchId: string;
  ownerAddress: string;
  memoryCount: number;
  totalSizeBytes: number;
  merkleTreeAddress: string;
  transactionSignature: string;
  totalCostLamports: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Hook for managing transaction history
 */
export const useTransactionHistory = (apiEndpoint: string = '/api/v1/blockchain') => {
  const { publicKey } = useWallet();
  
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch transfer history
   */
  const fetchTransfers = useCallback(
    async (assetId?: string, filters?: TransactionFilter): Promise<TransferRecord[]> => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        let url = `${apiEndpoint}/transfers?walletAddress=${publicKey.toBase58()}`;
        
        if (assetId) {
          url = `${apiEndpoint}/memories/${assetId}/transfers`;
        }

        if (filters) {
          const params = new URLSearchParams();
          if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
          if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
          if (filters.limit) params.append('limit', filters.limit.toString());
          if (filters.offset) params.append('offset', filters.offset.toString());
          url += `&${params.toString()}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch transfers');
        }

        const data = await response.json();
        setTransfers(data.transfers);
        return data.transfers;
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
   * Fetch batch history
   */
  const fetchBatches = useCallback(
    async (filters?: TransactionFilter): Promise<BatchInfo[]> => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('walletAddress', publicKey.toBase58());
        
        if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
        if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const response = await fetch(`${apiEndpoint}/batches?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch batches');
        }

        const data = await response.json();
        setBatches(data.batches);
        return data.batches;
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
   * Get batch details
   */
  const getBatchDetails = useCallback(
    async (batchId: string): Promise<BatchInfo> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}/batches/${batchId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch batch details');
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

  // Auto-fetch on wallet connect
  useEffect(() => {
    if (publicKey) {
      fetchTransfers().catch(console.error);
      fetchBatches().catch(console.error);
    }
  }, [publicKey, fetchTransfers, fetchBatches]);

  return {
    transfers,
    batches,
    loading,
    error,
    fetchTransfers,
    fetchBatches,
    getBatchDetails,
    canView: !!publicKey,
  };
};

export default useTransactionHistory;
