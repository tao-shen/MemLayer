import apiClient from './client';
import type { MemoryAsset, ApiResponse, PaginatedResponse } from '@/types';

export interface MintMemoryRequest {
  agentId: string;
  memoryId: string;
  walletAddress: string;
  signature: string;
}

export interface MintMemoryResponse {
  batchId: string;
  estimatedTime: number;
  estimatedCost: number;
}

export interface MintingStatusResponse {
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  assetsCompleted: number;
  assetsTotal: number;
  transactionSignatures: string[];
  error?: string;
}

export interface GetAssetsParams {
  agentId?: string;
  owner?: string;
  limit?: number;
  offset?: number;
}

export interface AssetDetailsResponse {
  asset: MemoryAsset;
  memory: any;
  accessPolicy: any;
  transferHistory: any[];
}

export interface TransferAssetRequest {
  recipient: string;
  signature: string;
}

export const blockchainApi = {
  // Mint memory as NFT
  async mintMemory(request: MintMemoryRequest): Promise<MintMemoryResponse> {
    const response = await apiClient.post<ApiResponse<MintMemoryResponse>>(
      '/v1/blockchain/mint',
      request
    );
    return response.data.data;
  },

  // Get minting status
  async getMintingStatus(batchId: string): Promise<MintingStatusResponse> {
    const response = await apiClient.get<ApiResponse<MintingStatusResponse>>(
      `/v1/blockchain/mint/${batchId}/status`
    );
    return response.data.data;
  },

  // Get assets
  async getAssets(params?: GetAssetsParams): Promise<PaginatedResponse<MemoryAsset>> {
    const response = await apiClient.get<PaginatedResponse<MemoryAsset>>(
      '/v1/blockchain/assets',
      { params }
    );
    return response.data;
  },

  // Get asset details
  async getAssetDetails(assetAddress: string): Promise<AssetDetailsResponse> {
    const response = await apiClient.get<ApiResponse<AssetDetailsResponse>>(
      `/v1/blockchain/assets/${assetAddress}`
    );
    return response.data.data;
  },

  // Transfer asset
  async transferAsset(assetAddress: string, request: TransferAssetRequest): Promise<void> {
    await apiClient.post(`/v1/blockchain/assets/${assetAddress}/transfer`, request);
  },
};
