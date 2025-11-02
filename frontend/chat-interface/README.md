# Chat Interface

智能聊天界面，深度集成 Agent Memory Platform 的所有核心功能。

## 功能特性

- 🤖 **智能对话**：与 AI Agent 进行自然对话
- 🧠 **记忆可视化**：实时展示记忆形成、存储和检索过程
- 🕸️ **知识图谱**：交互式图谱视图，展示实体和关系网络
- ⛓️ **区块链集成**：记忆 NFT 铸造和管理
- 📊 **统计分析**：记忆系统统计和趋势分析
- 🔍 **RAG 增强**：支持标准 RAG 和智能体 RAG 模式

## 技术栈

- React 18 + TypeScript
- Vite
- Zustand + React Query
- Tailwind CSS
- D3.js + Recharts
- Solana Wallet Adapter
- WebSocket (Socket.io)

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── components/     # React 组件
├── hooks/          # 自定义 Hooks
├── stores/         # Zustand 状态管理
├── api/            # API 客户端
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```

## 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## License

MIT
