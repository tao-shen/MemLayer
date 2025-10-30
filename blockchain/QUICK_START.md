# Blockchain Memory Assets - 快速开始指南

## 🚀 5 分钟快速上手

### 前置要求

```bash
# 检查版本
node --version  # >= 18.0.0
rustc --version # >= 1.70.0
solana --version # >= 1.16.0
anchor --version # >= 0.29.0
```

### 1. 克隆和安装

```bash
# 克隆仓库
git clone <repository-url>
cd blockchain

# 安装依赖
npm install

# 设置 Solana 环境
./scripts/setup-solana-dev.sh
```

### 2. 配置环境

```bash
# 复制环境变量
cp .env.example .env

# 编辑配置（使用你喜欢的编辑器）
vim .env
```

**最小配置**:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=your_program_id_here
ARWEAVE_WALLET_PATH=./arweave-wallet.json
```

### 3. 构建和测试

```bash
# 构建 Solana Program
cd programs/memory-asset
anchor build

# 运行测试
anchor test

# 部署到 Devnet
anchor deploy --provider.cluster devnet
```

### 4. 启动服务

```bash
# 返回根目录
cd ../..

# 启动 Minting Service
cd services/minting-service
npm install
npm run dev
```

## 📝 基本使用

### 铸造单条记忆

```typescript
import { BatchManager } from '@blockchain/minting-service';

const batchManager = new BatchManager(config);

const request = {
  walletAddress: 'YourWalletAddress',
  signature: 'YourSignature',
  memory: {
    content: 'This is my memory',
    metadata: {
      type: 'episodic',
      tags: ['important'],
    },
    agentId: 'agent-001',
    timestamp: new Date(),
  },
};

const requestId = await batchManager.addToBatch(request);
console.log('Request ID:', requestId);
```

### 批量铸造

```typescript
// 添加多条记忆
for (let i = 0; i < 10; i++) {
  await batchManager.addToBatch({
    ...request,
    memory: {
      ...request.memory,
      content: `Memory ${i}`,
    },
  });
}

// 批次会自动触发处理
```

### 成本估算

```typescript
import { CostEstimator } from '@blockchain/minting-service';

const estimator = new CostEstimator(config);

// 估算 10 条记忆的成本
const estimate = await estimator.estimateTotalCost(10, 10000);

console.log('Total cost:', estimate.estimatedCost.totalSOL, 'SOL');
console.log('Per memory:', estimate.breakdown.perMemory.totalSOL, 'SOL');
```

## 🔧 常用命令

### Solana

```bash
# 查看余额
solana balance

# 获取测试 SOL
solana airdrop 2

# 查看 Program
solana program show <PROGRAM_ID>

# 查看日志
solana logs <PROGRAM_ID>
```

### Anchor

```bash
# 构建
anchor build

# 测试
anchor test

# 部署
anchor deploy --provider.cluster devnet

# 升级
anchor upgrade <PROGRAM_ID> --program-id <PROGRAM_ID>
```

### 服务管理

```bash
# 启动服务
npm run dev

# 构建
npm run build

# 生产模式
npm start

# 测试
npm test
```

## 📊 监控和调试

### 查看日志

```bash
# 服务日志
tail -f logs/combined.log

# 错误日志
tail -f logs/error.log

# Solana 日志
solana logs <PROGRAM_ID>
```

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3001/health

# 检查批次统计
curl http://localhost:3001/stats
```

## 🐛 常见问题

### Q: 交易失败 "Insufficient funds"

```bash
# 获取更多测试 SOL
solana airdrop 2

# 检查余额
solana balance
```

### Q: Arweave 上传失败

```bash
# 检查 Arweave 钱包余额
# 或使用 Bundlr Network

# 在 .env 中配置
USE_BUNDLR=true
```

### Q: 批次没有自动触发

```bash
# 检查配置
BATCH_SIZE=50          # 批次大小
BATCH_TIMEOUT_MS=5000  # 超时时间（毫秒）

# 或手动触发
await batchManager.processBatches();
```

### Q: 编译错误

```bash
# 清理并重新构建
anchor clean
anchor build

# 更新依赖
cargo update
```

## 📚 更多资源

### 文档

- [完整文档](./docs/)
- [API 参考](./docs/API_GUIDE.md)
- [架构设计](./docs/ARCHITECTURE.md)
- [部署指南](./docs/DEPLOYMENT.md)

### 示例

- [Encryption Service 示例](./services/encryption/examples/)
- [Arweave Service 示例](./services/arweave/src/example-usage.ts)
- [Batch Manager 示例](./services/minting-service/src/services/examples/)

### 社区

- GitHub Issues
- Discord
- Twitter

## 🎯 下一步

1. 阅读[架构文档](./docs/ARCHITECTURE.md)了解系统设计
2. 查看[API 文档](./docs/API_GUIDE.md)了解接口详情
3. 运行[示例代码](./services/)学习使用方法
4. 加入社区讨论和贡献

## 💡 提示

- 使用 Devnet 进行开发和测试
- 启用日志以便调试
- 定期备份钱包
- 监控成本和性能
- 参与社区讨论

---

**需要帮助？** 查看[故障排查指南](./docs/TROUBLESHOOTING.md)或提交 Issue。
