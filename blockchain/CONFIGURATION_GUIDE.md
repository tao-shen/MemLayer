# 区块链模块配置指南

## 概述

区块链模块采用**完全模块化**设计，支持：
- ✅ 完全禁用（零开销）
- ✅ 选择性启用功能
- ✅ 多链支持
- ✅ 自定义资产类型
- ✅ 灵活的存储选项

## 快速开始

### 1. 完全禁用区块链

如果不需要区块链功能，只需设置：

```bash
# .env
BLOCKCHAIN_ENABLED=false
```

或使用最小配置：

```typescript
import { minimalConfig } from './blockchain/config/examples/minimal.config';
import { blockchainAdapter } from './blockchain/core/blockchain-adapter';

await blockchainAdapter.initialize(minimalConfig);
```

### 2. 仅启用记忆上链

最简单的配置，只将重要记忆上链到 Solana：

```bash
# .env
BLOCKCHAIN_ENABLED=true

# 启用 Solana
SOLANA_ENABLED=true
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# 启用记忆资产
MEMORY_ASSET_ENABLED=true
MEMORY_ASSET_CHAIN=solana
MEMORY_ASSET_AUTO_MINT=false
MEMORY_ASSET_MIN_IMPORTANCE=0.8
MEMORY_ASSET_REQUIRE_APPROVAL=true
```

或使用预设配置：

```typescript
import { memoryOnlyConfig } from './blockchain/config/examples/memory-only.config';
await blockchainAdapter.initialize(memoryOnlyConfig);
```

### 3. 多链多资产

完整功能，不同资产类型使用不同的链：

```typescript
import { multiChainConfig } from './blockchain/config/examples/multi-chain.config';
await blockchainAdapter.initialize(multiChainConfig);
```

## 配置选项详解

### 全局配置

```typescript
{
  enabled: boolean,  // 是否启用区块链模块
  chains: {...},     // 链配置
  assetTypes: {...}, // 资产类型配置
  storage: {...},    // 存储配置
  encryption: {...}, // 加密配置
  indexer: {...},    // 索引配置
  accessControl: {...} // 访问控制配置
}
```

### 链配置

#### Solana

```typescript
solana: {
  enabled: true,
  network: 'devnet' | 'testnet' | 'mainnet-beta' | 'localnet',
  rpcUrl: 'https://api.devnet.solana.com',
  programId: 'YOUR_PROGRAM_ID',
  
  features: {
    compressedNFT: true,  // 使用压缩 NFT（推荐，便宜）
    metaplex: true,       // 使用 Metaplex 标准
    customProgram: false  // 使用自定义程序
  },
  
  batchConfig: {
    enabled: true,
    minSize: 10,    // 最小批次大小
    maxSize: 100,   // 最大批次大小
    timeout: 30000  // 批次超时（毫秒）
  }
}
```

**成本参考**：
- 压缩 NFT：~$0.005/个
- 标准 NFT：~$1/个
- 批量铸造可降低 30-50% 成本

#### Ethereum

```typescript
ethereum: {
  enabled: true,
  network: 'mainnet' | 'goerli' | 'sepolia',
  rpcUrl: 'https://eth.llamarpc.com',
  contractAddress: 'YOUR_CONTRACT_ADDRESS',
  
  features: {
    erc721: true,   // 标准 NFT
    erc1155: false, // 多代币标准
    erc4907: false  // 租赁 NFT
  }
}
```

**成本参考**：
- ERC-721 铸造：~$20-50/个（取决于 gas）
- 适合高价值资产

#### Polygon

```typescript
polygon: {
  enabled: true,
  network: 'mainnet' | 'mumbai',
  rpcUrl: 'https://polygon-rpc.com',
  contractAddress: 'YOUR_CONTRACT_ADDRESS',
  
  features: {
    erc721: true,
    erc1155: false
  }
}
```

**成本参考**：
- ERC-721 铸造：~$0.01-0.1/个
- 适合中等价值资产

### 资产类型配置

#### 记忆资产

```typescript
memory: {
  enabled: true,
  chain: 'solana',  // 推荐使用 Solana（便宜）
  
  mintingRules: {
    automatic: false,        // 是否自动上链
    minImportance: 0.8,      // 最小重要性分数（0-1）
    requireReflection: false, // 是否需要反思
    userApproval: true       // 是否需要用户批准
  },
  
  metadata: {
    includeContent: true,     // 包含完整内容
    includeEmbedding: false,  // 包含向量（不推荐，太大）
    includeContext: true,     // 包含上下文
    customFields: ['agentId', 'sessionId', 'tags']
  },
  
  privacy: {
    encryptContent: true,     // 加密内容
    encryptMetadata: false,   // 加密元数据
    publicMetadata: ['timestamp', 'type', 'importance']
  }
}
```

