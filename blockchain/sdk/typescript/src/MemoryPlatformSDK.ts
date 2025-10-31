import { MemoryMintingClient } from './clients/MemoryMintingClient';
import { AccessControlClient } from './clients/AccessControlClient';
import { IndexerClient } from './clients/IndexerClient';
import { SDKConfig, WalletAdapter } from './types';

/**
 * Main SDK class for Memory Platform Blockchain Integration
 */
export class MemoryPlatformSDK {
  public minting: MemoryMintingClient;
  public accessControl: AccessControlClient;
  public indexer: IndexerClient;

  private config: SDKConfig;
  private wallet: WalletAdapter;

  constructor(config: SDKConfig, wallet: WalletAdapter) {
    this.config = config;
    this.wallet = wallet;

    // Initialize clients
    this.minting = new MemoryMintingClient(config, wallet);
    this.accessControl = new AccessControlClient(config, wallet);
    this.indexer = new IndexerClient(config);
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.wallet.publicKey !== null;
  }

  /**
   * Get connected wallet address
   */
  getWalletAddress(): string | null {
    return this.wallet.publicKey?.toBase58() || null;
  }

  /**
   * Update wallet adapter
   */
  updateWallet(wallet: WalletAdapter): void {
    this.wallet = wallet;
    this.minting = new MemoryMintingClient(this.config, wallet);
    this.accessControl = new AccessControlClient(this.config, wallet);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SDKConfig>): void {
    this.config = { ...this.config, ...config };
    this.minting = new MemoryMintingClient(this.config, this.wallet);
    this.accessControl = new AccessControlClient(this.config, this.wallet);
    this.indexer = new IndexerClient(this.config);
  }
}

export default MemoryPlatformSDK;
