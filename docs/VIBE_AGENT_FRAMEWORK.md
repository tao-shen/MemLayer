# Vibe Agent 框架设计文档

## 概述

Vibe Agent 是一个智能 Agent 生成系统，能够从原始数据（对话记录、代码、文档、行为日志等）中自动提取并构建：
1. **Workflow（工作流）**：Agent 执行任务的标准流程和步骤
2. **Behavior Style（行为风格）**：Agent 的个性、沟通方式、决策模式
3. **Memory（记忆）**：Agent 需要记住的关键信息和知识

本框架参考 Claude Skills 的设计理念，但提供了更强的自动化提取、持续学习和动态适应能力。

---

## 核心设计原则

### 1. 数据驱动（Data-Driven）
- 从真实交互数据中学习，而非手动配置
- 支持多种数据源：对话、代码、文档、日志、API调用等

### 2. 多层次提取（Multi-Level Extraction）
- **表层提取**：直接可观察的模式（如常用词汇、响应格式）
- **深层提取**：隐含的意图、偏好、决策逻辑
- **元层提取**：工作流模式、行为一致性、记忆关联性

### 3. 持续演化（Continuous Evolution）
- Agent 能够从新交互中学习和更新
- 支持版本控制和回滚
- 自动检测行为漂移（behavior drift）

### 4. 可解释性（Explainability）
- 每个提取的特征都有来源追溯
- 提供置信度评分
- 支持人工审核和调整

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     原始数据输入层                            │
│  (对话记录、代码、文档、日志、API调用、用户反馈等)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   数据预处理与标准化层                         │
│  - 数据清洗与去噪                                             │
│  - 格式统一化                                                 │
│  - 时间序列对齐                                               │
│  - 上下文重建                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   智能提取引擎层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Workflow     │  │ Behavior     │  │ Memory       │     │
│  │ Extractor    │  │ Style        │  │ Extractor    │     │
│  │              │  │ Extractor    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                 │
│                   交叉验证与一致性检查                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   结构化存储层                                │
│  - Workflow Graph (Neo4j)                                   │
│  - Behavior Profile (PostgreSQL + Vector)                  │
│  - Memory Index (Qdrant + PostgreSQL)                      │
│  - Metadata & Provenance                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Agent 运行时层                             │
│  - Workflow Executor                                        │
│  - Style Adapter                                            │
│  - Memory Retriever                                         │
│  - Behavior Monitor                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   反馈与学习循环                              │
│  - 交互日志收集                                               │
│  - 性能评估                                                   │
│  - 自动更新机制                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心组件详细设计

### 1. Workflow Extractor（工作流提取器）

#### 功能
从原始数据中识别和提取任务执行的工作流模式。

#### 提取维度

**1.1 任务分解模式（Task Decomposition）**
- 识别复杂任务如何被分解为子任务
- 提取任务间的依赖关系
- 识别并行 vs 串行执行模式

**1.2 决策点（Decision Points）**
- 识别条件分支逻辑
- 提取决策规则和触发条件
- 识别异常处理路径

**1.3 工具使用模式（Tool Usage）**
- 识别常用工具和API
- 提取工具调用序列
- 识别工具组合模式

**1.4 迭代与优化模式（Iteration Patterns）**
- 识别循环和迭代逻辑
- 提取优化策略
- 识别终止条件

#### 数据结构

```typescript
interface Workflow {
  id: string;
  agentId: string;
  name: string;
  description: string;
  version: number;
  
  // 工作流节点
  nodes: WorkflowNode[];
  
  // 工作流边（连接关系）
  edges: WorkflowEdge[];
  
  // 元数据
  metadata: {
    sourceData: string[];        // 来源数据ID
    confidence: number;           // 置信度 (0-1)
    extractionMethod: string;    // 提取方法
    lastUpdated: Date;
    usageCount: number;
    successRate: number;
  };
  
  // 执行统计
  statistics: {
    averageExecutionTime: number;
    successRate: number;
    commonFailures: string[];
  };
}

interface WorkflowNode {
  id: string;
  type: 'task' | 'decision' | 'tool' | 'condition' | 'loop';
  name: string;
  description: string;
  action?: string;              // 具体操作
  condition?: string;           // 条件表达式
  tool?: string;               // 使用的工具
  parameters?: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: 'sequential' | 'conditional' | 'parallel' | 'loop';
  condition?: string;          // 边条件
  weight?: number;             // 执行频率权重
}
```

