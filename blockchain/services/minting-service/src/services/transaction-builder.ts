/**
 * Transaction Builder
 * Builds and manages Solana transactions for memory minting
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  ConfirmOptions,
} from '@solana/web3.js';
import { ITransactionBuilder } from '../interfaces';
import { ServiceConfig, TransactionBuilderOptions, SolanaTransactionResult } from '../types';
import { logger } from '../utils/logger';
import { MintingError, MintingErrorCode } from '../utils/errors';

/**
 * Transaction Builder Implementation
 */
export class TransactionBuilder implements ITransactionBuilder {
  private connection: Connection;
  private programId: PublicKey;
  private payerKeypair: Keypair;
  private defaultPriorityFee: number;
  private maxPriorityFee: number;

  constructor(private config: ServiceConfig) {
    // Initialize Solana connection
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.programId = new PublicKey(config.solana.programId);
    
    // Initialize payer keypair from private key
    const privateKeyArray = this.parsePrivateKey(config.solana.walletPrivateKey);
    this.payerKeypair = Keypair.fromSecretKey(privateKeyArray);

    this.defaultPriorityFee = config.cost.defaultPriorityFee;
    this.maxPriorityFee = config.cost.maxPriorityFee;

    logger.info('Transaction Builder initialized', {
      rpcUrl: config.solana.rpcUrl,
      network: config.solana.network,
      programId: this.programId.toBase58(),
      payer: this.payerKeypair.publicKey.toBase58(),
    });
  }

