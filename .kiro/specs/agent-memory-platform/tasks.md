# Implementation Plan

- [x] 1. 项目初始化与基础设施搭建
  - 创建 monorepo 项目结构（使用 pnpm workspace）
  - 配置 TypeScript 编译选项和 ESLint/Prettier
  - 设置 Docker 和 docker-compose 开发环境
  - 配置环境变量管理（dotenv）
  - 初始化 Git 仓库和 .gitignore
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 2. 数据库与存储层设置
  - [x] 2.1 配置 PostgreSQL 数据库
    - 编写数据库初始化脚本（agents, sessions, audit_logs, memory_index 表）
    - 创建数据库迁移工具配置（使用 Prisma 或 TypeORM）
    - 实现数据库连接池管理
    - _Requirements: 14.5, 10.1_
  
  - [x] 2.2 集成向量数据库（Qdrant）
    - 配置 Qdrant Docker 容器
    - 创建 episodic_memories、semantic_memories、reflections 集合
    - 实现向量数据库客户端封装
    - _Requirements: 2.2, 3.1_
  
  - [x] 2.3 集成知识图谱数据库（Neo4j）
    - 配置 Neo4j Docker 容器
    - 定义节点和关系类型的 Cypher 脚本
    - 实现 Neo4j 客户端封装
    - _Requirements: 5.1, 5.2_
  
  - [x] 2.4 配置 Redis 缓存层
    - 配置 Redis Docker 容器
    - 实现 Redis 客户端和连接管理
    - 设置缓存过期策略
    - _Requirements: 1.2, 12.4_

- [x] 3. 核心数据模型与类型定义
  - 定义 TypeScript 接口（BaseMemory, EpisodicMemoryRecord, SemanticMemoryRecord 等）
  - 创建数据验证 schema（使用 Zod 或 Joi）
  - 实现数据模型工厂函数
  - 编写数据模型单元测试
  - _Requirements: 11.2_

- [x] 4. Embedding Service 实现
  - [x] 4.1 实现嵌入模型客户端
    - 集成 OpenAI Embeddings API
    - 实现错误处理和重试逻辑
    - 添加请求超时控制
    - _Requirements: 2.1_
  
  - [x] 4.2 实现批量嵌入处理
    - 创建批处理队列
    - 实现批量请求优化
    - 添加进度跟踪
    - _Requirements: 2.4_
  
  - [x] 4.3 实现嵌入缓存机制
    - 使用 Redis 缓存嵌入结果
    - 实现缓存键生成策略（基于文本哈希）
    - 添加缓存命中率监控
    - _Requirements: 12.4_

- [x] 5. STM Engine（短期记忆引擎）实现
  - [x] 5.1 实现上下文窗口管理器
    - 创建会话存储（Redis）
    - 实现 FIFO 淘汰策略
    - 支持可配置的窗口大小
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.2 实现 STM API 接口
    - addToSTM: 添加内容到短期记忆
    - getSTM: 获取当前会话记忆
    - clearSTM: 清空会话记忆
    - _Requirements: 1.4, 1.5_

- [x] 6. Episodic Memory Engine（情景记忆引擎）实现
  - [x] 6.1 实现记忆流写入器
    - 创建记忆流存储逻辑（向量数据库 + 时序数据库）
    - 实现自动时间戳生成
    - 添加事件类型分类
    - _Requirements: 4.1, 4.2_
  
  - [x] 6.2 实现重要性评分器
    - 集成 LLM API 进行重要性评估
    - 实现 1-10 分评分逻辑
    - 添加评分缓存机制
    - _Requirements: 4.3_
  
  - [x] 6.3 实现三分量检索模型
    - 实现新近度计算（指数衰减函数）
    - 实现相关性计算（余弦相似度）
    - 实现综合分数加权计算
    - 支持可配置的权重参数
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 6.4 实现情景记忆检索 API
    - retrieveEpisodes: 基于查询检索情景记忆
    - 支持时间范围过滤
    - 支持重要性阈值过滤
    - _Requirements: 4.4, 4.5_

- [x] 7. Semantic Memory Engine（语义记忆引擎）实现
  - [x] 7.1 实现知识图谱管理器
    - 创建实体和关系的 CRUD 操作
    - 实现事实三元组存储
    - 添加并发控制
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.2 实现图查询引擎
    - 实现 Cypher 查询构建器
    - 支持路径查询和子图匹配
    - 实现图遍历算法
    - _Requirements: 5.3, 5.4_
  
  - [x] 7.3 实现语义记忆向量存储
    - 存储文档向量到向量数据库
    - 实现元数据索引
    - 添加分类标签支持
    - _Requirements: 2.2, 2.5_
  
  - [x] 7.4 实现知识图谱可视化查询接口
    - 创建图数据序列化格式
    - 实现子图导出功能
    - _Requirements: 5.5_

