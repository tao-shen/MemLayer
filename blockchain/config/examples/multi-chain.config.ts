/**
 * 多链多资产配置 - 完整功能示例
 */

import { BlockchainConfig } from '../../core/types';

export const multiChainConfig: BlockchainConfig = {
  enabled: true,
  
  // 启用多条链
  chains: {
    // Solana - 用于高频低价值资产（记忆）
    solana: {
      enabled: true,
      network: 'mainnet-beta',
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      programId: process.env.MEMORY_PROGRAM_ID,
      features: {
        compressedNFT: true,
        metaplex: true,
        customProgram: false
      },
      batchConfig: {
        enabled: true,
        minSize: 50,
        maxSize: 100,
        timeout: 60000
      }
    },
    
    // Polygon - 用于中等价值资产（对话）
    polygon: {
      enabled: true,
      network: 'mainnet',
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      contractAddress: process.env.POLYGON_CONTRACT_ADDRESS,
      features: {
        erc721: true,
        erc1155: false
      }
    },
    
    // Ethereum - 用于高价值资产（知识图谱）
    ethereum: {
      enabled: true,
      network: 'mainnet',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS,
      features: {
        erc721: true,
        erc1155: false,
        erc4907: false
      }
    }
  },
  
  // 启用多种资产类型
  assetTypes: {
    // 记忆资产 -> Solana（最便宜）
    memory: {
      enabled: true,
      chain: 'solana',
      mintingRules: {
        automatic: true,
        minImportance: 0.7,
        requireReflection: false,
        userApproval: false
      },
      metadata: {
        includeContent: true,
        includeEmbedding: false,
        includeContext: true,
        customFields: ['agentId', 'sessionId', 'tags']
      },
      privacy: {
        encryptContent: true,
        encryptMetadata: false,
        publicMetadata: ['timestamp', 'type', 'importance', 'tags']
      }
    },
    
    // 对话资产 -> Polygon（中等成本）
    conversation: {
      enabled: true,
      chain: 'polygon',
      mintingRules: {
        automatic: false,
        minTurns: 10,
        minDuration: 300,  // 5 分钟
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
    },
    
    // 知识图谱资产 -> Ethereum（高价值）
    knowledge: {
      enabled: true,
      chain: 'ethereum',
      mintingRules: {
        automatic: false,
        minNodes: 50,
        minEdges: 100,
        requireValidation: true
      },
      metadata: {
        includeGraph: true,
        includeEmbeddings: false,
        format: 'json'
      },
      privacy: {
        encryptContent: true
      }
    },
    
    // 反思资产 -> Solana（频繁但便宜）
    reflection: {
      enabled: true,
      chain: 'solana',
      mintingRules: {
        automatic: true,
        minInsightScore: 0.8
      },
      metadata: {
        includeSourceMemories: true,
        includeReasoningChain: true
      },
      privacy: {
        encryptContent: true
      }
    }
  },
  
  // 使用 IPFS + Filecoin 存储
  storage: {
    provider: 'ipfs',
    config: {
      gateway: 'https://ipfs.io',
      pinningService: 'pinata',
      apiKey: process.env.PINATA_API_KEY,
      apiSecret: process.env.PINATA_API_SECRET,
      // 自动备份到 Filecoin
      filecoinBackup: true
    }
  },
  
  // 加密配置
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keyDerivation: 'argon2'  // 更安全的密钥派生
  },
  
  // 实时索引
  indexer: {
    enabled: true,
    realtime: true,
    cacheProvider: 'redis'
  },
  
  // 细粒度访问控制
  accessControl: {
    enabled: true,
    defaultPolicy: 'private'
  }
};