  /**
   * Build mint transaction
   */
  async buildMintTransaction(
    walletAddress: string,
    arweaveId: string,
    metadata: any,
    options?: TransactionBuilderOptions
  ): Promise<Transaction> {
    try {
      logger.debug('Building mint transaction', {
        walletAddress,
        arweaveId,
      });

      const owner = new PublicKey(walletAddress);
      const transaction = new Transaction();

      // Add compute budget instructions
      const priorityFee = options?.priorityFee || this.defaultPriorityFee;
      const computeUnitLimit = options?.computeUnitLimit || 200000;

      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: computeUnitLimit,
        })
      );

      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee,
        })
      );

      // Build mint instruction
      const mintInstruction = await this.buildMintInstruction(
        owner,
        arweaveId,
        metadata
      );

      transaction.add(mintInstruction);

      // Set recent blockhash
      const { blockhash } = options?.recentBlockhash
        ? { blockhash: options.recentBlockhash }
        : await this.connection.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.payerKeypair.publicKey;

      logger.debug('Mint transaction built', {
        walletAddress,
        instructionCount: transaction.instructions.length,
      });

      return transaction;
    } catch (error: any) {
      logger.error('Failed to build mint transaction', {
        walletAddress,
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.TRANSACTION_BUILD_FAILED,
        `Failed to build mint transaction: ${error.message}`,
        { walletAddress, error },
        false
      );
    }
  }

  /**
   * Build batch mint transaction
   */
  async buildBatchMintTransaction(
    walletAddress: string,
    items: Array<{ arweaveId: string; metadata: any }>,
    options?: TransactionBuilderOptions
  ): Promise<Transaction> {
    try {
      logger.debug('Building batch mint transaction', {
        walletAddress,
        itemCount: items.length,
      });

      const owner = new PublicKey(walletAddress);
      const transaction = new Transaction();

      // Add compute budget instructions
      const priorityFee = options?.priorityFee || this.defaultPriorityFee;
      const computeUnitLimit = options?.computeUnitLimit || 400000; // Higher limit for batch

      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: computeUnitLimit,
        })
      );

      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee,
        })
      );

      // Build mint instructions for each item
      for (const item of items) {
        const mintInstruction = await this.buildMintInstruction(
          owner,
          item.arweaveId,
          item.metadata
        );
        transaction.add(mintInstruction);
      }

      // Set recent blockhash
      const { blockhash } = options?.recentBlockhash
        ? { blockhash: options.recentBlockhash }
        : await this.connection.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.payerKeypair.publicKey;

      logger.debug('Batch mint transaction built', {
        walletAddress,
        itemCount: items.length,
        instructionCount: transaction.instructions.length,
      });

      return transaction;
    } catch (error: any) {
      logger.error('Failed to build batch mint transaction', {
        walletAddress,
        itemCount: items.length,
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.TRANSACTION_BUILD_FAILED,
        `Failed to build batch mint transaction: ${error.message}`,
        { walletAddress, itemCount: items.length, error },
        false
      );
    }
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      logger.debug('Signing transaction');

      // Sign with payer keypair
      transaction.sign(this.payerKeypair);

      logger.debug('Transaction signed', {
        signature: transaction.signature?.toString('base64').substring(0, 20) + '...',
      });

      return transaction;
    } catch (error: any) {
      logger.error('Failed to sign transaction', {
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.TRANSACTION_SIGN_FAILED,
        `Failed to sign transaction: ${error.message}`,
        { error },
        false
      );
    }
  }

  /**
   * Send and confirm transaction
   */
  async sendAndConfirmTransaction(transaction: Transaction): Promise<string> {
    try {
      logger.debug('Sending transaction');

      const confirmOptions: ConfirmOptions = {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      };

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.payerKeypair],
        confirmOptions
      );

      logger.info('Transaction confirmed', {
        signature,
      });

      return signature;
    } catch (error: any) {
      logger.error('Failed to send and confirm transaction', {
        error: error.message,
      });
      throw new MintingError(
        MintingErrorCode.TRANSACTION_FAILED,
        `Failed to send and confirm transaction: ${error.message}`,
        { error },
        true // Retryable
      );
    }
  }

  /**
   * Calculate priority fee
   */
  async calculatePriorityFee(priority: 'low' | 'medium' | 'high'): Promise<number> {
    try {
      // Get recent priority fees from the network
      const recentFees = await this.getRecentPriorityFees();

      // Calculate fee based on priority level
      let fee: number;
      switch (priority) {
        case 'low':
          fee = Math.min(recentFees.min, this.defaultPriorityFee);
          break;
        case 'medium':
          fee = recentFees.median;
          break;
        case 'high':
          fee = Math.min(recentFees.p75, this.maxPriorityFee);
          break;
        default:
          fee = this.defaultPriorityFee;
      }

      logger.debug('Calculated priority fee', {
        priority,
        fee,
        recentFees,
      });

      return fee;
    } catch (error: any) {
      logger.warn('Failed to calculate priority fee, using default', {
        error: error.message,
      });
      return this.defaultPriorityFee;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<SolanaTransactionResult> {
    try {
      const status = await this.connection.getSignatureStatus(signature);

      if (!status.value) {
        throw new Error('Transaction not found');
      }

      return {
        signature,
        slot: status.value.slot,
        confirmationStatus: status.value.confirmationStatus || 'processed',
        err: status.value.err,
      };
    } catch (error: any) {
      logger.error('Failed to get transaction status', {
        signature,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const message = transaction.compileMessage();
      const fee = await this.connection.getFeeForMessage(message);

      if (fee.value === null) {
        throw new Error('Failed to estimate fee');
      }

      return fee.value;
    } catch (error: any) {
      logger.warn('Failed to estimate transaction fee', {
        error: error.message,
      });
      // Return default estimate
      return 5000; // 5000 lamports
    }
  }

  /**
   * Build mint instruction
   */
  private async buildMintInstruction(
    owner: PublicKey,
    arweaveId: string,
    metadata: any
  ): Promise<TransactionInstruction> {
    try {
      // Derive PDA for user account
      const [userAccountPda] = await PublicKey.findProgramAddress(
        [Buffer.from('user'), owner.toBuffer()],
        this.programId
      );

      // Derive PDA for memory asset
      const [memoryAssetPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('memory'),
          owner.toBuffer(),
          Buffer.from(arweaveId.substring(0, 32)),
        ],
        this.programId
      );

      // Serialize metadata
      const metadataBuffer = Buffer.from(JSON.stringify(metadata));

      // Build instruction data
      // Format: [instruction_discriminator(8), arweave_id_len(4), arweave_id, metadata_len(4), metadata]
      const instructionData = Buffer.concat([
        Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]), // mint_memory discriminator
        this.serializeString(arweaveId),
        this.serializeBytes(metadataBuffer),
      ]);

      // Build instruction
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: owner, isSigner: true, isWritable: true },
          { pubkey: userAccountPda, isSigner: false, isWritable: true },
          { pubkey: memoryAssetPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: this.programId,
        data: instructionData,
      });

      return instruction;
    } catch (error: any) {
      throw new Error(`Failed to build mint instruction: ${error.message}`);
    }
  }

  /**
   * Get recent priority fees
   */
  private async getRecentPriorityFees(): Promise<{
    min: number;
    median: number;
    p75: number;
    max: number;
  }> {
    try {
      // Get recent prioritization fees
      // This is a simplified implementation
      // In production, you would query actual network fees

      const recentSlots = await this.connection.getRecentPerformanceSamples(10);
      
      if (recentSlots.length === 0) {
        return {
          min: 1000,
          median: 5000,
          p75: 10000,
          max: 50000,
        };
      }

      // Calculate average fees (simplified)
      const avgFee = 5000; // Placeholder

      return {
        min: avgFee * 0.5,
        median: avgFee,
        p75: avgFee * 1.5,
        max: avgFee * 3,
      };
    } catch (error: any) {
      logger.warn('Failed to get recent priority fees', {
        error: error.message,
      });
      return {
        min: 1000,
        median: 5000,
        p75: 10000,
        max: 50000,
      };
    }
  }

  /**
   * Parse private key
   */
  private parsePrivateKey(privateKey: string): Uint8Array {
    try {
      // Support multiple formats
      if (privateKey.startsWith('[')) {
        // JSON array format
        return new Uint8Array(JSON.parse(privateKey));
      } else if (privateKey.length === 128) {
        // Hex format
        return new Uint8Array(
          privateKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );
      } else {
        // Base58 format (default Solana format)
        // Note: You would need to add bs58 library for this
        throw new Error('Base58 format not yet supported, use JSON array or hex');
      }
    } catch (error: any) {
      throw new Error(`Failed to parse private key: ${error.message}`);
    }
  }

  /**
   * Serialize string for instruction data
   */
  private serializeString(str: string): Buffer {
    const strBuffer = Buffer.from(str, 'utf-8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(strBuffer.length, 0);
    return Buffer.concat([lengthBuffer, strBuffer]);
  }

  /**
   * Serialize bytes for instruction data
   */
  private serializeBytes(bytes: Buffer): Buffer {
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(bytes.length, 0);
    return Buffer.concat([lengthBuffer, bytes]);
  }

  /**
   * Get connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get program ID
   */
  getProgramId(): PublicKey {
    return this.programId;
  }

  /**
   * Get payer public key
   */
  getPayerPublicKey(): PublicKey {
    return this.payerKeypair.publicKey;
  }

  /**
   * Check connection health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      logger.debug('Solana connection healthy', { version });
      return true;
    } catch (error: any) {
      logger.error('Solana connection unhealthy', {
        error: error.message,
      });
      return false;
    }
  }
}
