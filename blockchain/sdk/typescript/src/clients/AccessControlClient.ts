import axios, { AxiosInstance } from 'axios';
import {
  SDKConfig,
  WalletAdapter,
  AccessPolicy,
  AccessGrant,
} from '../types';

export class AccessControlClient {
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
   * Get access policy for an asset
   */
  async getAccessPolicy(assetId: string): Promise<AccessPolicy> {
    const response = await this.api.get(`/memories/${assetId}/access-policy`);
    return response.data.policy;
  }

  /**
   * Grant access to an asset
   */
  async grantAccess(
    assetId: string,
    granteeAddress: string,
    permissions: string[],
    expiresAt?: Date,
    maxAccess?: number
  ): Promise<void> {
    const headers = await this.getAuthHeaders();

    await this.api.post(
      `/memories/${assetId}/grant`,
      {
        granteeAddress,
        permissions,
        expiresAt: expiresAt?.toISOString(),
        maxAccess,
      },
      { headers }
    );
  }

  /**
   * Revoke access to an asset
   */
  async revokeAccess(
    assetId: string,
    granteeAddress: string
  ): Promise<void> {
    const headers = await this.getAuthHeaders();

    await this.api.post(
      `/memories/${assetId}/revoke`,
      {
        granteeAddress,
      },
      { headers }
    );
  }

  /**
   * Check if a wallet has access to an asset
   */
  async checkAccess(
    assetId: string,
    walletAddress: string
  ): Promise<boolean> {
    const response = await this.api.get(
      `/memories/${assetId}/check-access?walletAddress=${walletAddress}`
    );
    return response.data.hasAccess;
  }

  /**
   * Get all access grants for an asset
   */
  async getAccessGrants(assetId: string): Promise<AccessGrant[]> {
    const response = await this.api.get(`/memories/${assetId}/grants`);
    return response.data.grants;
  }

  /**
   * Update access policy
   */
  async updateAccessPolicy(
    assetId: string,
    policy: Partial<AccessPolicy>
  ): Promise<void> {
    const headers = await this.getAuthHeaders();

    await this.api.put(
      `/memories/${assetId}/access-policy`,
      policy,
      { headers }
    );
  }
}

export default AccessControlClient;
