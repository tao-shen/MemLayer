/**
 * 配置加载器 - 从环境变量和配置文件加载区块链配置
 */

import { BlockchainConfig } from '../core/types';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * 从环境变量加载配置
 */
export function loadConfigFromEnv(): BlockchainConfig {
  const config: BlockchainConfig = {
    enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
    
    chains: {},
    assetTypes: {},
    
    storage: {
      provider: (process.env.STORAGE_PROVIDER as any) || 'arweave',
      config: loadStorageConfig()
    },
    
    encryption: {
      enabled: process.env.ENCRYPTION_ENABLED !== 'false',
      algorithm: (process.env.ENCRYPTION_ALGORITHM as any) || 'aes-256-gcm',
      keyDerivation: (process.env.ENCRYPTION_KEY_DERIVATION as any) || 'pbkdf2'
    },
    
    indexer: {
      enabled: process.env.INDEXER_ENABLED !== 'false',
      realtime: process.env.INDEXER_REALTIME !== 'false',
      cacheProvider: (process.env.INDEXER_CACHE_PROVIDER as any) || 'redis'
    },
    
    accessControl: {
      enabled: process.env.ACCESS_CONTROL_ENABLED !== 'false',
      defaultPolicy: (process.env.ACCESS_CONTROL_DEFAULT_POLICY as any) || 'private'
    }
  };

  // 加载链配置
  if (process.env.SOLANA_ENABLED === 'true') {
    config.chains.solana = {
      enabled: true,
      network: (process.env.SOLANA_NETWORK as any) || 'devnet',
      rpcUrl: process.env.SOLANA_RPC_URL,
      programId: process.env.MEMORY_PROGRAM_ID,
      features: {
        compressedNFT: true,
        metaplex: true,
        customProgram: false
      },
      batchConfig: {
        enabled: process.env.SOLANA_BATCH_ENABLED !== 'false',
        minSize: parseInt(process.env.SOLANA_BATCH_MIN_SIZE || '10'),
        maxSize: parseInt(process.env.SOLANA_BATCH_MAX_SIZE || '100'),
        timeout: parseInt(process.env.SOLANA_BATCH_TIMEOUT || '30000')
      }
    };
  }

  if (process.env.ETHEREUM_ENABLED === 'true') {
    config.chains.ethereum = {
      enabled: true,
      network: (process.env.ETHEREUM_NETWORK as any) || 'goerli',
      rpcUrl: process.env.ETHEREUM_RPC_URL,
      contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS,
      features: {
        erc721: true,
        erc1155: false,
        erc4907: false
      }
    };
  }

  if (process.env.POLYGON_ENABLED === 'true') {
    config.chains.polygon = {
      enabled: true,
      network: (process.env.POLYGON_NETWORK as any) || 'mumbai',
      rpcUrl: process.env.POLYGON_RPC_URL,
      contractAddress: process.env.POLYGON_CONTRACT_ADDRESS,
      features: {
        erc721: true,
        erc1155: false
      }
    };
  }

  // 加载资产类型配置
  if (process.env.MEMORY_ASSET_ENABLED === 'true') {
    config.assetTypes.memory = {
      enabled: true,
      chain: process.env.MEMORY_ASSET_CHAIN || 'solana',
      mintingRules: {
        automatic: process.env.MEMORY_ASSET_AUTO_MINT === 'true',
        minImportance: parseFloat(process.env.MEMORY_ASSET_MIN_IMPORTANCE || '0.8'),
        requireReflection: process.env.MEMORY_ASSET_REQUIRE_REFLECTION === 'true',
        userApproval: process.env.MEMORY_ASSET_REQUIRE_APPROVAL === 'true'
      },
      metadata: {
        includeContent: true,
        includeEmbedding: false,
        includeContext: true,
        customFields: ['agentId', 'sessionId']
      },
      privacy: {
        encryptContent: process.env.MEMORY_ASSET_ENCRYPT_CONTENT !== 'false',
        encryptMetadata: false,
        publicMetadata: ['timestamp', 'type', 'importance']
      }
    };
  }

  if (process.env.CONVERSATION_ASSET_ENABLED === 'true') {
    config.assetTypes.conversation = {
      enabled: true,
      chain: process.env.CONVERSATION_ASSET_CHAIN || 'polygon',
      mintingRules: {
        automatic: process.env.CONVERSATION_ASSET_AUTO_MINT === 'true',
        minTurns: parseInt(process.env.CONVERSATION_ASSET_MIN_TURNS || '10'),
        minDuration: parseInt(process.env.CONVERSATION_ASSET_MIN_DURATION || '300'),
        requireSummary: true
      },
      metadata: {
        includeMessages: true,
        includeParticipants: true,
        includeSummary: true
      },
      privacy: {
        encryptContent: true,
        anonymizeParticipants: true
      }
    };
  }

  if (process.env.KNOWLEDGE_ASSET_ENABLED === 'true') {
    config.assetTypes.knowledge = {
      enabled: true,
      chain: process.env.KNOWLEDGE_ASSET_CHAIN || 'ethereum',
      mintingRules: {
        automatic: process.env.KNOWLEDGE_ASSET_AUTO_MINT === 'true',
        minNodes: parseInt(process.env.KNOWLEDGE_ASSET_MIN_NODES || '50'),
        minEdges: parseInt(process.env.KNOWLEDGE_ASSET_MIN_EDGES || '100'),
        requireValidation: process.env.KNOWLEDGE_ASSET_REQUIRE_VALIDATION === 'true'
      },
      metadata: {
        includeGraph: true,
        includeEmbeddings: false,
        format: 'json'
      },
      privacy: {
        encryptContent: true
      }
    };
  }

  if (process.env.REFLECTION_ASSET_ENABLED === 'true') {
    config.assetTypes.reflection = {
      enabled: true,
      chain: process.env.REFLECTION_ASSET_CHAIN || 'solana',
      mintingRules: {
        automatic: process.env.REFLECTION_ASSET_AUTO_MINT === 'true',
        minInsightScore: parseFloat(process.env.REFLECTION_ASSET_MIN_INSIGHT_SCORE || '0.8')
      },
      metadata: {
        includeSourceMemories: true,
        includeReasoningChain: true
      },
      privacy: {
        encryptContent: true
      }
    };
  }

  return config;
}

