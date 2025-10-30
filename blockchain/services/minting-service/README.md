# Memory Minting Service

Memory Minting Service 是区块链记忆资产化方案的核心服务，负责协调记忆的加密、上传和铸造流程。

## 功能特性

- **单条记忆铸造**: 将单条记忆铸造为压缩 NFT
- **批量铸造**: 支持批量记忆铸造，优化成本和性能
- **异步队列处理**: 使用 Bull 队列处理铸造请求
- **成本估算**: 提供准确的成本估算
- **状态管理**: 持久化铸造状态，支持查询和恢复
- **错误处理**: 完善的错误处理和重试机制
- **监控指标**: 提供详细的服务指标和健康检查

## 架构

```
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Memory Minting Service            │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Minting Coordinator         │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼──────────┐           │
│  │  Batch Manager      │           │
│  └──────────┬──────────┘           │
│             │                       │
│  ┌──────────▼──────────┐           │
│  │  Queue Processor    │           │
│  └──────────┬──────────┘           │
│             │                       │
│  ┌──────────▼──────────┐           │
│  │  Transaction Builder│           │
│  └─────────────────────┘           │
└─────────────────────────────────────┘
         │         │
         ▼         ▼
┌──────────────┐ ┌──────────────┐
│ Encryption   │ │  Arweave     │
│ Service      │ │  Service     │
└──────────────┘ └──────────────┘
         │
         ▼
┌──────────────────┐
│ Solana Program   │
└──────────────────┘
```

## 安装

```bash
cd blockchain/services/minting-service
npm install
```

## 配置

复制 `.env.example` 到 `.env` 并配置环境变量：

```bash
cp .env.example .env
```

### 必需配置

- `SOLANA_RPC_URL`: Solana RPC 节点地址
- `PROGRAM_ID`: Memory Asset Program ID
- `WALLET_PRIVATE_KEY`: 钱包私钥（Base58 编码）
- `ARWEAVE_WALLET_PATH`: Arweave 钱包文件路径
- `POSTGRES_PASSWORD`: PostgreSQL 密码

### 可选配置

- `BATCH_SIZE`: 批次大小（默认 50）
- `BATCH_TIMEOUT_MS`: 批次超时时间（默认 5000ms）
- `QUEUE_CONCURRENCY`: 队列并发数（默认 5）
- `DEFAULT_PRIORITY_FEE`: 默认优先费用（默认 5000 lamports）

## 使用

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm run build
npm start
```

### 运行测试

```bash
npm test
```

## API 接口

### 单条记忆铸造

```typescript
POST /mint