#### 提取算法

**阶段1：模式识别**
- 使用 LLM 分析对话/代码，识别任务序列
- 使用图算法识别常见模式（如：if-then-else, loop, parallel）
- 使用序列模型识别时间模式

**阶段2：图构建**
- 将识别出的模式转换为有向图
- 识别关键节点（entry, exit, decision points）
- 计算节点重要性

**阶段3：验证与优化**
- 交叉验证多个数据源的一致性
- 识别并合并重复模式
- 计算置信度评分

---

### 2. Behavior Style Extractor（行为风格提取器）

#### 功能
从交互数据中提取 Agent 的个性特征、沟通风格和决策偏好。

#### 提取维度

**2.1 沟通风格（Communication Style）**
- **语气**：正式/非正式、友好/专业、简洁/详细
- **词汇偏好**：常用词汇、专业术语、俚语使用
- **响应长度**：简短/详细、是否使用列表/表格
- **表情符号使用**：频率、类型偏好

**2.2 决策风格（Decision Style）**
- **风险偏好**：保守/激进、是否主动询问确认
- **信息需求**：需要多少上下文才做决策
- **错误处理**：如何应对不确定性和错误
- **优先级判断**：如何权衡不同因素

**2.3 交互模式（Interaction Patterns）**
- **主动性**：主动提供信息 vs 等待询问
- **提问风格**：开放式/封闭式、澄清频率
- **反馈处理**：如何响应正面/负面反馈
- **个性化程度**：是否根据用户调整风格

**2.4 专业领域特征（Domain Characteristics）**
- **专业知识深度**：技术术语使用、概念解释方式
- **最佳实践遵循**：是否遵循行业标准
- **创新性**：是否提出新颖方案

#### 数据结构

```typescript
interface BehaviorStyle {
  id: string;
  agentId: string;
  version: number;
  
  // 沟通风格
  communication: {
    tone: 'formal' | 'casual' | 'friendly' | 'professional';
    verbosity: 'concise' | 'moderate' | 'detailed';
    structure: {
      useLists: boolean;
      useTables: boolean;
      useCodeBlocks: boolean;
      useExamples: boolean;
    };
    vocabulary: {
      commonTerms: string[];
      technicalTerms: string[];
      avoidTerms: string[];
    };
    emojiUsage: {
      frequency: 'never' | 'rare' | 'occasional' | 'frequent';
      preferredTypes: string[];
    };
  };
  
  // 决策风格
  decisionMaking: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    confirmationNeeded: boolean;
    contextRequirement: 'minimal' | 'moderate' | 'extensive';
    errorHandling: 'defensive' | 'graceful' | 'transparent';
    priorityFactors: string[];  // 优先级考虑因素
  };
  
  // 交互模式
  interaction: {
    proactivity: 'reactive' | 'balanced' | 'proactive';
    questionStyle: 'open' | 'closed' | 'mixed';
    clarificationFrequency: 'low' | 'medium' | 'high';
    feedbackResponse: {
      positive: 'acknowledge' | 'elaborate' | 'suggest';
      negative: 'apologize' | 'explain' | 'adapt';
    };
    personalization: 'none' | 'light' | 'heavy';
  };
  
  // 专业特征
  domain: {
    expertiseLevel: 'beginner' | 'intermediate' | 'expert';
    bestPractices: string[];
    innovationTendency: 'low' | 'medium' | 'high';
  };
  
  // 元数据
  metadata: {
    sourceData: string[];
    confidence: number;
    extractionMethod: string;
    lastUpdated: Date;
    sampleCount: number;        // 基于多少样本提取
  };
  
  // 向量表示（用于相似度计算）
  embedding?: number[];
}
```

