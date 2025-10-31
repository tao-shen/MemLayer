import axios, { AxiosInstance } from 'axios';
import {
  SDKConfig,
  WalletAdapter,
  MemoryInput,
  MintOptions,
  MintResult,
  BatchMintResult,
  CostEstimate,
} from '../types';

export class MemoryMintingClient {
  private api: AxiosInstance;
  private wallet: WalletAdapter;

  constructor(config: SDKConfig, wallet: WalletAdapter) {
    this.wallet = wallet;
    this.api = axios.create({
      baseURL: config.apiEndpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Sign a message with the connected wallet
   */
  private async signMessage(message: string): Promise<string> {
    if (!this.wallet.publicKey || !this.wallet.signMessage) {
      throw new Error('Wallet not connected or does not support message signing');
    }

    const encodedMessage = new TextEncoder().encode(message);
    const signature = await this.wallet.signMessage(encodedMessage);
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Get authentication headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const message = `Auth\nWallet: ${this.wallet.publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
    const signature = await this.signMessage(message);

    return {
      'X-Wallet-Address': this.wallet.publicKey.toBase58(),
      'X-Wallet-Signature': signature,
    };
  }

  /**
   * Estimate minting cost
   */
  async estimateCost(memoryCount: number = 1): Promise<CostEstimate> {
    const response = await this.api.post('/memories/estimate-cost', {
      memoryCount,
    });

    return response.data.estimate;
  }

  /**
   * Mint a single memory
   */
  async mintMemory(
    memory: MemoryInput,
    options?: MintOptions
  ): Promise<MintResult> {
    const headers = await this.getAuthHeaders();

    const response = await this.api.post(
      '/memories/mint',
      {
        memory,
        options,
      },
      { headers }
    );

    return response.data.result;
  }

  /**
   * Mint multiple memories in a batch
   */
  async mintBatch(
    memories: MemoryInput[],
    options?: MintOptions
  ): Promise<BatchMintResult> {
    const headers = await this.getAuthHeaders();

    const response = await this.api.post(
      '/memories/mint-batch',
      {
        memories,
        options,
      },
      { headers }
    );

    return response.data.result;
  }

  /**
   * Get minting status
   */
  async getMintStatus(requestId: string): Promise<any> {
    const response = await this.api.get(`/memories/status/${requestId}`);
    return response.data;
  }

  /**
   * Get batch details
   */
  async getBatchDetails(batchId: string): Promise<any> {
    const response = await this.api.get(`/batches/${batchId}`);
    return response.data;
  }
}

export default MemoryMintingClient;
