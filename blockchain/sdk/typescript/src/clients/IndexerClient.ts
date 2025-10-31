import axios, { AxiosInstance } from 'axios';
import {
  SDKConfig,
  MemoryAsset,
  TransferRecord,
  BatchInfo,
} from '../types';

export interface QueryFilter {
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class IndexerClient {
  private api: AxiosInstance;

  constructor(config: SDKConfig) {
    this.api = axios.create({
      baseURL: config.apiEndpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get user's memory assets
   */
  async getUserMemories(
    walletAddress: string,
    filters?: QueryFilter
  ): Promise<MemoryAsset[]> {
    const params = new URLSearchParams();
    params.append('walletAddress', walletAddress);

    if (filters?.agentId) params.append('agentId', filters.agentId);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await this.api.get(`/memories?${params.toString()}`);
    return response.data.memories;
  }

  /**
   * Get a specific memory asset
   */
  async getMemoryAsset(assetId: string): Promise<MemoryAsset> {
    const response = await this.api.get(`/memories/${assetId}`);
    return response.data;
  }

  /**
   * Get transfer history for an asset
   */
  async getTransferHistory(assetId: string): Promise<TransferRecord[]> {
    const response = await this.api.get(`/memories/${assetId}/transfers`);
    return response.data.transfers;
  }

  /**
   * Get user's transfer history
   */
  async getUserTransfers(
    walletAddress: string,
    filters?: QueryFilter
  ): Promise<TransferRecord[]> {
    const params = new URLSearchParams();
    params.append('walletAddress', walletAddress);

    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await this.api.get(`/transfers?${params.toString()}`);
    return response.data.transfers;
  }

  /**
   * Get batch information
   */
  async getBatchInfo(batchId: string): Promise<BatchInfo> {
    const response = await this.api.get(`/batches/${batchId}`);
    return response.data;
  }

  /**
   * Get user's batch history
   */
  async getUserBatches(
    walletAddress: string,
    filters?: QueryFilter
  ): Promise<BatchInfo[]> {
    const params = new URLSearchParams();
    params.append('walletAddress', walletAddress);

    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await this.api.get(`/batches?${params.toString()}`);
    return response.data.batches;
  }

  /**
   * Get memories in a batch
   */
  async getBatchMemories(batchId: string): Promise<MemoryAsset[]> {
    const response = await this.api.get(`/batches/${batchId}/memories`);
    return response.data.memories;
  }

  /**
   * Search memories by content hash
   */
  async searchByContentHash(contentHash: string): Promise<MemoryAsset[]> {
    const response = await this.api.get(`/memories/search?contentHash=${contentHash}`);
    return response.data.memories;
  }

  /**
   * Get user statistics
   */
  async getUserStats(walletAddress: string): Promise<{
    totalMemories: number;
    totalBatches: number;
    totalTransfers: number;
    totalGrantsGiven: number;
    totalGrantsReceived: number;
  }> {
    const response = await this.api.get(`/users/${walletAddress}/stats`);
    return response.data.stats;
  }
}

export default IndexerClient;
