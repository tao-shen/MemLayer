# 快速实现指南 - 剩余组件

本指南提供了完成剩余组件的快速实现方案。

## 🎯 待实现组件

### 1. MintingCoordinator (优先级: 高)

**预计时间**: 2-3 天  
**依赖**: BatchManager, CostEstimator, EncryptionService, ArweaveService

**实现要点**:

```typescript
// blockchain/services/minting-service/src/services/minting-coordinator.ts

import { IMintingCoordinator } from '../interfaces';
import { EncryptionService } from '@blockchain/encryption';
import { UploadManager } from '@blockchain/arweave';
import { TransactionBuilder } from './transaction-builder';

export class MintingCoordinator implements IMintingCoordinator {
  constructor(
    private encryptionService: EncryptionService,
    private arweaveService: UploadManager,
    private transactionBuilder: TransactionBuilder
  ) {}

  async coordinateMint(request: MintRequest): Promise<MintResult> {
    const startTime = Date.now();
    
    try {
      // 1. 加密内容
      const encrypted = await this.encryptionService.encrypt(
        request.memory.content,
        request.walletAddress
      );
      
      // 2. 上传到 Arweave
      const arweaveResult = await this.arweaveService.upload(
        Buffer.from(JSON.stringify(encrypted)),
        this.buildTags(request.memory)
      );
      
      // 3. 构建并发送交易
      const transaction = await this.transactionBuilder.buildMintTransaction(
        request.walletAddress,
        arweaveResult.txId,
        request.memory.metadata
      );
      
      const signature = await this.transactionBuilder.sendAndConfirmTransaction(
        transaction
      );
      
      // 4. 返回结果
      return {
        requestId: request.requestId,
        assetId: signature, // 使用交易签名作为资产 ID
        arweaveId: arweaveResult.txId,
        transactionSignature: signature,
        cost: await this.calculateCost(request),
        timestamp: new Date(),
        status: 'success',
      };
    } catch (error) {
      // 错误处理和回滚
      await this.rollbackMint(request.requestId);
      throw error;
    }
  }

  async coordinateBatchMint(request: BatchMintRequest): Promise<BatchMintResult> {
    // 批量铸造逻辑
    const results: MintResult[] = [];
    
    for (const memory of request.memories) {
      try {
        const result = await this.coordinateMint({
          ...request,
          memory,
        });
        results.push(result);
      } catch (error) {
        // 记录失败但继续处理
        logger.error('Batch mint item failed', { error });
      }
    }
    
    return {
      batchId: generateBatchId(),
      assetIds: results.map(r => r.assetId),
      totalCost: this.sumCosts(results),
      successCount: results.length,
      failedCount: request.memories.length - results.length,
      results,
      timestamp: new Date(),
    };
  }

  async rollbackMint(requestId: string): Promise<void> {
    // 实现回滚逻辑
    logger.info('Rolling back mint', { requestId });
    // 清理状态、取消交易等
  }
}
```

### 2. TransactionBuilder (优先级: 高)

**预计时间**: 2-3 天  
**依赖**: @solana/web3.js, @metaplex-foundation/mpl-bubblegum

**实现要点**:

```typescript
// blockchain/services/minting-service/src/services/transaction-builder.ts

import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { ITransactionBuilder } from '../interfaces';

export class TransactionBuilder implements ITransactionBuilder {
  private connection: Connection;
  private wallet: Keypair;

  constructor(config: ServiceConfig) {
    this.connection = new Connection(config.solana.rpcUrl);
    this.wallet = Keypair.fromSecretKey(
      bs58.decode(config.solana.walletPrivateKey)
    );
  }

  async buildMintTransaction(
    walletAddress: string,
    arweaveId: string,
    metadata: any
  ): Promise<Transaction> {
    // 1. 获取 Program ID
    const programId = new PublicKey(this.config.solana.programId);
    
    // 2. 构建指令
    const instruction = await this.buildMintInstruction(
      walletAddress,
      arweaveId,
      metadata
    );
    
    // 3. 创建交易
    const transaction = new Transaction();
    transaction.add(instruction);
    
    // 4. 设置最近的 blockhash
    const { blockhash } = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.wallet.publicKey;
    
    return transaction;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    transaction.sign(this.wallet);
    return transaction;
  }

  async sendAndConfirmTransaction(transaction: Transaction): Promise<string> {
    // 签名
    const signed = await this.signTransaction(transaction);
    
    // 发送
    const signature = await this.connection.sendRawTransaction(
      signed.serialize()
    );
    
    // 等待确认
    await this.connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  }

  async calculatePriorityFee(priority: 'low' | 'medium' | 'high'): Promise<number> {
    const fees = {
      low: 5000,
      medium: 10000,
      high: 20000,
    };
    return fees[priority];
  }
}
```

### 3. QueueProcessor (优先级: 高)

**预计时间**: 2-3 天  
**依赖**: Bull, Redis

**实现要点**:

