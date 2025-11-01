/**
 * Minting Coordinator
 * Coordinates the full memory minting process: encryption -> upload -> mint
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { IMintingCoordinator } from '../interfaces';
import {
  MintRequest,
  MintResult,
  BatchMintRequest,
  BatchMintResult,
  MintStatus,
  CostBreakdown,
  ServiceConfig,
} from '../types';
import { logger, logMintOperation } from '../utils/logger';
import { MintingError, MintingErrorCode, createMintError } from '../utils/errors';

/**
 * Minting step
 */
type MintingStep = 'encrypting' | 'uploading' | 'minting' | 'confirming';

/**
 * Minting context
 */
interface MintingContext {
  requestId: string;
  walletAddress: string;
  currentStep: MintingStep;
  encryptedData?: {
    ciphertext: string;
    iv: string;
    authTag: string;
    keyId: string;
  };
  arweaveId?: string;
  assetId?: string;
  transactionSignature?: string;
  cost: Partial<CostBreakdown>;
  startTime: number;
  error?: Error;
}

/**
 * Minting Coordinator Implementation
 */
export class MintingCoordinator extends EventEmitter implements IMintingCoordinator {
  private activeContexts: Map<string, MintingContext> = new Map();
  private completedMints: Map<string, MintResult> = new Map();

  // Service dependencies (to be injected)
  private encryptionService: any; // IEncryptionService
  private arweaveService: any; // IArweaveService
  private transactionBuilder: any; // ITransactionBuilder
  private stateManager: any; // IStateManager

  constructor(private config: ServiceConfig) {
    super();
    logger.info('Minting Coordinator initialized');
  }

  /**
   * Set service dependencies
   */
  setDependencies(deps: {
    encryptionService: any;
    arweaveService: any;
    transactionBuilder: any;
    stateManager: any;
  }): void {
    this.encryptionService = deps.encryptionService;
    this.arweaveService = deps.arweaveService;
    this.transactionBuilder = deps.transactionBuilder;
    this.stateManager = deps.stateManager;
  }