#### 提取算法

**阶段1：文本分析**
- 使用 LLM 分析对话样本，提取风格特征
- 使用 NLP 工具分析语言特征（词频、句长、复杂度）
- 使用情感分析识别语气倾向

**阶段2：模式统计**
- 统计响应长度分布
- 统计工具使用频率
- 统计错误处理方式
- 统计提问模式

**阶段3：向量化与聚类**
- 将行为特征向量化
- 识别行为模式簇
- 计算与标准风格的相似度

**阶段4：一致性验证**
- 检查不同时间段的风格一致性
- 识别风格变化点
- 生成风格演化轨迹

---

### 3. Memory Extractor（记忆提取器）

#### 功能
从原始数据中识别需要长期记住的关键信息、知识和经验。

#### 提取维度

**3.1 事实性记忆（Factual Memory）**
- 用户信息：姓名、偏好、设置
- 项目信息：配置、依赖、约定
- 领域知识：术语、概念、关系

**3.2 程序性记忆（Procedural Memory）**
- 成功的工作流模式
- 有效的工具组合
- 问题解决方案

**3.3 情景记忆（Episodic Memory）**
- 重要交互事件
- 关键决策时刻
- 错误和恢复经验

**3.4 语义记忆（Semantic Memory）**
- 概念定义和关系
- 知识图谱节点
- 抽象模式

#### 数据结构

```typescript
interface ExtractedMemory {
  id: string;
  agentId: string;
  type: 'factual' | 'procedural' | 'episodic' | 'semantic';
  
  // 记忆内容
  content: string;
  summary: string;
  
  // 重要性评分
  importance: number;  // 0-100
  
  // 关联信息
  entities: string[];           // 涉及的实体
  relationships: string[];      // 关系类型
  tags: string[];
  
  // 来源追溯
  source: {
    dataId: string;             // 原始数据ID
    excerpt: string;            // 原文片段
    context: string;            // 上下文
    timestamp: Date;
  };
  
  // 使用统计
  usage: {
    accessCount: number;
    lastAccessed: Date;
    effectiveness: number;     // 使用效果评分
  };
  
  // 元数据
  metadata: {
    confidence: number;
    extractionMethod: string;
    verified: boolean;          // 是否人工验证
    expiresAt?: Date;          // 过期时间（可选）
  };
  
  // 向量嵌入
  embedding: number[];
}
```

#### 提取算法

**阶段1：重要性评估**
- 使用 LLM 评估信息的重要性
- 识别重复出现的模式
- 识别用户明确强调的信息

**阶段2：记忆分类**
- 根据内容类型分类
- 识别实体和关系
- 提取关键概念

**阶段3：去重与合并**
- 识别重复记忆
- 合并相似记忆
- 更新已有记忆

**阶段4：结构化存储**
- 存储到向量数据库（用于检索）
- 存储到知识图谱（用于关系查询）
- 存储到关系数据库（用于元数据查询）

---

## 数据流设计

### 输入数据格式

```typescript
interface RawData {
  id: string;
  type: 'conversation' | 'code' | 'document' | 'log' | 'api_call' | 'feedback';
  content: string | object;
  metadata: {
    timestamp: Date;
    source: string;
    userId?: string;
    sessionId?: string;
    tags?: string[];
  };
  context?: {
    previousMessages?: string[];
    environment?: Record<string, any>;
    userProfile?: Record<string, any>;
  };
}
```

### 提取流程