/**
 * 加载存储配置
 */
function loadStorageConfig(): Record<string, any> {
  const provider = process.env.STORAGE_PROVIDER || 'arweave';

  switch (provider) {
    case 'arweave':
      return {
        host: process.env.ARWEAVE_HOST || 'arweave.net',
        port: parseInt(process.env.ARWEAVE_PORT || '443'),
        protocol: process.env.ARWEAVE_PROTOCOL || 'https',
        timeout: 60000,
        logging: false,
        walletPath: process.env.ARWEAVE_WALLET_PATH
      };

    case 'ipfs':
      return {
        gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io',
        pinningService: process.env.IPFS_PINNING_SERVICE || 'pinata',
        apiKey: process.env.PINATA_API_KEY,
        apiSecret: process.env.PINATA_API_SECRET,
        filecoinBackup: process.env.FILECOIN_BACKUP_ENABLED === 'true'
      };

    case 's3':
      return {
        endpoint: process.env.S3_ENDPOINT,
        bucket: process.env.S3_BUCKET,
        accessKey: process.env.S3_ACCESS_KEY,
        secretKey: process.env.S3_SECRET_KEY,
        region: process.env.S3_REGION || 'us-east-1'
      };

    default:
      return {};
  }
}

/**
 * 加载配置（支持多种来源）
 */
export function loadConfig(source?: 'env' | 'file' | string): BlockchainConfig {
  if (!source || source === 'env') {
    return loadConfigFromEnv();
  }

  if (source === 'file') {
    // 从默认配置文件加载
    const { defaultConfig } = require('./default.config');
    return defaultConfig;
  }

  // 从指定文件加载
  try {
    const config = require(source);
    return config.default || config;
  } catch (error) {
    console.error(`Failed to load config from ${source}:`, error);
    return loadConfigFromEnv();
  }
}

/**
 * 验证配置
 */
export function validateConfig(config: BlockchainConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.enabled) {
    // 检查是否至少启用了一条链
    const enabledChains = Object.entries(config.chains)
      .filter(([_, chainConfig]) => chainConfig?.enabled)
      .length;

    if (enabledChains === 0) {
      errors.push('At least one blockchain must be enabled when blockchain module is enabled');
    }

    // 检查资产类型配置
    for (const [assetType, assetConfig] of Object.entries(config.assetTypes)) {
      if (assetConfig?.enabled) {
        // 检查链是否存在且启用
        const chain = config.chains[assetConfig.chain as keyof typeof config.chains];
        if (!chain || !chain.enabled) {
          errors.push(`Asset type '${assetType}' references disabled or non-existent chain '${assetConfig.chain}'`);
        }
      }
    }

    // 检查存储配置
    if (!config.storage.provider) {
      errors.push('Storage provider must be specified');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 获取配置摘要（用于日志）
 */
export function getConfigSummary(config: BlockchainConfig): string {
  if (!config.enabled) {
    return 'Blockchain module: DISABLED';
  }

  const enabledChains = Object.entries(config.chains)
    .filter(([_, c]) => c?.enabled)
    .map(([name]) => name);

  const enabledAssets = Object.entries(config.assetTypes)
    .filter(([_, a]) => a?.enabled)
    .map(([name]) => name);

  return `
Blockchain module: ENABLED
Chains: ${enabledChains.join(', ') || 'none'}
Asset types: ${enabledAssets.join(', ') || 'none'}
Storage: ${config.storage.provider}
Encryption: ${config.encryption.enabled ? 'enabled' : 'disabled'}
Indexer: ${config.indexer.enabled ? 'enabled' : 'disabled'}
Access control: ${config.accessControl.enabled ? 'enabled' : 'disabled'}
  `.trim();
}
