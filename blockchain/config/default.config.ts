/**
 * 默认区块链配置
 * - 所有记忆都可以上链（用户可选）
 * - 默认使用 Solana + IPFS
 * - 不自动上链，完全由用户控制
 */

import { BlockchainConfig } from '../core/types';

export const defaultConfig: BlockchainConfig = {
  // 默认启用区块链功能
  enabled: true,
  
  // 默认链：Solana（成本最优）
  chains: {
    solana: {
      enabled: true,
      network: 'devnet',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      programId: process.env.MEMORY_PROGRAM_ID,
      features: {
        compressedNFT: true,  // 使用压缩 NFT（便宜 99.5%）
        metaplex: true,
        customProgram: false
      },
      batchConfig: {
        enabled: true,
        minSize: 10,
        maxSize: 100,
        timeout: 30000
      }
    }
  },
  
  // 资产类型：所有记忆都可以上链
  assetTypes: {
    memory: {
      enabled: true,
      chain: 'solana',
      
      // 上链规则：完全可选，不自动上链
      mintingRules: {
        automatic: false,        // 不自动上链
        minImportance: 0,        // 不限制重要性（任何记忆都可以上链）
        requireReflection: false,
        userApproval: true       // 需要用户主动选择
      },
      
      // 元数据：包含完整信息
      metadata: {
        includeContent: true,
        includeEmbedding: false,  // 向量太大，不上链
        includeContext: true,
        customFields: [
          'agentId',
          'sessionId', 
          'tags',
          'type',
          'memoryType'  // episodic, semantic, procedural
        ]
      },
      
      // 隐私：默认加密
      privacy: {
        encryptContent: true,     // 内容加密
        encryptMetadata: false,   // 元数据不加密（便于检索）
        publicMetadata: [
          'timestamp',
          'type',
          'memoryType',
          'importance',
          'tags'
        ]
      }
    }
  },
  
  // 默认存储：IPFS（快速 + 经济）
  storage: {
    provider: 'ipfs',
    config: {
      gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io',
      pinningService: process.env.IPFS_PINNING_SERVICE || 'pinata',
      apiKey: process.env.PINATA_API_KEY,
      apiSecret: process.env.PINATA_API_SECRET,
      // 可选：自动备份到 Arweave 实现永久存储
      arweaveBackup: process.env.ARWEAVE_BACKUP_ENABLED === 'true'
    }
  },
  
  // 加密配置
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2'
  },
  
  // 索引配置
  indexer: {
    enabled: true,
    realtime: true,
    cacheProvider: 'redis'
  },
  
  // 访问控制
  accessControl: {
    enabled: true,
    defaultPolicy: 'private'
  }
};