```typescript
interface ExtractionPipeline {
  // 1. 数据预处理
  preprocess(data: RawData[]): ProcessedData[];
  
  // 2. 并行提取
  extractWorkflow(data: ProcessedData[]): Promise<Workflow>;
  extractBehaviorStyle(data: ProcessedData[]): Promise<BehaviorStyle>;
  extractMemory(data: ProcessedData[]): Promise<ExtractedMemory[]>;
  
  // 3. 交叉验证
  validate(
    workflow: Workflow,
    behavior: BehaviorStyle,
    memories: ExtractedMemory[]
  ): ValidationResult;
  
  // 4. 存储
  store(
    agentId: string,
    workflow: Workflow,
    behavior: BehaviorStyle,
    memories: ExtractedMemory[]
  ): Promise<void>;
}
```

---

## Agent 运行时集成

### Workflow Executor

```typescript
class WorkflowExecutor {
  async execute(
    workflow: Workflow,
    input: any,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    // 1. 找到入口节点
    // 2. 按工作流图执行
    // 3. 处理决策点
    // 4. 调用工具
    // 5. 记录执行轨迹
  }
}
```

### Style Adapter

```typescript
class StyleAdapter {
  adaptResponse(
    rawResponse: string,
    behaviorStyle: BehaviorStyle
  ): string {
    // 根据行为风格调整响应
    // - 调整语气
    // - 调整长度
    // - 调整格式
    // - 添加个性化元素
  }
}
```

### Memory Retriever

```typescript
class MemoryRetriever {
  async retrieve(
    query: string,
    agentId: string,
    context: RetrievalContext
  ): Promise<ExtractedMemory[]> {
    // 1. 向量相似度搜索
    // 2. 知识图谱查询
    // 3. 时间相关性加权
    // 4. 重要性加权
    // 5. 返回最相关的记忆
  }
}
```

---

## 数据库 Schema 扩展

### Workflow 表

```prisma
model Workflow {
  id          String   @id @default(uuid())
  agentId     String   @map("agent_id")
  name        String
  description String?
  version     Int      @default(1)
  graph       Json     // 工作流图结构
  metadata    Json     @default("{}")
  statistics  Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  agent Agent @relation(fields: [agentId], references: [id])
  
  @@index([agentId])
  @@map("workflows")
}
```

### BehaviorStyle 表

```prisma
model BehaviorStyle {
  id          String   @id @default(uuid())
  agentId    String   @map("agent_id")
  version     Int      @default(1)
  style       Json     // BehaviorStyle 对象
  embedding   Json?    // 向量表示
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  agent Agent @relation(fields: [agentId], references: [id])
  
  @@index([agentId])
  @@map("behavior_styles")
}
```

### ExtractedMemory 表

```prisma
model ExtractedMemory {
  id          String   @id @default(uuid())
  agentId     String   @map("agent_id")
  type        String   // factual, procedural, episodic, semantic
  content     String   @db.Text
  summary     String?
  importance  Decimal  @db.Decimal(5, 2)
  embedding   Json?    // 向量嵌入
  source      Json     // 来源信息
  usage       Json     @default("{}")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  agent Agent @relation(fields: [agentId], references: [id])
  
  @@index([agentId])
  @@index([type])
  @@index([importance(sort: Desc)])
  @@map("extracted_memories")
}
```

### RawData 表

```prisma
model RawData {
  id        String   @id @default(uuid())
  agentId   String?  @map("agent_id")
  type      String   // conversation, code, document, etc.
  content   Json     // 原始内容
  metadata  Json     @default("{}")
  context   Json?
  processed Boolean  @default(false)
  createdAt DateTime @default(now())
  
  agent Agent? @relation(fields: [agentId], references: [id])
  
  @@index([agentId])
  @@index([type])
  @@index([processed])
  @@map("raw_data")
}
```

---

## API 设计

### 1. 数据上传

```typescript
POST /v1/vibe-agent/data
Body: {
  agentId?: string;      // 可选，如果已有agent
  data: RawData[];
  options?: {
    extractWorkflow?: boolean;
    extractBehavior?: boolean;
    extractMemory?: boolean;
  };
}

Response: {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}
```

### 2. 提取状态查询

