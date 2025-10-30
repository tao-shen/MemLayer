# Blockchain Memory Assets

基于 Solana + 压缩 NFT (Bubblegum) + Arweave 的链上记忆资产化模块。

## 概述

此模块将 AI Agent 的记忆数据转化为可验证、可交易的个人数字资产，实现：

- ✅ 极低成本上链（$0.006/记忆，比传统 NFT 便宜 99.5%）
- ✅ 高吞吐量（支持每秒 100+ 记忆上链）
- ✅ 永久存储（Arweave 确保数据永不丢失）
- ✅ 端到端加密（AES-256-GCM + 链下密钥管理）
- ✅ 真正所有权（用户完全控制记忆资产）

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

### 1. 环境搭建

```bash
# 运行自动安装脚本
./scripts/setup-solana-dev.sh

# 验证环境
./scripts/verify-solana-env.sh
```

### 2. 安装依赖

```bash
# 安装 Node.js 依赖
yarn install

# 构建 Solana Program
cd blockchain/programs/memory-asset
anchor build
```

### 3. 部署到 Devnet

```bash
# 部署 Solana Program
anchor deploy --provider.cluster devnet

# 启动服务
yarn workspace @blockchain/minting-service start
```

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

### 记忆上链

```typescript
POST /v1/blockchain/memories/mint
{
  "memory": {
    "content": "记忆内容",
    "metadata": { "agentId": "agent-001" }
  },
  "signature": "wallet_signature"
}
```

### 批量上链

```typescript
POST /v1/blockchain/memories/mint-batch
{
  "memories": [...],
  "signature": "wallet_signature"
}
```

### 查询记忆资产

```typescript
GET /v1/blockchain/memories?walletAddress=xxx
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

### 单条记忆成本

- 压缩 NFT 铸造: ~0.00005 SOL (~$0.005)
- Arweave 存储 (1KB): ~0.00001 AR (~$0.0003)
- 交易费用: ~0.000005 SOL (~$0.0005)
- **总计**: ~$0.006/记忆

### 批量优化

- 50 条记忆批次: ~$0.004/记忆
- 100 条记忆批次: ~$0.003/记忆

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

## 资源

- [Solana 文档](https://docs.solana.com)
- [Anchor 文档](https://www.anchor-lang.com)
- [Metaplex Bubblegum](https://docs.metaplex.com/programs/compression)
- [Arweave 文档](https://docs.arweave.org)

## 许可证

MIT
