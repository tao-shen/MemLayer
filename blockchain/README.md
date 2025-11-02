# Blockchain Memory Assets

基于 Solana + 压缩 NFT (Bubblegum) + Arweave 的链上记忆资产化模块。

## 概述

此模块将 AI Agent 的记忆数据转化为可验证、可交易的个人数字资产。

### 核心特性

- ✅ **所有记忆都可上链**：不限类型、不限重要性，完全由用户决定
- ✅ **完全可选**：不会自动上链，用户主动选择
- ✅ **极低成本**：$0.006/记忆（Solana + IPFS），批量更便宜
- ✅ **快速上链**：IPFS 秒级上传，Solana 秒级确认
- ✅ **端到端加密**：AES-256-GCM 保护隐私
- ✅ **真正所有权**：用户完全控制记忆资产

### 默认配置

- **区块链**：Solana（成本最优）
- **存储**：IPFS（快速 + 经济）
- **上链方式**：用户主动选择（不自动上链）
- **加密**：默认开启

## 目录结构

```
blockchain/
├── programs/              # Solana Programs (Rust/Anchor)
│   └── memory-asset/     # 记忆资产智能合约
├── services/             # 区块链服务 (TypeScript)
│   ├── minting/         # 铸造服务
│   ├── encryption/      # 加密服务
│   ├── indexer/         # 索引服务
│   └── access-control/  # 访问控制服务
├── sdk/                  # SDK
│   ├── typescript/      # TypeScript SDK
│   └── rust/            # Rust SDK
├── tests/               # 测试
└── scripts/             # 部署和管理脚本
```

## 快速开始

### 1. 配置环境

```bash
# 复制配置文件
cp blockchain/.env.example blockchain/.env

# 编辑配置（默认已启用 Solana + IPFS）
# BLOCKCHAIN_ENABLED=true
# SOLANA_ENABLED=true
# STORAGE_PROVIDER=ipfs
```

### 2. 配置 IPFS（推荐使用 Pinata）

```bash
# 注册 Pinata: https://pinata.cloud
# 获取 API Key 后配置：
PINATA_API_KEY=your_api_key
PINATA_API_SECRET=your_api_secret
```

### 3. 配置 Solana 钱包

```bash
# 生成开发钱包
solana-keygen new --outfile ~/.config/solana/devnet.json

# 获取测试 SOL
solana airdrop 2
```

### 4. 开始使用

所有记忆都会显示"上链"按钮，用户点击即可上链！

详细使用指南：[用户指南](./USER_GUIDE.md)

## 核心组件

### Solana Program

智能合约实现记忆资产的链上逻辑：

- 用户账户管理
- 记忆资产铸造（集成 Bubblegum）
- 访问控制策略
- 资产转移
- 版本管理

### Minting Service

协调记忆上链流程：

- 批次管理（自动批处理优化成本）
- 加密 → Arweave 上传 → cNFT 铸造
- 异步队列处理
- 失败重试机制

### Encryption Service

端到端加密保护隐私：

- AES-256-GCM 加密
- 基于钱包签名的密钥派生
- 密钥轮换
- 安全密钥存储

### Indexer Service

快速查询链上数据：

- 监听链上事件
- 索引记忆资产
- Redis 缓存
- 100ms 内完成查询

### Access Control Service

细粒度访问控制：

- 钱包签名验证
- 时间和次数限制
- 访问策略管理
- 审计日志

## API 端点

### 上链单条记忆

```typescript
POST /v1/blockchain/memories/mint
{
  "memoryId": "mem-001",
  "options": {
    "encrypt": true,
    "priority": "normal"
  }
}

// 响应
{
  "success": true,
  "assetId": "asset-xyz",
  "transactionId": "tx-abc",
  "storageUri": "ipfs://Qm...",
  "cost": { "amount": 0.006, "currency": "USD" }
}
```

### 批量上链（节省成本）

```typescript
POST /v1/blockchain/memories/mint-batch
{
  "memoryIds": ["mem-001", "mem-002", "mem-003"],
  "options": { "encrypt": true }
}

// 批量上链可节省 30-50% 成本
```

