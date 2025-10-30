import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import { ErrorHandler, ArweaveError, ArweaveErrorCode, withRetry } from './error-handler';

/**
 * Arweave Client Configuration
 */
export interface ArweaveConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  timeout: number;
  logging: boolean;
  walletPath?: string;
}

/**
 * Arweave Client
 * Manages connection to Arweave network
 */
export class ArweaveClient {
  private arweave: Arweave;
  private wallet: JWKInterface | null = null;
  private walletAddress: string | null = null;
  private errorHandler: ErrorHandler;

  constructor(private config: ArweaveConfig) {
    this.arweave = Arweave.init({
      host: config.host,
      port: config.port,
      protocol: config.protocol,
      timeout: config.timeout,
      logging: config.logging,
    });
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Initialize client and load wallet
   */
  async initialize(): Promise<void> {
    if (this.config.walletPath) {
      await this.loadWallet(this.config.walletPath);
    }
    console.log('Arweave client initialized');
  }

  /**
   * Load wallet from file
   */
  async loadWallet(walletPath: string): Promise<void> {
    try {
      const walletData = fs.readFileSync(walletPath, 'utf8');
      this.wallet = JSON.parse(walletData);
      this.walletAddress = await this.arweave.wallets.jwkToAddress(this.wallet);
      console.log(`Wallet loaded: ${this.walletAddress}`);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'loadWallet');
    }
  }

  /**
   * Get wallet balance in AR
   */
  async getBalance(address?: string): Promise<string> {
    const addr = address || this.walletAddress;
    if (!addr) {
      throw new ArweaveError(
        ArweaveErrorCode.WALLET_NOT_LOADED,
        'No wallet address available',
        {},
        false
      );
    }

    try {
      const winston = await this.arweave.wallets.getBalance(addr);
      const ar = this.arweave.ar.winstonToAr(winston);
      return ar;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'getBalance');
    }
  }

  /**
   * Get current network info
   */
  async getNetworkInfo(): Promise<any> {
    try {
      return await this.arweave.network.getInfo();
    } catch (error) {
      throw this.errorHandler.handleError(error, 'getNetworkInfo');
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<TransactionStatus> {
    try {
      const status = await this.arweave.transactions.getStatus(txId);
      
      return {
        txId,
        confirmed: status.confirmed,
        blockHeight: status.confirmed?.block_height,
        blockIndepHash: status.confirmed?.block_indep_hash,
        numberOfConfirmations: status.confirmed?.number_of_confirmations,
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'getTransactionStatus');
    }
  }

  /**
   * Get transaction data
   */
  async getTransaction(txId: string): Promise<any> {
    try {
      return await this.arweave.transactions.get(txId);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'getTransaction');
    }
  }

  /**
   * Get transaction data as buffer
   */
  async getTransactionData(txId: string): Promise<Buffer> {
    try {
      const tx = await this.arweave.transactions.get(txId);
      const data = tx.get('data', { decode: true, string: false });
      return Buffer.from(data);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'getTransactionData');
    }
  }

  /**
   * Create transaction
   */
  async createTransaction(data: Buffer, tags: ArweaveTag[]): Promise<any> {
    if (!this.wallet) {
      throw new ArweaveError(
        ArweaveErrorCode.WALLET_NOT_LOADED,
        'Wallet not loaded',
        {},
        false
      );
    }

    try {
      const transaction = await this.arweave.createTransaction({
        data: data,
      }, this.wallet);

      // Add tags
      for (const tag of tags) {
        transaction.addTag(tag.name, tag.value);
      }

      return transaction;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'createTransaction');
    }
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction: any): Promise<void> {
    if (!this.wallet) {
      throw new ArweaveError(
        ArweaveErrorCode.WALLET_NOT_LOADED,
        'Wallet not loaded',
        {},
        false
      );
    }

    try {
      await this.arweave.transactions.sign(transaction, this.wallet);
    } catch (error) {
      throw this.errorHandler.handleError(error, 'signTransaction');
    }
  }

  /**
   * Post transaction
   */
  async postTransaction(transaction: any): Promise<PostResult> {
    try {
      const response = await this.arweave.transactions.post(transaction);
      
      return {
        txId: transaction.id,
        status: response.status,
        statusText: response.statusText,
        success: response.status === 200,
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'postTransaction');
    }
  }

  /**
   * Estimate transaction cost
   */
  async estimateCost(dataSize: number): Promise<CostEstimate> {
    try {
      const price = await this.arweave.transactions.getPrice(dataSize);
      const ar = this.arweave.ar.winstonToAr(price);
      
      return {
        winston: price,
        ar: ar,
        dataSize: dataSize,
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'estimateCost');
    }
  }

  /**
   * Get Arweave instance
   */
  getArweave(): Arweave {
    return this.arweave;
  }

  /**
   * Get wallet
   */
  getWallet(): JWKInterface | null {
    return this.wallet;
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Check if wallet is loaded
   */
  hasWallet(): boolean {
    return this.wallet !== null;
  }

  /**
   * Get error handler
   */
  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }
}

/**
 * Arweave tag interface
 */
export interface ArweaveTag {
  name: string;
  value: string;
}

/**
 * Transaction status
 */
export interface TransactionStatus {
  txId: string;
  confirmed: boolean | any;
  blockHeight?: number;
  blockIndepHash?: string;
  numberOfConfirmations?: number;
}

/**
 * Post result
 */
export interface PostResult {
  txId: string;
  status: number;
  statusText: string;
  success: boolean;
}

/**
 * Cost estimate
 */
export interface CostEstimate {
  winston: string;
  ar: string;
  dataSize: number;
}