```typescript
GET /v1/vibe-agent/jobs/:jobId

Response: {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    workflow: number;      // 0-100
    behavior: number;
    memory: number;
  };
  results?: {
    workflow?: Workflow;
    behavior?: BehaviorStyle;
    memories?: ExtractedMemory[];
  };
  errors?: string[];
}
```

### 3. Agent 创建（从提取结果）

```typescript
POST /v1/vibe-agent/agents
Body: {
  name: string;
  jobId: string;          // 提取任务ID
  config?: {
    // 可选的额外配置
  };
}

Response: {
  agentId: string;
  workflow: Workflow;
  behavior: BehaviorStyle;
  memoryCount: number;
}
```

### 4. Agent 更新

```typescript
PUT /v1/vibe-agent/agents/:agentId
Body: {
  data?: RawData[];       // 新数据
  updateMode?: 'merge' | 'replace' | 'incremental';
}

Response: {
  agentId: string;
  updated: {
    workflow: boolean;
    behavior: boolean;
    memory: boolean;
  };
  version: number;
}
```

---

## 关键技术考虑

### 1. 提取质量保证

- **多模型投票**：使用多个 LLM 模型提取，取一致性结果
- **置信度评分**：为每个提取结果计算置信度
- **人工审核接口**：提供人工审核和修正机制
- **A/B 测试**：对比不同提取方法的效果

### 2. 性能优化

- **增量提取**：只处理新数据，避免重复处理
- **并行处理**：三个提取器并行运行
- **缓存机制**：缓存中间结果和向量嵌入
- **异步处理**：大任务异步处理，返回任务ID

### 3. 可扩展性

- **插件化提取器**：支持自定义提取器
- **多数据源适配器**：支持新的数据源类型
- **分布式处理**：支持大规模数据处理

### 4. 安全性

- **数据隐私**：敏感数据脱敏处理
- **访问控制**：确保只有授权用户可访问
- **审计日志**：记录所有提取操作

---

## 与 Claude Skills 的对比

| 特性 | Claude Skills | Vibe Agent |
|------|--------------|------------|
| **创建方式** | 手动编写 SKILL.md | 自动从数据提取 |
| **工作流** | 静态指令 | 动态工作流图 |
| **行为风格** | 隐含在指令中 | 显式提取和适配 |
| **记忆** | 无 | 结构化记忆系统 |
| **学习能力** | 静态 | 持续学习和更新 |
| **可解释性** | 高（人工编写） | 中（自动提取+追溯） |
| **个性化** | 通用 | 高度个性化 |

---

## 实施路线图

### Phase 1: 基础框架（2-3周）
- [ ] 数据库 Schema 扩展
- [ ] 基础 API 接口
- [ ] 数据预处理管道
- [ ] 简单的 LLM 提取器

### Phase 2: 核心提取器（3-4周）
- [ ] Workflow Extractor 实现
- [ ] Behavior Style Extractor 实现
- [ ] Memory Extractor 实现
- [ ] 交叉验证机制

### Phase 3: 运行时集成（2-3周）
- [ ] Workflow Executor
- [ ] Style Adapter
- [ ] Memory Retriever 集成
- [ ] Agent 运行时测试

### Phase 4: 优化与增强（2-3周）
- [ ] 性能优化
- [ ] 质量保证机制
- [ ] 人工审核界面
- [ ] 监控和日志

### Phase 5: 高级功能（3-4周）
- [ ] 持续学习机制
- [ ] 版本控制和回滚
- [ ] A/B 测试框架
- [ ] 分布式处理

---

## 总结

Vibe Agent 框架提供了一个完整的解决方案，能够从原始数据中自动提取并构建智能 Agent。相比 Claude Skills 的手动编写方式，Vibe Agent 提供了：

1. **自动化**：减少人工配置工作
2. **个性化**：基于真实数据提取，更贴合实际需求
3. **动态性**：支持持续学习和更新
4. **完整性**：不仅提取指令，还提取风格和记忆

这个框架为构建下一代智能 Agent 系统奠定了基础。