### 查询已上链记忆

```typescript
GET /v1/blockchain/memories?walletAddress=xxx
```

### 转移记忆资产

```typescript
POST /v1/blockchain/memories/transfer
{
  "assetId": "asset-xyz",
  "to": "recipient_wallet_address"
}
```

### 授予访问权限

```typescript
POST /v1/blockchain/memories/:assetId/grant
{
  "grantee": "wallet_address",
  "permissions": ["read"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

## 成本分析

### Solana + IPFS（默认配置）

| 操作 | 成本 | 说明 |
|------|------|------|
| 单条上链 | ~$0.006 | Solana cNFT + IPFS 存储 |
| 批量上链（10+） | ~$0.005/条 | 节省 ~17% |
| 批量上链（50+） | ~$0.004/条 | 节省 ~33% |
| 批量上链（100+） | ~$0.003/条 | 节省 ~50% |

### 月度成本估算

| 使用量 | 单条上链 | 批量上链 |
|--------|---------|---------|
| 10 条/月 | $0.06 | $0.05 |
| 100 条/月 | $0.60 | $0.40 |
| 1000 条/月 | $6.00 | $4.00 |

**建议**：使用批量上链可显著降低成本！

## 开发

### 运行测试

```bash
# Solana Program 测试
cd blockchain/programs/memory-asset
anchor test

# 服务测试
yarn test
```

### 本地开发

```bash
# 启动本地验证器
solana-test-validator

# 部署到本地
anchor deploy --provider.cluster localnet

# 启动服务
yarn dev
```

## 部署

### Devnet 部署

```bash
# 1. 构建 Program
anchor build

# 2. 部署
anchor deploy --provider.cluster devnet

# 3. 更新 Program ID
# 将输出的 Program ID 更新到 .env 文件

# 4. 部署服务
docker-compose -f docker-compose.blockchain.yml up -d
```

### Mainnet 部署

```bash
# 1. 审计代码
# 2. 配置 Mainnet
solana config set --url https://api.mainnet-beta.solana.com

# 3. 部署
anchor deploy --provider.cluster mainnet-beta

# 4. 验证部署
solana program show <PROGRAM_ID>
```

## 监控

### 关键指标

- 交易成功率
- 平均确认时间
- Gas 成本
- Arweave 上传成功率
- 记忆铸造数量

### Grafana 仪表板

访问 http://localhost:3001 查看实时监控数据。

## 安全

### 最佳实践

1. **永远不要**将私钥提交到代码库
2. 使用环境变量管理敏感配置
3. 定期轮换加密密钥
4. 启用审计日志
5. 限制 RPC 访问

### 审计

- Solana Program 已通过安全审计（待完成）
- 加密实现遵循 NIST 标准
- 定期进行渗透测试

## 故障排查

### 常见问题

**Q: 交易失败 "Insufficient funds"**
A: 运行 `solana airdrop 2` 获取更多测试 SOL

**Q: Arweave 上传失败**
A: 检查 Arweave 钱包余额，或切换到 Bundlr

**Q: 索引器同步慢**
A: 考虑使用 Helius RPC 提高性能

## 文档

- 📖 [用户指南](./USER_GUIDE.md) - 快速上手
- 🔧 [配置指南](./CONFIGURATION_GUIDE.md) - 详细配置
- 💡 [上链决策指南](./MEMORY_MINTING_GUIDE.md) - 哪些记忆应该上链
- 🏗️ [模块化架构](./MODULAR_ARCHITECTURE.md) - 技术架构
- 📚 [API 参考](./sdk/API_REFERENCE.md) - API 文档
- 🛠️ [SDK 指南](./sdk/SDK_GUIDE.md) - SDK 使用

## 外部资源

- [Solana 文档](https://docs.solana.com)
- [Metaplex Bubblegum](https://docs.metaplex.com/programs/compression)
- [IPFS 文档](https://docs.ipfs.tech)
- [Pinata 文档](https://docs.pinata.cloud)

## 许可证

MIT
