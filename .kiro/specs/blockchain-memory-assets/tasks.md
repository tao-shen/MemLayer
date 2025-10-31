# Implementation Plan

- [x] 1. Solana 开发环境搭建
  - 安装 Rust 和 Solana CLI 工具
  - 安装 Anchor 框架和依赖
  - 配置 Solana 本地测试验证器
  - 创建开发钱包和获取 Devnet SOL
  - 配置 Phantom/Solflare 钱包用于测试
  - _Requirements: 1.1_

- [x] 2. Solana Program 开发
  - [x] 2.1 初始化 Anchor 项目
    - 创建 Anchor 项目结构
    - 配置 Anchor.toml 和 Cargo.toml
    - 定义程序 ID 和部署配置
    - _Requirements: 1.1_
  
  - [x] 2.2 实现核心数据结构
    - 定义 UserAccount 账户结构
    - 定义 MemoryAsset 元数据结构
    - 定义 AccessPolicyAccount 结构
    - 定义 AccessGrant 结构
    - _Requirements: 1.1, 5.1_
  
  - [x] 2.3 实现用户初始化指令
    - 编写 initialize_user 指令
    - 创建 PDA 账户
    - 初始化访问策略
    - 添加指令验证逻辑
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.4 实现记忆铸造指令
    - 编写 mint_memory 指令
    - 集成 Bubblegum CPI 调用
    - 验证所有权和签名
    - 存储 Arweave ID 到元数据
    - _Requirements: 1.2, 2.2, 2.4_
  
  - [x] 2.5 实现访问控制指令
    - 编写 update_access_policy 指令
    - 实现授权列表管理
    - 添加时间和次数限制逻辑
    - 实现访问验证函数
    - _Requirements: 1.3, 5.1, 5.2, 5.4, 5.5_
  
  - [x] 2.6 实现转移指令
    - 编写 transfer_memory 指令
    - 验证当前所有者
    - 更新 Merkle 树状态
    - 触发所有权变更事件
    - _Requirements: 1.3, 9.1, 9.2, 9.3_
  
  - [x] 2.7 实现版本管理指令
    - 编写 create_version 指令
    - 记录版本号和历史
    - 更新元数据指针
    - _Requirements: 1.5, 10.1, 10.2, 10.3, 10.4_

- [x] 3. Solana Program 测试
  - [x] 3.1 编写单元测试
    - 测试用户初始化
    - 测试记忆铸造
    - 测试访问控制
    - 测试转移功能
    - 测试版本管理
    - _Requirements: 所有 Requirement 1-10_
  
  - [x] 3.2 编写集成测试
    - 测试完整铸造流程
    - 测试访问授权流程
    - 测试批量操作
    - 测试错误处理
    - _Requirements: 所有 Requirement 1-10_
  
  - [x] 3.3 部署到 Devnet
    - 构建程序
    - 部署到 Solana Devnet
    - 验证部署成功
    - 测试链上交互
    - _Requirements: 1.1_

- [x] 4. Encryption Service 实现
  - [x] 4.1 实现加密引擎
    - 实现 AES-256-GCM 加密函数
    - 实现解密函数
    - 生成随机 IV 和 Auth Tag
    - 添加加密参数验证
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 实现密钥派生
    - 实现基于钱包签名的密钥派生
    - 使用 PBKDF2 增强密钥强度
    - 实现主密钥生成
    - 实现内容密钥派生
    - _Requirements: 4.2, 4.3_
  
  - [x] 4.3 实现密钥管理服务
    - 创建密钥存储接口
    - 实现密钥缓存机制
    - 实现密钥轮换逻辑
    - 集成 AWS KMS 或 HSM（可选）
    - _Requirements: 4.4, 4.5_
  
  - [x] 4.4 实现重新加密功能
    - 实现转移时的重新加密
    - 验证新所有者身份
    - 安全删除旧密钥
    - _Requirements: 9.4_

