/**
 * 区块链适配器 - 核心接口
 * 提供统一的区块链交互接口，支持多链、多资产类型
 */

import { EventEmitter } from 'events';
import { AssetTypeRegistry } from './asset-registry';
import { ChainRegistry } from './chain-registry';
import { StorageRegistry } from './storage-registry';
import { BlockchainConfig, MintAssetParams, MintResult, QueryParams, Asset } from './types';

export class BlockchainAdapter extends EventEmitter {
  private config: BlockchainConfig;
  private assetRegistry: AssetTypeRegistry;
  private chainRegistry: ChainRegistry;
  private storageRegistry: StorageRegistry;
  private initialized = false;

  constructor() {
    super();
    this.assetRegistry = new AssetTypeRegistry();
    this.chainRegistry = new ChainRegistry();
    this.storageRegistry = new StorageRegistry();
  }

  /**
   * 初始化适配器
   */
  async initialize(config: BlockchainConfig): Promise<void> {
    this.config = config;

    if (!config.enabled) {
      console.log('Blockchain module is disabled');
      return;
    }

    // 初始化链适配器
    await this.initializeChains();

    // 初始化资产类型处理器
    await this.initializeAssetTypes();

    // 初始化存储适配器
    await this.initializeStorage();

    this.initialized = true;
    this.emit('initialized');
    console.log('Blockchain adapter initialized successfully');
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.config?.enabled && this.initialized;
  }

  /**
   * 获取支持的链
   */
  getSupportedChains(): string[] {
    return this.chainRegistry.listChains();
  }

  /**
   * 获取支持的资产类型
   */
  getSupportedAssetTypes(): string[] {
    return this.assetRegistry.listTypes();
  }

  /**
   * 铸造资产
   */
  async mintAsset(params: MintAssetParams): Promise<MintResult> {
    if (!this.isEnabled()) {
      throw new Error('Blockchain module is not enabled');
    }

    // 获取资产类型处理器
    const assetHandler = this.assetRegistry.getHandler(params.assetType);
    if (!assetHandler) {
      throw new Error(`Asset type '${params.assetType}' is not supported`);
    }

    // 获取资产配置
    const assetConfig = this.config.assetTypes[params.assetType];
    if (!assetConfig?.enabled) {
      throw new Error(`Asset type '${params.assetType}' is not enabled`);
    }

    // 检查是否应该上链
    const shouldMint = await assetHandler.shouldMint(params.data, assetConfig);
    if (!shouldMint && !params.options?.force) {
      return {
        success: false,
        error: 'Asset does not meet minting criteria',
        skipped: true
      };
    }

    // 验证数据
    const validation = await assetHandler.validate(params.data);
    if (!validation.valid) {
      throw new Error(`Invalid asset data: ${validation.error}`);
    }

    // 确定使用的链
    const chainId = params.chain || assetConfig.chain;
    const chainAdapter = this.chainRegistry.getChain(chainId);
    if (!chainAdapter) {
      throw new Error(`Chain '${chainId}' is not supported`);
    }

    try {
      // 准备元数据
      const metadata = await assetHandler.prepareMetadata(params.data);

      // 序列化数据
      let serializedData = await assetHandler.serialize(params.data);

      // 加密（如果需要）
      if (params.options?.encrypt || assetConfig.privacy?.encryptContent) {
        const encryptionService = await this.getEncryptionService();
        serializedData = await encryptionService.encrypt(serializedData);
      }

      // 上传到存储
      const storageAdapter = this.storageRegistry.getStorage(
        params.options?.storage || this.config.storage.provider
      );
      const uploadResult = await storageAdapter.upload(serializedData, metadata);

      // 在链上铸造
      const mintResult = await chainAdapter.mint({
        assetType: params.assetType,
        storageUri: uploadResult.uri,
        metadata,
        signature: params.signature,
        options: params.options
      });

      // 发出事件
      this.emit('asset-minted', {
        assetId: mintResult.assetId,
        assetType: params.assetType,
        chain: chainId,
        storageUri: uploadResult.uri
      });

      return {
        success: true,
        assetId: mintResult.assetId,
        transactionId: mintResult.transactionId,
        chain: chainId,
        storageUri: uploadResult.uri,
        cost: mintResult.cost
      };
    } catch (error) {
      this.emit('mint-error', { error, params });
      throw error;
    }
  }