  /**
   * Coordinate full minting process
   */
  async coordinateMint(request: MintRequest): Promise<MintResult> {
    const requestId = uuidv4();
    const startTime = Date.now();

    const context: MintingContext = {
      requestId,
      walletAddress: request.walletAddress,
      currentStep: 'encrypting',
      cost: {},
      startTime,
    };

    this.activeContexts.set(requestId, context);

    try {
      logger.info('Starting mint coordination', {
        requestId,
        walletAddress: request.walletAddress,
        agentId: request.memory.agentId,
      });

      // Save initial state
      await this.saveState(requestId, 'pending', 0);

      // Step 1: Encrypt memory content
      const encryptedData = await this.encryptMemory(context, request);
      context.encryptedData = encryptedData;
      await this.saveState(requestId, 'encrypting', 25);

      // Step 2: Upload to Arweave
      const arweaveId = await this.uploadToArweave(context, request, encryptedData);
      context.arweaveId = arweaveId;
      await this.saveState(requestId, 'uploading', 50);

      // Step 3: Mint compressed NFT
      const mintResult = await this.mintCompressedNFT(context, request, arweaveId);
      context.assetId = mintResult.assetId;
      context.transactionSignature = mintResult.signature;
      await this.saveState(requestId, 'minting', 75);

      // Step 4: Confirm transaction
      await this.confirmTransaction(context, mintResult.signature);
      await this.saveState(requestId, 'completed', 100);

      // Build final result
      const result: MintResult = {
        requestId,
        assetId: context.assetId!,
        arweaveId: context.arweaveId!,
        transactionSignature: context.transactionSignature!,
        cost: this.buildCostBreakdown(context.cost),
        timestamp: new Date(),
        status: 'success',
      };

      // Store completed mint
      this.completedMints.set(requestId, result);
      this.activeContexts.delete(requestId);

      const duration = Date.now() - startTime;
      logMintOperation('coordinateMint', {
        requestId,
        assetId: result.assetId,
        duration,
        cost: result.cost.total,
      });

      this.emit('mint:completed', result);

      logger.info('Mint coordination completed', {
        requestId,
        assetId: result.assetId,
        duration,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      context.error = error as Error;

      await this.saveState(requestId, 'failed', 0, error.message);

      logMintOperation('coordinateMint', {
        requestId,
        duration,
        error,
      });

      this.emit('mint:failed', {
        requestId,
        error: error.message,
      });

      // Attempt rollback
      await this.rollbackMint(requestId).catch((rollbackError) => {
        logger.error('Rollback failed', {
          requestId,
          error: rollbackError.message,
        });
      });

      this.activeContexts.delete(requestId);

      throw createMintError(`Mint coordination failed: ${error.message}`, {
        requestId,
        step: context.currentStep,
        error,
      });
    }
  }

  /**
   * Coordinate batch minting
   */
  async coordinateBatchMint(request: BatchMintRequest): Promise<BatchMintResult> {
    const batchId = uuidv4();
    const startTime = Date.now();

    try {
      logger.info('Starting batch mint coordination', {
        batchId,
        walletAddress: request.walletAddress,
        memoryCount: request.memories.length,
      });

      const results: MintResult[] = [];
      const errors: Array<{ index: number; error: Error }> = [];

      // Process each memory in the batch
      for (let i = 0; i < request.memories.length; i++) {
        const memory = request.memories[i];

        try {
          const mintRequest: MintRequest = {
            walletAddress: request.walletAddress,
            signature: request.signature,
            memory,
            options: request.options,
          };

          const result = await this.coordinateMint(mintRequest);
          results.push(result);
        } catch (error: any) {
          logger.error('Failed to mint memory in batch', {
            batchId,
            index: i,
            error: error.message,
          });
          errors.push({ index: i, error: error as Error });
        }
      }

      // Calculate total cost
      const totalCost = results.reduce(
        (acc, result) => ({
          solanaTransaction: acc.solanaTransaction + result.cost.solanaTransaction,
          arweaveStorage: acc.arweaveStorage + result.cost.arweaveStorage,
          priorityFee: acc.priorityFee + result.cost.priorityFee,
          total: acc.total + result.cost.total,
          totalSOL: acc.totalSOL + result.cost.totalSOL,
          totalAR: acc.totalAR + result.cost.totalAR,
        }),
        {
          solanaTransaction: 0,
          arweaveStorage: 0,
          priorityFee: 0,
          total: 0,
          totalSOL: 0,
          totalAR: 0,
        }
      );

      const batchResult: BatchMintResult = {
        batchId,
        assetIds: results.map((r) => r.assetId),
        totalCost,
        successCount: results.length,
        failedCount: errors.length,
        results,
        timestamp: new Date(),
      };

      const duration = Date.now() - startTime;
      logger.info('Batch mint coordination completed', {
        batchId,
        successCount: results.length,
        failedCount: errors.length,
        duration,
      });

      this.emit('batch:completed', batchResult);

      return batchResult;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Batch mint coordination failed', {
        batchId,
        duration,
        error: error.message,
      });

      throw createMintError(`Batch mint coordination failed: ${error.message}`, {
        batchId,
        error,
      });
    }
  }

