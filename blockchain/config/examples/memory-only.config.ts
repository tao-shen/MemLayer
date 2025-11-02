/**
 * 默认配置 - Solana + IPFS，所有记忆都可上链（可选）
 */

import { BlockchainConfig } from '../../core/types';

export const defaultConfig: BlockchainConfig = {
  enabled: true,
  
  // 默认使用 Solana（成本最优）
  chains: {
    solana: {
      enabled: true,
      network: 'devnet',
      rpcUrl: process.env.SOLANA_RPC_URL,
      programId: process.env.MEMORY_PROGRAM_ID,
      features: {
        compressedNFT: true,  // 使用压缩 NFT 降低成本
        metaplex: true,
        customProgram: false
      },
      batchConfig: {
        enabled: true,
        minSize: 10,
        maxSize: 100,
        timeout: 30000  // 30 秒
      }
    }
  },
  
  // 所有记忆类型都可以上链，但都是可选的
  assetTypes: {
    // 所有记忆（不限类型）
    memory: {
      enabled: true,
      chain: 'solana',
      
      // 上链规则：完全由用户决定
      mintingRules: {
        automatic: false,        // 不自动上链
        minImportance: 0,        // 不限制重要性（所有记忆都可以上链）
        requireReflection: false,
        userApproval: true       // 需要用户主动选择
      },
      
      // 元数据配置：包含完整信息
      metadata: {
        includeContent: true,
        includeEmbedding: false,  // 不包含向量（太大且不必要）
        includeContext: true,
        customFields: ['agentId', 'sessionId', 'tags', 'type']
      },
      
      // 隐私配置：默认加密
      privacy: {
        encryptContent: true,     // 默认加密内容
        encryptMetadata: false,   // 元数据不加密（便于检索）
        publicMetadata: ['timestamp', 'type', 'importance', 'tags']
      }
    }
  },
  
  // 默认使用 IPFS（快速且经济）
  storage: {
    provider: 'ipfs',
    config: {
      gateway: 'https://ipfs.io',
      pinningService: 'pinata',
      apiKey: process.env.PINATA_API_KEY,
      apiSecret: process.env.PINATA_API_SECRET,
      // 可选：自动备份到 Arweave 实现永久存储
      arweaveBackup: false
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