**使用场景**：
- 重要的对话记录
- 关键决策点
- 用户明确要求保存的记忆

#### 对话资产

```typescript
conversation: {
  enabled: true,
  chain: 'polygon',  // 推荐使用 Polygon（中等成本）
  
  mintingRules: {
    automatic: false,
    minTurns: 10,        // 最少对话轮数
    minDuration: 300,    // 最短持续时间（秒）
    requireSummary: true // 需要摘要
  },
  
  metadata: {
    includeMessages: true,
    includeParticipants: true,
    includeSummary: true
  },
  
  privacy: {
    encryptContent: true,
    anonymizeParticipants: true  // 匿名化参与者
  }
}
```

**使用场景**：
- 完整的对话会话
- 客服记录
- 重要会议记录

#### 知识图谱资产

```typescript
knowledge: {
  enabled: true,
  chain: 'ethereum',  // 推荐使用 Ethereum（高价值）
  
  mintingRules: {
    automatic: false,
    minNodes: 50,           // 最少节点数
    minEdges: 100,          // 最少边数
    requireValidation: true // 需要验证
  },
  
  metadata: {
    includeGraph: true,
    includeEmbeddings: false,
    format: 'json' | 'rdf' | 'graphml'
  },
  
  privacy: {
    encryptContent: true
  }
}
```

**使用场景**：
- 完整的知识体系
- 领域专家知识
- 组织知识库

#### 反思资产

```typescript
reflection: {
  enabled: true,
  chain: 'solana',  // 推荐使用 Solana（频繁但便宜）
  
  mintingRules: {
    automatic: true,
    minInsightScore: 0.8  // 最小洞察分数
  },
  
  metadata: {
    includeSourceMemories: true,
    includeReasoningChain: true
  },
  
  privacy: {
    encryptContent: true
  }
}
```

**使用场景**：
- AI 生成的洞察
- 模式识别结果
- 学习总结

### 存储配置

#### Arweave（推荐）

```typescript
storage: {
  provider: 'arweave',
  config: {
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
    walletPath: './arweave-wallet.json'
  }
}
```

**特点**：
- ✅ 永久存储（一次付费，永久保存）
- ✅ 去中心化
- ✅ 成本：~$0.0003/KB
- ❌ 上传较慢（5-10 分钟确认）

#### IPFS

```typescript
storage: {
  provider: 'ipfs',
  config: {
    gateway: 'https://ipfs.io',
    pinningService: 'pinata',
    apiKey: 'YOUR_PINATA_API_KEY',
    apiSecret: 'YOUR_PINATA_API_SECRET',
    filecoinBackup: true  // 自动备份到 Filecoin
  }
}
```

**特点**：
- ✅ 快速上传
- ✅ 内容寻址
- ✅ 成本：免费（需要 pinning 服务）
- ❌ 需要持续 pinning

#### S3 兼容

```typescript
storage: {
  provider: 's3',
  config: {
    endpoint: 'https://s3.amazonaws.com',
    bucket: 'your-bucket',
    accessKey: 'YOUR_ACCESS_KEY',
    secretKey: 'YOUR_SECRET_KEY',
    region: 'us-east-1'
  }
}
```

**特点**：
- ✅ 高性能
- ✅ 可靠性高
- ✅ 灵活配置
- ❌ 中心化
- ❌ 持续成本

### 加密配置

```typescript
encryption: {
  enabled: true,
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305',
  keyDerivation: 'pbkdf2' | 'argon2' | 'scrypt'
}
```

**推荐**：
- 生产环境：`algorithm: 'aes-256-gcm'`, `keyDerivation: 'argon2'`
- 开发环境：`algorithm: 'aes-256-gcm'`, `keyDerivation: 'pbkdf2'`

### 索引配置

```typescript
indexer: {
  enabled: true,
  realtime: true,           // 实时索引
  cacheProvider: 'redis'    // 'redis' | 'memory'
}
```

**推荐**：
- 生产环境：`realtime: true`, `cacheProvider: 'redis'`
- 开发环境：`realtime: false`, `cacheProvider: 'memory'`

### 访问控制配置

```typescript
accessControl: {
  enabled: true,
  defaultPolicy: 'private'  // 'private' | 'public' | 'restricted'
}
```

## 使用示例

### 在代码中使用