  /**
   * 批量铸造
   */
  async mintBatch(params: MintBatchParams): Promise<BatchMintResult> {
    if (!this.isEnabled()) {
      throw new Error('Blockchain module is not enabled');
    }

    const results: MintResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < params.items.length; i++) {
      try {
        const result = await this.mintAsset(params.items[i]);
        results.push(result);
      } catch (error) {
        errors.push({ index: i, error: error.message });
        if (!params.continueOnError) {
          break;
        }
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      total: params.items.length,
      successful: results.filter(r => r.success).length,
      failed: errors.length
    };
  }

  /**
   * 查询资产
   */
  async queryAssets(params: QueryParams): Promise<Asset[]> {
    if (!this.isEnabled()) {
      throw new Error('Blockchain module is not enabled');
    }

    const chainAdapter = this.chainRegistry.getChain(params.chain);
    if (!chainAdapter) {
      throw new Error(`Chain '${params.chain}' is not supported`);
    }

    return chainAdapter.query(params);
  }

  /**
   * 转移资产
   */
  async transferAsset(params: TransferParams): Promise<TransferResult> {
    if (!this.isEnabled()) {
      throw new Error('Blockchain module is not enabled');
    }

    const chainAdapter = this.chainRegistry.getChain(params.chain);
    if (!chainAdapter) {
      throw new Error(`Chain '${params.chain}' is not supported`);
    }

    const result = await chainAdapter.transfer(params);
    
    this.emit('asset-transferred', {
      assetId: params.assetId,
      from: params.from,
      to: params.to,
      chain: params.chain
    });

    return result;
  }