- [x] 8. Retrieval Service（检索服务）实现
  - [x] 8.1 实现向量检索器
    - 实现向量相似性搜索（ANN）
    - 支持 Top-K 检索
    - 支持相似度阈值过滤
    - 支持元数据过滤
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  
  - [x] 8.2 实现图检索器
    - 封装知识图谱查询
    - 实现关系推理
    - 支持多跳查询
    - _Requirements: 5.3_
  
  - [x] 8.3 实现混合检索策略
    - 结合向量检索和图检索
    - 实现结果融合算法
    - 支持检索策略配置
    - _Requirements: 3.5_
  
  - [x] 8.4 实现标准 RAG 流程
    - 实现检索步骤（向量搜索）
    - 实现增强步骤（提示拼接）
    - 返回增强提示和来源
    - _Requirements: 6.1, 6.2_
  
  - [x] 8.5 实现 Agentic RAG 流程
    - 实现查询分析和规划
    - 实现多步骤检索编排
    - 实现查询路由逻辑
    - 支持迭代式检索
    - _Requirements: 6.3, 6.4_

- [x] 9. Reflection Service（反思服务）实现
  - [x] 9.1 实现反思触发器
    - 实现重要性累积监控
    - 支持阈值触发
    - 支持手动触发
    - _Requirements: 7.1, 7.5_
  
  - [x] 9.2 实现见解生成器
    - 集成 LLM API 生成见解
    - 实现提示模板管理
    - 检索相关近期记忆
    - _Requirements: 7.2_
  
  - [x] 9.3 实现反思存储
    - 存储反思结果到向量数据库
    - 关联源记忆 ID
    - 赋予高重要性权重
    - _Requirements: 7.3, 7.4_

- [x] 10. Memory Service（核心记忆服务）实现
  - [x] 10.1 实现记忆写入协调器
    - 路由到对应的记忆引擎
    - 触发嵌入生成
    - 执行数据验证
    - _Requirements: 2.1, 2.3_
  
  - [x] 10.2 实现记忆读取协调器
    - 协调多引擎检索
    - 实现结果聚合
    - 添加缓存层
    - _Requirements: 3.5_
  
  - [x] 10.3 实现会话管理器
    - 创建和销毁会话
    - 管理会话生命周期
    - 实现会话超时机制
    - _Requirements: 1.5_
  
  - [x] 10.4 实现 Memory Service API
    - storeMemory: 存储记忆
    - retrieveMemories: 检索记忆
    - updateMemory: 更新记忆
    - deleteMemory: 删除记忆
    - getSessionMemories: 获取会话记忆
    - _Requirements: 4.1, 4.4, 4.5_

- [x] 11. Management Service（管理服务）实现
  - [x] 11.1 实现智能过滤器
    - 创建过滤规则引擎
    - 支持多种过滤条件（重要性、内容、元数据）
    - 实现规则配置 API
    - _Requirements: 9.1_
  
  - [x] 11.2 实现遗忘调度器
    - 创建后台调度任务
    - 实现时间基础遗忘策略
    - 实现访问基础遗忘策略
    - 实现重要性基础遗忘策略
    - 支持归档功能
    - _Requirements: 9.2, 9.3_
  
  - [x] 11.3 实现记忆整合引擎
    - 实现记忆摘要生成（调用 LLM）
    - 批量处理历史记忆
    - 替换详细记录为摘要
    - _Requirements: 9.4_
  
  - [x] 11.4 实现记忆统计与分析
    - 计算记忆统计指标
    - 生成分析报告
    - 实现数据导出功能
    - _Requirements: 9.5, 13.5_
  
  - [x] 11.5 实现数据管理 API
    - setFilterRules: 配置过滤规则
    - setForgettingPolicy: 配置遗忘策略
    - consolidateMemories: 执行整合
    - getMemoryStats: 获取统计
    - exportMemories: 导出数据
    - purgeMemories: 清除所有记忆
    - _Requirements: 10.5_

- [x] 12. API Gateway 实现
  - [x] 12.1 实现认证中间件
    - JWT token 验证
    - Token 刷新机制
    - API key 验证
    - _Requirements: 10.1, 10.3_
  
  - [x] 12.2 实现授权中间件
    - RBAC 权限检查
    - 资源访问控制
    - Agent 隔离验证
    - _Requirements: 10.3, 13.3_
  
  - [x] 12.3 实现限流中间件
    - Token bucket 算法实现
    - 基于用户/IP 的限流
    - 限流配置管理
    - _Requirements: 12.3_
  
  - [x] 12.4 实现请求路由器
    - 基于路径的服务路由
    - 负载均衡
    - 健康检查
    - _Requirements: 11.1_
  
  - [x] 12.5 实现 API 版本控制
    - URL 版本前缀（/v1）
    - 版本兼容性处理
    - _Requirements: 11.4_