- [x] 5. Arweave Integration 实现
  - [x] 5.1 配置 Arweave 客户端
    - 安装 arweave-js SDK
    - 创建 Arweave 钱包
    - 配置网关连接
    - 实现连接池管理
    - _Requirements: 3.1, 3.2_
  
  - [x] 5.2 实现上传功能
    - 实现单文件上传
    - 实现批量上传
    - 添加标签（Tags）支持
    - 实现上传进度跟踪
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.3 实现检索功能
    - 实现通过 TX ID 检索数据
    - 实现数据验证
    - 添加重试机制
    - 实现缓存层
    - _Requirements: 3.4, 3.5_
  
  - [x] 5.4 集成 Bundlr Network
    - 配置 Bundlr 客户端
    - 实现即时上传
    - 实现成本估算
    - 添加余额管理
    - _Requirements: 3.1, 11.4_
  
  - [x] 5.5 实现错误处理
    - 处理网络错误
    - 处理余额不足
    - 实现失败重试
    - 记录错误日志
    - _Requirements: 3.1, 12.4_

- [x] 6. Memory Minting Service 实现
  - [x] 6.1 创建服务基础架构
    - 创建 TypeScript 项目结构
    - 配置依赖和构建工具
    - 实现服务接口定义
    - 配置环境变量管理
    - _Requirements: 2.1, 2.2_
  
  - [x] 6.2 实现批次管理器
    - 创建批次队列
    - 实现批次大小和超时配置
    - 实现自动批次触发
    - 添加批次状态跟踪
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 6.3 实现铸造协调器
    - 协调加密、上传、铸造流程
    - 实现事务管理
    - 添加失败回滚逻辑
    - 实现状态持久化
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 6.4 实现 Solana 交易构建器
    - 构建铸造交易
    - 添加优先费用计算
    - 实现交易签名
    - 实现交易发送和确认
    - _Requirements: 2.1, 2.2, 11.3_
  
  - [x] 6.5 实现成本估算
    - 计算 Solana 交易成本
    - 计算 Arweave 存储成本
    - 实现动态定价
    - 提供成本估算 API
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [x] 6.6 实现异步队列处理
    - 集成 Bull 队列
    - 实现任务调度
    - 添加重试策略
    - 实现并发控制
    - _Requirements: 12.1, 12.2, 12.4, 12.5_

- [x] 7. Access Control Service 实现
  - [x] 7.1 实现签名验证器
    - 验证 Ed25519 签名
    - 实现消息格式验证
    - 添加时间戳验证（防重放）
    - 实现 Nonce 管理
    - _Requirements: 5.3, 7.1_
  
  - [x] 7.2 实现策略管理器
    - 读取链上访问策略
    - 缓存策略到 Redis
    - 实现策略更新
    - 添加策略验证逻辑
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.3 实现访问检查
    - 验证钱包地址权限
    - 检查时间限制
    - 检查访问次数限制
    - 更新访问计数
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 7.4 实现授权管理 API
    - 授予访问权限
    - 撤销访问权限
    - 查询访问策略
    - 更新访问策略
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.5 实现审计日志
    - 记录所有访问尝试
    - 记录授权变更
    - 存储到 PostgreSQL
    - 提供审计查询接口
    - _Requirements: 16.1, 16.2_

- [x] 8. Indexer Service 实现
  - [x] 8.1 配置 Helius RPC
    - 注册 Helius 账户
    - 获取 API 密钥
    - 配置 RPC 连接
    - 实现连接池
    - _Requirements: 8.1, 8.2_
  
  - [x] 8.2 实现事件监听器
    - 监听程序事件
    - 解析铸造事件
    - 解析转移事件
    - 解析访问策略更新事件
    - _Requirements: 8.2, 8.3_
  
  - [x] 8.3 实现数据索引器
    - 索引记忆资产
    - 索引批次信息
    - 索引转移历史
    - 索引访问授权
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [x] 8.4 实现查询引擎
    - 按钱包地址查询
    - 按时间范围过滤
    - 按 Agent ID 过滤
    - 实现分页查询
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [x] 8.5 实现缓存层
    - 缓存查询结果到 Redis
    - 实现缓存失效策略
    - 添加缓存预热
    - 监控缓存命中率
    - _Requirements: 8.5_
  
  - [x] 8.6 实现链上数据同步
    - 实现增量同步
    - 实现全量同步
    - 处理链重组
    - 添加同步状态监控
    - _Requirements: 8.2, 17.1_