Request:
{
  "walletAddress": "string",
  "signature": "string",
  "memory": {
    "content": "string",
    "metadata": {
      "type": "episodic",
      "tags": ["tag1", "tag2"],
      "importance": 0.8
    },
    "agentId": "string",
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "options": {
    "priority": "medium",
    "batch": false
  }
}

Response:
{
  "requestId": "string",
  "assetId": "string",
  "arweaveId": "string",
  "transactionSignature": "string",
  "cost": {
    "solanaTransaction": 5000,
    "arweaveStorage": 1000,
    "priorityFee": 5000,
    "total": 11000,
    "totalSOL": 0.000011,
    "totalAR": 0.000001
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "status": "success"
}
```

### 批量铸造

```typescript
POST /mint-batch

Request:
{
  "walletAddress": "string",
  "signature": "string",
  "memories": [
    {
      "content": "string",
      "metadata": {...},
      "agentId": "string",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "options": {
    "priority": "medium"
  }
}

Response:
{
  "batchId": "string",
  "assetIds": ["string"],
  "totalCost": {...},
  "successCount": 10,
  "failedCount": 0,
  "results": [...],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 查询铸造状态

```typescript
GET /mint/:requestId

Response:
{
  "requestId": "string",
  "status": "completed",
  "progress": 100,
  "currentStep": "minting",
  "result": {...}
}
```

### 成本估算

```typescript
GET /estimate?memoryCount=10

Response:
{
  "memoryCount": 10,
  "estimatedCost": {
    "solanaTransaction": 50000,
    "arweaveStorage": 10000,
    "priorityFee": 50000,
    "total": 110000,
    "totalSOL": 0.00011,
    "totalAR": 0.00001
  },
  "breakdown": {
    "perMemory": {...},
    "batchOverhead": {...}
  }
}
```

### 健康检查

```typescript
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "solana": { "status": "up", "latency": 100 },
    "arweave": { "status": "up", "latency": 200 },
    "redis": { "status": "up", "latency": 5 },
    "postgres": { "status": "up", "latency": 10 },
    "queue": { "status": "up" }
  },
  "metrics": {
    "totalMinted": 1000,
    "successRate": 0.99,
    "averageProcessingTime": 5000,
    "queueSize": 10
  }
}
```

## 核心组件

### Minting Coordinator

协调整个铸造流程：
1. 验证请求
2. 加密记忆内容
3. 上传到 Arweave
4. 构建 Solana 交易
5. 发送交易并确认
6. 更新状态

### Batch Manager

管理批量铸造：
- 维护批次队列
- 自动触发批次处理
- 优化批次大小
- 跟踪批次状态

### Transaction Builder

构建 Solana 交易：
- 创建铸造指令
- 计算优先费用
- 签名交易
- 发送和确认交易

### Queue Processor

异步队列处理：
- 使用 Bull 队列
- 支持重试策略
- 并发控制
- 任务调度

### Cost Estimator

成本估算：
- Solana 交易成本
- Arweave 存储成本
- 动态定价
- 批次优化

### State Manager

状态管理：
- Redis 缓存
- PostgreSQL 持久化
- 状态查询
- 状态恢复

## 错误处理

服务提供完善的错误处理：

```typescript
try {
  const result = await mintingService.mintMemory(request);
} catch (error) {
  if (error instanceof MintingError) {
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Is retryable:', error.isRetryable());
    
    switch (error.code) {
      case MintingErrorCode.INSUFFICIENT_BALANCE:
        // Handle insufficient balance
        break;
      case MintingErrorCode.NETWORK_ERROR:
        // Handle network error
        break;
      // Handle other errors
    }
  }
}
```

## 监控

### Prometheus 指标

- `minting_requests_total`: 总请求数
- `minting_success_total`: 成功铸造数
- `minting_failed_total`: 失败铸造数
- `minting_duration_seconds`: 铸造耗时
- `minting_cost_lamports`: 铸造成本
- `batch_size`: 批次大小
- `queue_size`: 队列大小
- `queue_processing_duration_seconds`: 队列处理耗时

### 日志

日志文件位于 `logs/` 目录：
- `combined.log`: 所有日志
- `error.log`: 错误日志

## 性能优化

### 批处理

- 动态调整批次大小
- 智能批次合并
- 优化触发时机

### 并发控制

- 限制并发请求
- 请求队列
- 资源优化

### 缓存策略

- Redis 缓存状态
- 查询结果缓存
- 成本估算缓存

## 最佳实践

1. **使用批量铸造**: 对于多条记忆，使用批量铸造更经济高效
2. **设置合适的优先级**: 根据紧急程度选择优先级
3. **监控队列大小**: 避免队列积压
4. **定期检查健康状态**: 确保服务正常运行
5. **处理失败重试**: 实现适当的重试逻辑
6. **记录审计日志**: 保留完整的操作记录

## 故障排查

### 铸造失败

1. 检查钱包余额
2. 验证 RPC 节点连接
3. 查看错误日志
4. 检查 Arweave 网关状态

### 队列积压

1. 增加队列并发数
2. 优化批次大小
3. 检查下游服务状态
4. 清理失败任务

### 性能问题

1. 检查 RPC 节点延迟
2. 优化批次配置
3. 增加缓存 TTL
4. 使用负载均衡

## 开发

### 项目结构

```
src/
├── config/           # 配置管理
├── interfaces/       # 接口定义
├── services/         # 核心服务
│   ├── minting-service.ts
│   ├── batch-manager.ts
│   ├── minting-coordinator.ts
│   ├── transaction-builder.ts
│   ├── cost-estimator.ts
│   ├── queue-processor.ts
│   └── state-manager.ts
├── types/            # 类型定义
├── utils/            # 工具函数
│   ├── logger.ts
│   └── errors.ts
└── index.ts          # 入口文件
```

### 添加新功能

1. 在 `interfaces/` 定义接口
2. 在 `services/` 实现服务
3. 在 `types/` 添加类型
4. 更新 `index.ts` 导出
5. 编写测试
6. 更新文档

## 许可证

MIT