- [x] 13. RESTful API 端点实现
  - [x] 13.1 实现短期记忆 API
    - POST /v1/agents/:agentId/stm - 添加到短期记忆
    - GET /v1/agents/:agentId/stm - 获取短期记忆
    - DELETE /v1/agents/:agentId/stm - 清空短期记忆
    - _Requirements: 11.1, 11.2_
  
  - [x] 13.2 实现情景记忆 API
    - POST /v1/agents/:agentId/episodic - 记录情景事件
    - GET /v1/agents/:agentId/episodic - 检索情景记忆
    - GET /v1/agents/:agentId/episodic/:id - 获取单条记忆
    - _Requirements: 11.1, 11.2_
  
  - [x] 13.3 实现语义记忆 API
    - POST /v1/agents/:agentId/semantic/facts - 存储事实
    - POST /v1/agents/:agentId/semantic/entities - 添加实体
    - POST /v1/agents/:agentId/semantic/relations - 添加关系
    - GET /v1/agents/:agentId/semantic/query - 查询知识
    - _Requirements: 11.1, 11.2_
  
  - [x] 13.4 实现 RAG API
    - POST /v1/agents/:agentId/rag/retrieve - RAG 检索
    - POST /v1/agents/:agentId/rag/agentic - Agentic RAG
    - _Requirements: 11.1, 11.2_
  
  - [x] 13.5 实现反思 API
    - POST /v1/agents/:agentId/reflect - 触发反思
    - GET /v1/agents/:agentId/reflections - 获取反思历史
    - _Requirements: 11.1, 11.2_
  
  - [x] 13.6 实现管理 API
    - PUT /v1/agents/:agentId/config/filters - 配置过滤规则
    - PUT /v1/agents/:agentId/config/forgetting - 配置遗忘策略
    - POST /v1/agents/:agentId/consolidate - 执行整合
    - GET /v1/agents/:agentId/stats - 获取统计
    - GET /v1/agents/:agentId/export - 导出数据
    - DELETE /v1/agents/:agentId/memories - 清除记忆
    - _Requirements: 11.1, 11.2_
  
  - [x] 13.7 实现 Agent 管理 API
    - POST /v1/agents - 创建 Agent
    - GET /v1/agents/:agentId - 获取 Agent 信息
    - PUT /v1/agents/:agentId - 更新 Agent 配置
    - DELETE /v1/agents/:agentId - 删除 Agent
    - _Requirements: 11.1, 11.2, 13.1_
  
  - [x] 13.8 实现会话管理 API
    - POST /v1/agents/:agentId/sessions - 创建会话
    - GET /v1/agents/:agentId/sessions/:sessionId - 获取会话
    - DELETE /v1/agents/:agentId/sessions/:sessionId - 结束会话
    - _Requirements: 11.1, 11.2_

- [ ] 14. 错误处理与日志系统
  - [ ] 14.1 实现统一错误处理中间件
    - 捕获所有异常
    - 返回标准错误格式
    - 记录错误日志
    - _Requirements: 11.3_
  
  - [ ] 14.2 实现结构化日志系统
    - 使用 Winston 或 Pino
    - JSON 格式日志
    - 日志级别管理
    - 请求 ID 关联
    - _Requirements: 10.4_
  
  - [ ] 14.3 实现审计日志
    - 记录所有记忆访问操作
    - 存储到 PostgreSQL
    - 支持审计查询
    - _Requirements: 10.4_

- [ ] 15. 安全加固
  - [ ] 15.1 实现数据加密
    - 配置数据库静态加密
    - 实现敏感字段加密
    - 密钥管理（环境变量）
    - _Requirements: 10.2_
  
  - [ ] 15.2 实现输入验证与清理
    - 使用 Zod 验证所有输入
    - SQL 注入防护
    - XSS 防护
    - _Requirements: 10.1_
  
  - [ ] 15.3 配置 HTTPS/TLS
    - 生成 SSL 证书
    - 配置 TLS 1.3
    - 强制 HTTPS 重定向
    - _Requirements: 10.2_

- [ ] 16. 性能优化
  - [ ] 16.1 实现查询优化
    - 添加数据库索引
    - 优化向量检索参数
    - 实现查询结果缓存
    - _Requirements: 12.1, 12.2, 12.4_
  
  - [ ] 16.2 实现连接池管理
    - 配置数据库连接池
    - 优化连接池大小
    - 实现连接健康检查
    - _Requirements: 12.1_
  
  - [ ] 16.3 实现批处理优化
    - 批量数据库写入
    - 批量向量嵌入
    - 异步任务队列
    - _Requirements: 12.2_