- [x] 9. API Gateway 增强
  - [x] 9.1 实现 Solana 签名认证中间件
    - 验证请求头中的签名
    - 生成挑战消息
    - 验证挑战响应
    - 实现会话管理
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 9.2 添加区块链路由
    - POST /v1/blockchain/memories/mint
    - POST /v1/blockchain/memories/mint-batch
    - GET /v1/blockchain/memories
    - GET /v1/blockchain/memories/:assetId
    - POST /v1/blockchain/memories/:assetId/grant
    - POST /v1/blockchain/memories/:assetId/revoke
    - POST /v1/blockchain/memories/:assetId/transfer
    - GET /v1/blockchain/batches/:batchId
    - _Requirements: 7.1, 15.1, 15.2, 15.3_
  
  - [x] 9.3 实现双认证支持
    - 支持传统 JWT 认证
    - 支持 Solana 签名认证
    - 实现认证方式切换
    - 添加认证优先级配置
    - _Requirements: 7.5_
  
  - [x] 9.4 实现限流策略
    - 按钱包地址限流
    - 按 IP 地址限流
    - 实现动态限流
    - 添加白名单支持
    - _Requirements: 7.1_

- [x] 10. 数据库 Schema 实现
  - [x] 10.1 创建 PostgreSQL 表
    - 创建 memory_assets 表
    - 创建 memory_batches 表
    - 创建 access_grants 表
    - 创建 transfer_history 表
    - 创建 minting_queue 表
    - 创建 blockchain_audit_logs 表
    - _Requirements: 8.2, 8.3, 16.1_
  
  - [x] 10.2 创建索引
    - 创建所有者索引
    - 创建时间索引
    - 创建批次索引
    - 创建状态索引
    - _Requirements: 8.5_
  
  - [x] 10.3 实现数据库迁移
    - 编写迁移脚本
    - 实现版本控制
    - 添加回滚支持
    - _Requirements: 8.2_

- [x] 11. 前端钱包集成
  - [x] 11.1 集成 Solana Wallet Adapter
    - 安装 @solana/wallet-adapter-react
    - 配置支持的钱包（Phantom, Solflare 等）
    - 实现钱包连接 UI
    - 处理钱包连接状态
    - _Requirements: 15.1, 7.3_
  
  - [x] 11.2 实现签名功能
    - 实现消息签名
    - 实现交易签名
    - 处理签名错误
    - 添加签名确认 UI
    - _Requirements: 7.1, 7.3_
  
  - [x] 11.3 实现记忆上链 UI
    - 创建上链按钮和表单
    - 显示成本估算
    - 显示交易进度
    - 显示交易结果
    - _Requirements: 15.2, 15.3, 15.4_
  
  - [x] 11.4 实现资产管理 UI
    - 显示用户的链上记忆列表
    - 实现资产详情查看
    - 实现访问授权管理
    - 实现资产转移功能
    - _Requirements: 15.2, 15.5_
  
  - [x] 11.5 实现交易历史 UI
    - 显示交易历史列表
    - 显示交易状态
    - 提供交易详情链接
    - 实现交易搜索和过滤
    - _Requirements: 15.5_

- [x] 12. SDK 开发
  - [x] 12.1 开发 TypeScript SDK
    - 实现 MemoryMintingClient
    - 实现 AccessControlClient
    - 实现 IndexerClient
    - 添加类型定义
    - _Requirements: 18.1, 18.4_
  
  - [x] 12.2 开发 Rust SDK
    - 实现 Program 客户端
    - 实现交易构建器
    - 添加示例代码
    - _Requirements: 18.2, 18.4_
  
  - [x] 12.3 开发 CLI 工具
    - 实现记忆上链命令
    - 实现查询命令
    - 实现授权管理命令
    - 实现批量操作命令
    - _Requirements: 18.3, 18.4_
  
  - [x] 12.4 编写 SDK 文档
    - API 参考文档
    - 快速开始指南
    - 代码示例
    - 最佳实践
    - _Requirements: 18.4_

- [x] 13. 性能优化
  - [x] 13.1 实现批处理优化
    - 动态调整批次大小
    - 实现智能批次合并
    - 优化批次触发时机
    - _Requirements: 6.2, 11.2, 12.1_
  
  - [x] 13.2 实现 RPC 优化
    - 实现 RPC 节点负载均衡
    - 添加 RPC 健康检查
    - 实现自动故障转移
    - _Requirements: 12.1, 12.2, 13.2_
  
  - [x] 13.3 实现缓存优化
    - 优化查询缓存策略
    - 实现多级缓存
    - 添加缓存预热
    - _Requirements: 8.5, 12.1_
  
  - [x] 13.4 实现并发控制
    - 限制并发上链请求
    - 实现请求队列
    - 优化资源使用
    - _Requirements: 12.1, 12.3_

