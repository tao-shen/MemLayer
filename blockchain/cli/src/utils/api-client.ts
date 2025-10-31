import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../config';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    const config = getConfig();
    this.client = axios.create({
      baseURL: baseURL || config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async mintMemory(data: any) {
    const response = await this.client.post('/v1/blockchain/memories/mint', data);
    return response.data;
  }

  async mintBatch(data: any) {
    const response = await this.client.post('/v1/blockchain/memories/mint-batch', data);
    return response.data;
  }

  async getUserMemories(wallet: string, filters?: any) {
    const params = new URLSearchParams({ wallet, ...filters });
    const response = await this.client.get(`/v1/blockchain/memories?${params}`);
    return response.data;
  }

  async getMemoryAsset(assetId: string) {
    const response = await this.client.get(`/v1/blockchain/memories/${assetId}`);
    return response.data;
  }

  async grantAccess(assetId: string, data: any) {
    const response = await this.client.post(`/v1/blockchain/memories/${assetId}/grant`, data);
    return response.data;
  }

  async revokeAccess(assetId: string, data: any) {
    const response = await this.client.post(`/v1/blockchain/memories/${assetId}/revoke`, data);
    return response.data;
  }

  async transferMemory(assetId: string, data: any) {
    const response = await this.client.post(`/v1/blockchain/memories/${assetId}/transfer`, data);
    return response.data;
  }

  async getBatchInfo(batchId: string) {
    const response = await this.client.get(`/v1/blockchain/batches/${batchId}`);
    return response.data;
  }

  async estimateCost(count: number) {
    const response = await this.client.get(`/v1/blockchain/cost/estimate?count=${count}`);
    return response.data;
  }
}