- [ ] 17. 监控与可观测性
  - [ ] 17.1 实现 Prometheus 指标收集
    - 暴露 /metrics 端点
    - 收集请求指标（rate, latency, errors）
    - 收集业务指标（memories stored, retrievals）
    - 收集资源指标（CPU, memory）
    - _Requirements: 12.5_
  
  - [ ] 17.2 配置 Grafana 仪表板
    - 创建系统监控仪表板
    - 创建业务指标仪表板
    - 配置告警规则
    - _Requirements: 12.5_
  
  - [ ] 17.3 实现分布式追踪
    - 集成 OpenTelemetry
    - 实现请求追踪
    - 配置 Jaeger 后端
    - _Requirements: 12.5_

- [ ] 18. API 文档
  - [ ] 18.1 编写 OpenAPI 规范
    - 定义所有 API 端点
    - 添加请求/响应示例
    - 添加错误码说明
    - _Requirements: 11.5_
  
  - [ ] 18.2 集成 Swagger UI
    - 配置 Swagger UI 中间件
    - 暴露 /api-docs 端点
    - 添加 API 测试功能
    - _Requirements: 11.5_
  
  - [ ] 18.3 编写 API 使用指南
    - 快速开始文档
    - 认证指南
    - 各功能模块使用示例
    - 最佳实践建议
    - _Requirements: 11.5_

- [ ] 19. 单元测试
  - [ ] 19.1 编写服务层单元测试
    - Memory Service 测试
    - Embedding Service 测试
    - Retrieval Service 测试
    - Reflection Service 测试
    - Management Service 测试
    - _Requirements: 所有功能需求_
  
  - [ ] 19.2 编写引擎层单元测试
    - STM Engine 测试
    - Episodic Memory Engine 测试
    - Semantic Memory Engine 测试
    - _Requirements: 所有功能需求_
  
  - [ ] 19.3 编写工具函数测试
    - 评分算法测试
    - 数据验证测试
    - 加密解密测试
    - _Requirements: 所有功能需求_

- [ ] 20. 集成测试
  - [ ] 20.1 编写 API 集成测试
    - 测试完整的 API 工作流
    - 测试错误处理
    - 测试认证授权
    - _Requirements: 所有功能需求_
  
  - [ ] 20.2 编写数据库集成测试
    - 测试数据持久化
    - 测试事务处理
    - 测试并发控制
    - _Requirements: 所有功能需求_
  
  - [ ] 20.3 编写端到端测试
    - 测试完整记忆生命周期
    - 测试 RAG 工作流
    - 测试反思机制
    - 测试多 Agent 场景
    - _Requirements: 所有功能需求_

- [ ] 21. Docker 容器化
  - [ ] 21.1 编写 Dockerfile
    - API Gateway Dockerfile
    - 各服务 Dockerfile
    - 多阶段构建优化
    - _Requirements: 14.2_
  
  - [ ] 21.2 编写 docker-compose.yml
    - 定义所有服务
    - 配置网络和卷
    - 设置环境变量
    - 添加健康检查
    - _Requirements: 14.2, 14.5_
  
  - [ ] 21.3 编写启动脚本
    - 数据库初始化脚本
    - 服务启动顺序控制
    - 健康检查脚本
    - _Requirements: 14.5_

- [ ] 22. 部署配置
  - [ ] 22.1 编写 Kubernetes 配置
    - Deployment 配置
    - Service 配置
    - ConfigMap 和 Secret
    - Ingress 配置
    - _Requirements: 12.1, 14.2_
  
  - [ ] 22.2 配置 CI/CD 流水线
    - GitHub Actions 工作流
    - 自动化测试
    - 自动化构建和推送镜像
    - 自动化部署
    - _Requirements: 14.2_
  
  - [ ] 22.3 编写部署文档
    - 本地开发环境搭建
    - Docker 部署指南
    - Kubernetes 部署指南
    - 配置参数说明
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 23. 项目文档
  - [ ] 23.1 编写 README.md
    - 项目介绍
    - 功能特性
    - 快速开始
    - 架构概览
    - _Requirements: 所有需求_
  
  - [ ] 23.2 编写架构文档
    - 系统架构说明
    - 数据流图
    - 技术选型说明
    - _Requirements: 所有需求_
  
  - [ ] 23.3 编写开发者指南
    - 代码结构说明
    - 开发规范
    - 贡献指南
    - _Requirements: 所有需求_

- [ ] 24. 示例与演示
  - [ ] 24.1 创建基础使用示例
    - Python 客户端示例
    - Node.js 客户端示例
    - cURL 命令示例
    - _Requirements: 11.1_
  
  - [ ] 24.2 创建高级场景示例
    - 个性化对话 Agent 示例
    - 知识问答系统示例
    - 多 Agent 协作示例
    - _Requirements: 所有功能需求_
  
  - [ ] 24.3 创建交互式演示
    - Web UI 演示界面
    - 可视化记忆流
    - 实时检索演示
    - _Requirements: 所有功能需求_