  /**
   * Rollback failed mint
   */
  async rollbackMint(requestId: string): Promise<void> {
    const context = this.activeContexts.get(requestId) || this.findContextInHistory(requestId);

    if (!context) {
      logger.warn('No context found for rollback', { requestId });
      return;
    }

    logger.info('Rolling back mint', {
      requestId,
      currentStep: context.currentStep,
    });

    try {
      // Rollback based on current step
      switch (context.currentStep) {
        case 'confirming':
        case 'minting':
          // Transaction was sent but may have failed
          // We cannot rollback on-chain transactions
          // Just log and clean up state
          logger.warn('Cannot rollback on-chain transaction', {
            requestId,
            transactionSignature: context.transactionSignature,
          });
          break;

        case 'uploading':
          // Arweave upload is permanent, cannot rollback
          // Just log and clean up state
          logger.warn('Cannot rollback Arweave upload', {
            requestId,
            arweaveId: context.arweaveId,
          });
          break;

        case 'encrypting':
          // Encryption is local, just clean up
          logger.debug('Cleaning up encryption artifacts', { requestId });
          break;
      }

      // Clean up state
      if (this.stateManager) {
        await this.stateManager.deleteMintState(requestId);
      }

      this.activeContexts.delete(requestId);

      logger.info('Rollback completed', { requestId });
    } catch (error: any) {
      logger.error('Rollback failed', {
        requestId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get mint status
   */
  async getMintStatus(requestId: string): Promise<MintStatus | null> {
    // Check active contexts
    const context = this.activeContexts.get(requestId);
    if (context) {
      return {
        requestId,
        status: context.currentStep,
        progress: this.calculateProgress(context.currentStep),
        currentStep: context.currentStep,
      };
    }

    // Check completed mints
    const completed = this.completedMints.get(requestId);
    if (completed) {
      return {
        requestId,
        status: 'completed',
        progress: 100,
        result: completed,
      };
    }

    // Check state manager
    if (this.stateManager) {
      return await this.stateManager.getMintState(requestId);
    }

    return null;
  }

  /**
   * Encrypt memory content
   */
  private async encryptMemory(
    context: MintingContext,
    request: MintRequest
  ): Promise<any> {
    const startTime = Date.now();

    try {
      logger.debug('Encrypting memory', {
        requestId: context.requestId,
        contentSize: request.memory.content.length,
      });

      if (!this.encryptionService) {
        throw new Error('Encryption service not initialized');
      }

      const encrypted = await this.encryptionService.encrypt(
        request.memory.content,
        request.walletAddress
      );

      const duration = Date.now() - startTime;
      logger.debug('Memory encrypted', {
        requestId: context.requestId,
        duration,
      });

      return encrypted;
    } catch (error: any) {
      throw new MintingError(
        MintingErrorCode.ENCRYPTION_FAILED,
        `Encryption failed: ${error.message}`,
        { requestId: context.requestId, error },
        true
      );
    }
  }

  /**
   * Upload to Arweave
   */
  private async uploadToArweave(
    context: MintingContext,
    request: MintRequest,
    encryptedData: any
  ): Promise<string> {
    const startTime = Date.now();

    try {
      logger.debug('Uploading to Arweave', {
        requestId: context.requestId,
      });

      if (!this.arweaveService) {
        throw new Error('Arweave service not initialized');
      }

      // Prepare data for upload
      const uploadData = {
        version: '1.0',
        encrypted: encryptedData,
        metadata: {
          agentId: request.memory.agentId,
          timestamp: request.memory.timestamp.toISOString(),
          contentType: 'application/json',
          originalSize: request.memory.content.length,
        },
      };

      const dataBuffer = Buffer.from(JSON.stringify(uploadData));

      // Prepare tags
      const tags = [
        { name: 'App-Name', value: 'MemoryPlatform' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Memory-Type', value: request.memory.metadata.type },
        { name: 'Agent-ID', value: request.memory.agentId },
        { name: 'Owner', value: request.walletAddress },
        { name: 'Encrypted', value: 'true' },
      ];

      const uploadResult = await this.arweaveService.upload(dataBuffer, tags);

      // Store cost
      context.cost.arweaveStorage = uploadResult.cost;

      const duration = Date.now() - startTime;
      logger.debug('Uploaded to Arweave', {
        requestId: context.requestId,
        arweaveId: uploadResult.id,
        duration,
      });

      return uploadResult.id;
    } catch (error: any) {
      throw new MintingError(
        MintingErrorCode.ARWEAVE_UPLOAD_FAILED,
        `Arweave upload failed: ${error.message}`,
        { requestId: context.requestId, error },
        true
      );
    }
  }

  /**
   * Mint compressed NFT
   */
  private async mintCompressedNFT(
    context: MintingContext,
    request: MintRequest,
    arweaveId: string
  ): Promise<{ assetId: string; signature: string }> {
    const startTime = Date.now();

    try {
      logger.debug('Minting compressed NFT', {
        requestId: context.requestId,
        arweaveId,
      });

      if (!this.transactionBuilder) {
        throw new Error('Transaction builder not initialized');
      }

      // Prepare metadata
      const metadata = {
        name: `Memory ${request.memory.agentId}`,
        symbol: 'MEM',
        uri: `ar://${arweaveId}`,
        arweaveId,
        agentId: request.memory.agentId,
        timestamp: request.memory.timestamp.toISOString(),
        type: request.memory.metadata.type,
      };

      // Build and send transaction
      const transaction = await this.transactionBuilder.buildMintTransaction(
        request.walletAddress,
        arweaveId,
        metadata
      );

      const signedTx = await this.transactionBuilder.signTransaction(transaction);
      const signature = await this.transactionBuilder.sendAndConfirmTransaction(signedTx);

      // Generate asset ID (placeholder - should be derived from transaction)
      const assetId = uuidv4();

      // Store cost
      const priorityFee = await this.transactionBuilder.calculatePriorityFee(
        request.options?.priority || 'medium'
      );
      context.cost.solanaTransaction = 5000; // Base transaction cost in lamports
      context.cost.priorityFee = priorityFee;

      const duration = Date.now() - startTime;
      logger.debug('Compressed NFT minted', {
        requestId: context.requestId,
        assetId,
        signature,
        duration,
      });

      return { assetId, signature };
    } catch (error: any) {
      throw new MintingError(
        MintingErrorCode.TRANSACTION_FAILED,
        `Minting failed: ${error.message}`,
        { requestId: context.requestId, error },
        true
      );
    }
  }

  /**
   * Confirm transaction
   */
  private async confirmTransaction(
    context: MintingContext,
    signature: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug('Confirming transaction', {
        requestId: context.requestId,
        signature,
      });

      // Wait for confirmation (placeholder - actual implementation would poll Solana)
      await this.sleep(2000);

      const duration = Date.now() - startTime;
      logger.debug('Transaction confirmed', {
        requestId: context.requestId,
        signature,
        duration,
      });
    } catch (error: any) {
      throw new MintingError(
        MintingErrorCode.TRANSACTION_FAILED,
        `Transaction confirmation failed: ${error.message}`,
        { requestId: context.requestId, signature, error },
        true
      );
    }
  }

  /**
   * Save state
   */
  private async saveState(
    requestId: string,
    status: MintStatus['status'],
    progress: number,
    error?: string
  ): Promise<void> {
    if (!this.stateManager) {
      return;
    }

    const state: MintStatus = {
      requestId,
      status,
      progress,
      error,
    };

    await this.stateManager.saveMintState(requestId, state);
  }

  /**
   * Build cost breakdown
   */
  private buildCostBreakdown(partialCost: Partial<CostBreakdown>): CostBreakdown {
    const solanaTransaction = partialCost.solanaTransaction || 0;
    const arweaveStorage = partialCost.arweaveStorage || 0;
    const priorityFee = partialCost.priorityFee || 0;
    const total = solanaTransaction + arweaveStorage + priorityFee;

    return {
      solanaTransaction,
      arweaveStorage,
      priorityFee,
      total,
      totalSOL: total / 1e9, // Convert lamports to SOL
      totalAR: arweaveStorage / 1e12, // Convert winston to AR
    };
  }

  /**
   * Calculate progress based on step
   */
  private calculateProgress(step: MintingStep): number {
    const progressMap: Record<MintingStep, number> = {
      encrypting: 25,
      uploading: 50,
      minting: 75,
      confirming: 90,
    };
    return progressMap[step] || 0;
  }

  /**
   * Find context in history
   */
  private findContextInHistory(requestId: string): MintingContext | null {
    // This would query the state manager or database
    // For now, return null
    return null;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Shutdown coordinator
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Minting Coordinator');

    // Wait for active mints to complete
    while (this.activeContexts.size > 0) {
      await this.sleep(100);
    }

    logger.info('Minting Coordinator shutdown complete');
  }
}