  /**
   * 更新访问控制
   */
  async updateAccess(params: AccessParams): Promise<AccessResult> {
    if (!this.isEnabled()) {
      throw new Error('Blockchain module is not enabled');
    }

    const chainAdapter = this.chainRegistry.getChain(params.chain);
    if (!chainAdapter) {
      throw new Error(`Chain '${params.chain}' is not supported`);
    }

    return chainAdapter.updateAccessControl(params);
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<HealthStatus> {
    if (!this.isEnabled()) {
      return {
        enabled: false,
        healthy: false,
        chains: {},
        storage: {},
        timestamp: new Date().toISOString()
      };
    }

    const chains: Record<string, boolean> = {};
    for (const chainId of this.getSupportedChains()) {
      const chain = this.chainRegistry.getChain(chainId);
      chains[chainId] = chain?.isConnected() || false;
    }

    const storage: Record<string, boolean> = {};
    for (const storageId of this.storageRegistry.listStorages()) {
      const storageAdapter = this.storageRegistry.getStorage(storageId);
      storage[storageId] = await storageAdapter.healthCheck();
    }

    return {
      enabled: true,
      healthy: Object.values(chains).some(v => v) && Object.values(storage).some(v => v),
      chains,
      storage,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 初始化链适配器
   */
  private async initializeChains(): Promise<void> {
    const { chains } = this.config;

    // Solana
    if (chains.solana?.enabled) {
      const { SolanaChainAdapter } = await import('../chains/solana/solana-adapter');
      const adapter = new SolanaChainAdapter();
      await adapter.connect(chains.solana);
      this.chainRegistry.register('solana', adapter);
    }

    // Ethereum
    if (chains.ethereum?.enabled) {
      const { EthereumChainAdapter } = await import('../chains/ethereum/ethereum-adapter');
      const adapter = new EthereumChainAdapter();
      await adapter.connect(chains.ethereum);
      this.chainRegistry.register('ethereum', adapter);
    }

    // Polygon
    if (chains.polygon?.enabled) {
      const { PolygonChainAdapter } = await import('../chains/polygon/polygon-adapter');
      const adapter = new PolygonChainAdapter();
      await adapter.connect(chains.polygon);
      this.chainRegistry.register('polygon', adapter);
    }

    // Custom chains
    if (chains.custom) {
      for (const customChain of chains.custom) {
        // 动态加载自定义链适配器
        const adapter = await this.loadCustomChainAdapter(customChain);
        this.chainRegistry.register(customChain.id, adapter);
      }
    }
  }

  /**
   * 初始化资产类型处理器
   */
  private async initializeAssetTypes(): Promise<void> {
    const { assetTypes } = this.config;

    // Memory
    if (assetTypes.memory?.enabled) {
      const { MemoryAssetHandler } = await import('../assets/memory/memory-handler');
      this.assetRegistry.register('memory', new MemoryAssetHandler(assetTypes.memory));
    }

    // Conversation
    if (assetTypes.conversation?.enabled) {
      const { ConversationAssetHandler } = await import('../assets/conversation/conversation-handler');
      this.assetRegistry.register('conversation', new ConversationAssetHandler(assetTypes.conversation));
    }

    // Knowledge
    if (assetTypes.knowledge?.enabled) {
      const { KnowledgeAssetHandler } = await import('../assets/knowledge/knowledge-handler');
      this.assetRegistry.register('knowledge', new KnowledgeAssetHandler(assetTypes.knowledge));
    }

    // Reflection
    if (assetTypes.reflection?.enabled) {
      const { ReflectionAssetHandler } = await import('../assets/reflection/reflection-handler');
      this.assetRegistry.register('reflection', new ReflectionAssetHandler(assetTypes.reflection));
    }

    // Custom asset types
    if (assetTypes.custom) {
      for (const customAsset of assetTypes.custom) {
        const handler = await this.loadCustomAssetHandler(customAsset);
        this.assetRegistry.register(customAsset.id, handler);
      }
    }
  }

  /**
   * 初始化存储适配器
   */
  private async initializeStorage(): Promise<void> {
    const { storage } = this.config;

    switch (storage.provider) {
      case 'arweave':
        const { ArweaveStorageAdapter } = await import('../storage/arweave/arweave-adapter');
        this.storageRegistry.register('arweave', new ArweaveStorageAdapter(storage.config));
        break;

      case 'ipfs':
        const { IPFSStorageAdapter } = await import('../storage/ipfs/ipfs-adapter');
        this.storageRegistry.register('ipfs', new IPFSStorageAdapter(storage.config));
        break;

      case 'filecoin':
        const { FilecoinStorageAdapter } = await import('../storage/filecoin/filecoin-adapter');
        this.storageRegistry.register('filecoin', new FilecoinStorageAdapter(storage.config));
        break;

      case 's3':
        const { S3StorageAdapter } = await import('../storage/s3/s3-adapter');
        this.storageRegistry.register('s3', new S3StorageAdapter(storage.config));
        break;
    }
  }

  /**
   * 获取加密服务
   */
  private async getEncryptionService() {
    // 延迟加载加密服务
    const { EncryptionService } = await import('../services/encryption');
    return new EncryptionService(this.config.encryption);
  }

  /**
   * 加载自定义链适配器
   */
  private async loadCustomChainAdapter(config: any): Promise<ChainAdapter> {
    // 实现自定义链适配器加载逻辑
    throw new Error('Custom chain adapters not yet implemented');
  }

  /**
   * 加载自定义资产处理器
   */
  private async loadCustomAssetHandler(config: any): Promise<AssetTypeHandler> {
    // 实现自定义资产处理器加载逻辑
    throw new Error('Custom asset handlers not yet implemented');
  }
}

// 导出单例
export const blockchainAdapter = new BlockchainAdapter();