```typescript
// blockchain/services/minting-service/src/services/queue-processor.ts

import Bull from 'bull';
import { IQueueProcessor } from '../interfaces';

export class QueueProcessor implements IQueueProcessor {
  private queue: Bull.Queue;

  constructor(config: ServiceConfig) {
    this.queue = new Bull(config.queue.name, {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      },
    });

    // 设置处理器
    this.queue.process(config.queue.concurrency, async (job) => {
      return await this.processJob(job.id);
    });
  }

  async addJob(jobData: MintJobData): Promise<string> {
    const job = await this.queue.add(jobData, {
      attempts: this.config.queue.maxRetries,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    
    return job.id.toString();
  }

  async processJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (!job) throw new Error('Job not found');
    
    const data = job.data as MintJobData;
    
    // 处理铸造请求
    await this.coordinator.coordinateMint({
      requestId: data.requestId,
      walletAddress: data.walletAddress,
      memory: data.memory,
      options: data.options,
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;
    
    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress(),
      data: job.data,
    };
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId);
    if (!job) return false;
    
    await job.remove();
    return true;
  }

  async getQueueStats(): Promise<any> {
    return {
      waiting: await this.queue.getWaitingCount(),
      active: await this.queue.getActiveCount(),
      completed: await this.queue.getCompletedCount(),
      failed: await this.queue.getFailedCount(),
    };
  }
}
```

### 4. StateManager (优先级: 中)

**预计时间**: 1-2 天  
**依赖**: Redis, PostgreSQL

**实现要点**:

```typescript
// blockchain/services/minting-service/src/services/state-manager.ts

import Redis from 'ioredis';
import { Pool } from 'pg';
import { IStateManager } from '../interfaces';

export class StateManager implements IStateManager {
  private redis: Redis;
  private pg: Pool;

  constructor(config: ServiceConfig) {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });

    this.pg = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
    });
  }

  async saveMintState(requestId: string, state: MintStatus): Promise<void> {
    // 保存到 Redis (临时)
    await this.redis.setex(
      `mint:${requestId}`,
      3600, // 1 hour TTL
      JSON.stringify(state)
    );
    
    // 保存到 PostgreSQL (持久化)
    await this.pg.query(
      'INSERT INTO mint_states (request_id, state, created_at) VALUES ($1, $2, $3)',
      [requestId, JSON.stringify(state), new Date()]
    );
  }

  async getMintState(requestId: string): Promise<MintStatus | null> {
    // 先从 Redis 获取
    const cached = await this.redis.get(`mint:${requestId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 从 PostgreSQL 获取
    const result = await this.pg.query(
      'SELECT state FROM mint_states WHERE request_id = $1',
      [requestId]
    );
    
    if (result.rows.length === 0) return null;
    
    const state = JSON.parse(result.rows[0].state);
    
    // 回填到 Redis
    await this.redis.setex(
      `mint:${requestId}`,
      3600,
      JSON.stringify(state)
    );
    
    return state;
  }

  async updateMintState(
    requestId: string,
    updates: Partial<MintStatus>
  ): Promise<void> {
    const current = await this.getMintState(requestId);
    if (!current) throw new Error('State not found');
    
    const updated = { ...current, ...updates };
    await this.saveMintState(requestId, updated);
  }

  async deleteMintState(requestId: string): Promise<void> {
    await this.redis.del(`mint:${requestId}`);
    await this.pg.query(
      'DELETE FROM mint_states WHERE request_id = $1',
      [requestId]
    );
  }
}
```

## 📝 实现步骤

### 第 1 周

**Day 1-2**: MintingCoordinator
- 实现基本流程
- 添加错误处理
- 编写单元测试

**Day 3-4**: TransactionBuilder
- 实现交易构建
- 集成 Solana SDK
- 测试交易发送

**Day 5**: QueueProcessor
- 集成 Bull 队列
- 实现任务处理
- 测试重试机制

### 第 2 周

**Day 1**: StateManager
- 实现状态管理
- Redis + PostgreSQL 集成
- 测试状态持久化

**Day 2-3**: 集成测试
- 端到端测试
- 性能测试
- 错误场景测试

**Day 4-5**: 文档和优化
- 更新文档
- 代码优化
- Bug 修复

## 🧪 测试策略

### 单元测试

```typescript
describe('MintingCoordinator', () => {
  it('should coordinate mint successfully', async () => {
    const result = await coordinator.coordinateMint(mockRequest);
    expect(result.status).toBe('success');
  });

  it('should rollback on failure', async () => {
    // 测试失败回滚
  });
});
```

### 集成测试

```typescript
describe('End-to-End Minting', () => {
  it('should mint memory from request to confirmation', async () => {
    // 完整流程测试
  });
});
```

## 📚 参考资源

- [Solana Web3.js 文档](https://solana-labs.github.io/solana-web3.js/)
- [Metaplex Bubblegum 文档](https://docs.metaplex.com/programs/compression)
- [Bull 队列文档](https://github.com/OptimalBits/bull)
- [Redis 文档](https://redis.io/documentation)

## 🎯 成功标准

- [ ] 所有组件实现完成
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] 文档更新完成
- [ ] 代码审查通过

---

**预计完成时间**: 2 周  
**优先级**: 高  
**状态**: 待开始
