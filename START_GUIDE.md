# 项目启动指南

## ✅ 构建状态

所有包和服务已成功构建，没有任何错误或警告！

### 构建成功的模块：
- ✅ packages/cache
- ✅ packages/database  
- ✅ packages/knowledge-graph
- ✅ packages/shared
- ✅ packages/vector-db
- ✅ services/api-gateway
- ✅ services/embedding-service
- ✅ services/management-service
- ✅ services/memory-service
- ✅ services/reflection-service
- ✅ services/retrieval-service

## 🚀 启动步骤

### 1. 启动 Docker 服务

项目依赖以下 Docker 服务：
- PostgreSQL (端口 5432)
- Qdrant 向量数据库 (端口 6333)
- Neo4j 知识图谱 (端口 7474, 7687)
- Redis 缓存 (端口 6379)
- Prometheus 监控 (端口 9090)
- Grafana 可视化 (端口 3001)
- Jaeger 追踪 (端口 16686)

启动命令：
```bash
# 确保 Docker Desktop 或 OrbStack 正在运行
docker compose up -d
```

检查服务状态：
```bash
docker compose ps
```

### 2. 配置环境变量

环境变量文件 `.env` 已创建。需要配置以下关键变量：

```bash
# OpenAI API Key (必需 - 用于 embedding 和 LLM)
OPENAI_API_KEY=your_openai_api_key_here

# JWT Secret (必需 - 用于认证)
JWT_SECRET=your_jwt_secret_here

# LLM API Key (可选 - 如果使用不同的 LLM 服务)
LLM_API_KEY=your_llm_api_key_here
```

### 3. 初始化数据库

```bash
# 等待 PostgreSQL 启动
sleep 10

# 运行数据库迁移
docker compose exec postgres psql -U postgres -d agent_memory -f /docker-entrypoint-initdb.d/init.sql
```

### 4. 启动开发服务器

```bash
# 启动所有服务（开发模式）
pnpm dev
```

或者启动单个服务：
```bash
# API Gateway
pnpm --filter @agent-memory/api-gateway dev

# Memory Service
pnpm --filter @agent-memory/memory-service dev

# Embedding Service
pnpm --filter @agent-memory/embedding-service dev
```

### 5. 验证服务

API Gateway 默认运行在 `http://localhost:3000`

健康检查：
```bash
curl http://localhost:3000/health
```

## 📊 监控和管理

- **Grafana Dashboard**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger UI**: http://localhost:16686
- **Neo4j Browser**: http://localhost:7474 (neo4j/neo4j_password)

## 🔧 常用命令

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 格式化代码
pnpm format

# 停止 Docker 服务
docker compose down

# 查看日志
docker compose logs -f

# 清理并重启
docker compose down -v
docker compose up -d
```

## 📝 API 文档

API 文档位于：
- OpenAPI 规范: `docs/openapi.yaml`
- API 指南: `docs/API_GUIDE.md`
- 架构文档: `docs/ARCHITECTURE.md`

## ⚠️ 注意事项

1. **Docker 必须运行**: 确保 Docker Desktop 或 OrbStack 正在运行
2. **端口冲突**: 确保所需端口未被占用
3. **API Keys**: 配置有效的 OpenAI API Key 才能使用 embedding 功能
4. **内存要求**: Neo4j 需要至少 2GB 内存

## 🐛 故障排除

### Docker 服务无法启动
```bash
# 检查 Docker 状态
docker info

# 查看服务日志
docker compose logs [service-name]

# 重启服务
docker compose restart [service-name]
```

### 端口被占用
```bash
# 查看端口占用
lsof -i :[port]

# 修改 docker-compose.yml 中的端口映射
```

### 数据库连接失败
```bash
# 检查 PostgreSQL 是否就绪
docker compose exec postgres pg_isready -U postgres

# 重新初始化数据库
docker compose down -v
docker compose up -d
```

## 📚 更多资源

- [项目 README](README.md)
- [部署指南](docs/DEPLOYMENT.md)
- [贡献指南](CONTRIBUTING.md)
- [Blockchain 快速开始](blockchain/QUICK_START.md)