- [x] 14. 监控与可观测性
  - [x] 14.1 实现 Prometheus 指标
    - 收集交易成功率
    - 收集确认时间
    - 收集 Gas 成本
    - 收集 Arweave 上传指标
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 14.2 配置 Grafana 仪表板
    - 创建区块链监控仪表板
    - 创建成本分析仪表板
    - 创建性能监控仪表板
    - _Requirements: 13.1, 13.4_
  
  - [x] 14.3 实现告警规则
    - 交易失败率告警
    - RPC 响应时间告警
    - Arweave 上传失败告警
    - Merkle 树容量告警
    - _Requirements: 13.5_
  
  - [x] 14.4 实现健康检查
    - Solana RPC 健康检查
    - Arweave 网关健康检查
    - 服务健康检查端点
    - _Requirements: 13.5_

- [x] 15. 测试
  - [x] 15.1 编写单元测试
    - 测试加密解密功能
    - 测试签名验证
    - 测试批次管理
    - 测试访问控制逻辑
    - _Requirements: 所有功能需求_
  
  - [x] 15.2 编写集成测试
    - 测试完整铸造流程
    - 测试访问授权流程
    - 测试资产转移流程
    - 测试版本管理流程
    - _Requirements: 所有功能需求_
  
  - [x] 15.3 编写端到端测试
    - 测试从 UI 到链上的完整流程
    - 测试钱包连接和签名
    - 测试多用户场景
    - _Requirements: 所有功能需求_
  
  - [x] 15.4 性能测试
    - 测试 100 并发铸造
    - 测试 1000 记忆批次
    - 测试持续负载
    - 测试故障恢复
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 16. 安全审计
  - [x] 16.1 Solana Program 审计
    - 代码审查
    - 安全漏洞扫描
    - 权限检查验证
    - 第三方审计（可选）
    - _Requirements: 1.1-1.5, 5.1-5.5_
  
  - [x] 16.2 加密实现审计
    - 验证加密算法实现
    - 检查密钥管理安全性
    - 测试重放攻击防护
    - _Requirements: 4.1-4.5_
  
  - [x] 16.3 API 安全审计
    - 测试认证绕过
    - 测试授权漏洞
    - 测试注入攻击
    - 测试 DDoS 防护
    - _Requirements: 7.1-7.5_

- [x] 17. 文档编写
  - [x] 17.1 编写架构文档
    - 系统架构说明
    - 数据流图
    - 安全设计说明
    - _Requirements: 所有需求_
  
  - [x] 17.2 编写 API 文档
    - OpenAPI 规范
    - 请求/响应示例
    - 错误码说明
    - _Requirements: 18.4_
  
  - [x] 17.3 编写用户指南
    - 钱包连接指南
    - 记忆上链教程
    - 访问管理教程
    - 常见问题解答
    - _Requirements: 15.1-15.5_
  
  - [x] 17.4 编写开发者指南
    - 环境搭建
    - SDK 使用指南
    - 最佳实践
    - 故障排查
    - _Requirements: 18.1-18.4_

- [x] 18. 部署
  - [x] 18.1 部署到 Devnet
    - 部署 Solana Program
    - 部署后端服务
    - 配置测试环境
    - 执行冒烟测试
    - _Requirements: 所有需求_
  
  - [x] 18.2 部署到 Mainnet
    - 审查所有配置
    - 部署 Solana Program 到 Mainnet
    - 部署生产服务
    - 执行生产验证
    - _Requirements: 所有需求_
  
  - [x] 18.3 配置监控和告警
    - 配置 Prometheus
    - 配置 Grafana
    - 设置告警规则
    - 测试告警通知
    - _Requirements: 13.1-13.5_
  
  - [x] 18.4 编写运维文档
    - 部署流程文档
    - 监控指南
    - 故障处理手册
    - 灾难恢复计划
    - _Requirements: 17.1-17.5_

- [x] 19. 示例应用
  - [x] 19.1 创建 Web 示例应用
    - 实现钱包连接
    - 实现记忆上链
    - 实现资产查看
    - 实现访问管理
    - _Requirements: 15.1-15.5_
  
  - [x] 19.2 创建 CLI 示例
    - 批量上链脚本
    - 查询脚本
    - 授权管理脚本
    - _Requirements: 18.3_
  
  - [x] 19.3 创建集成示例
    - 与现有 Memory Platform 集成
    - 自动上链触发器
    - 混合存储策略
    - _Requirements: 所有需求_