```typescript
import { blockchainAdapter } from './blockchain/core/blockchain-adapter';
import { loadConfig } from './blockchain/config/config-loader';

// 1. 加载配置
const config = loadConfig('env');  // 从环境变量加载

// 2. 初始化适配器
await blockchainAdapter.initialize(config);

// 3. 检查是否启用
if (blockchainAdapter.isEnabled()) {
  console.log('Blockchain module is enabled');
  console.log('Supported chains:', blockchainAdapter.getSupportedChains());
  console.log('Supported assets:', blockchainAdapter.getSupportedAssetTypes());
}

// 4. 铸造资产
const result = await blockchainAdapter.mintAsset({
  assetType: 'memory',
  data: {
    id: 'mem-001',
    content: 'Important memory content',
    importance: 0.9,
    timestamp: new Date().toISOString()
  },
  options: {
    encrypt: true,
    priority: 'high'
  },
  signature: walletSignature
});

console.log('Minted asset:', result.assetId);
```

### 在 API 中集成

```typescript
// services/api-gateway/src/routes/blockchain.ts

import { Router } from 'express';
import { blockchainAdapter } from '../../../blockchain/core/blockchain-adapter';

const router = Router();

// 健康检查
router.get('/blockchain/health', async (req, res) => {
  const health = await blockchainAdapter.healthCheck();
  res.json(health);
});

// 铸造资产
router.post('/blockchain/mint', async (req, res) => {
  if (!blockchainAdapter.isEnabled()) {
    return res.status(503).json({
      error: 'Blockchain module is not enabled'
    });
  }

  try {
    const result = await blockchainAdapter.mintAsset({
      assetType: req.body.assetType,
      data: req.body.data,
      options: req.body.options,
      signature: req.headers['x-wallet-signature']
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

## 配置策略建议

### 开发环境

```bash
BLOCKCHAIN_ENABLED=true
SOLANA_ENABLED=true
SOLANA_NETWORK=devnet
MEMORY_ASSET_ENABLED=true
MEMORY_ASSET_AUTO_MINT=false
MEMORY_ASSET_REQUIRE_APPROVAL=true
STORAGE_PROVIDER=ipfs
INDEXER_CACHE_PROVIDER=memory
```

### 测试环境

```bash
BLOCKCHAIN_ENABLED=true
SOLANA_ENABLED=true
SOLANA_NETWORK=testnet
MEMORY_ASSET_ENABLED=true
MEMORY_ASSET_AUTO_MINT=true
MEMORY_ASSET_MIN_IMPORTANCE=0.7
STORAGE_PROVIDER=arweave
INDEXER_CACHE_PROVIDER=redis
```

### 生产环境

```bash
BLOCKCHAIN_ENABLED=true

# 多链配置
SOLANA_ENABLED=true
SOLANA_NETWORK=mainnet-beta
POLYGON_ENABLED=true
POLYGON_NETWORK=mainnet

# 多资产类型
MEMORY_ASSET_ENABLED=true
MEMORY_ASSET_CHAIN=solana
CONVERSATION_ASSET_ENABLED=true
CONVERSATION_ASSET_CHAIN=polygon

# 生产级配置
STORAGE_PROVIDER=arweave
ENCRYPTION_KEY_DERIVATION=argon2
INDEXER_REALTIME=true
INDEXER_CACHE_PROVIDER=redis
ACCESS_CONTROL_ENABLED=true
```

## 成本优化建议

1. **使用批量铸造**：可降低 30-50% 成本
2. **选择合适的链**：
   - 高频低价值 → Solana
   - 中频中价值 → Polygon
   - 低频高价值 → Ethereum
3. **压缩数据**：上传前压缩可降低存储成本
4. **选择性上链**：只上链重要数据
5. **使用压缩 NFT**：Solana 压缩 NFT 比标准 NFT 便宜 99.5%

## 故障排查

### 区块链模块未启用

检查：
1. `BLOCKCHAIN_ENABLED=true`
2. 至少启用一条链
3. 至少启用一种资产类型

### 铸造失败

检查：
1. 钱包余额是否充足
2. RPC 节点是否可用
3. 程序 ID 是否正确
4. 签名是否有效

### 存储上传失败

检查：
1. 存储服务配置是否正确
2. API 密钥是否有效
3. 网络连接是否正常
4. 数据大小是否超限

## 更多资源

- [模块化架构文档](./MODULAR_ARCHITECTURE.md)
- [API 参考](./sdk/API_REFERENCE.md)
- [SDK 指南](./sdk/SDK_GUIDE.md)
- [CLI 工具](./cli/README.md)
