/**
 * 最小配置示例 - 完全禁用区块链功能
 */

import { BlockchainConfig } from '../../core/types';

export const minimalConfig: BlockchainConfig = {
  // 完全禁用区块链模块
  enabled: false,
  
  chains: {},
  assetTypes: {},
  
  storage: {
    provider: 'arweave',
    config: {}
  },
  
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2'
  },
  
  indexer: {
    enabled: false,
    realtime: false,
    cacheProvider: 'memory'
  },
  
  accessControl: {
    enabled: false,
    defaultPolicy: 'private'
  }
};
