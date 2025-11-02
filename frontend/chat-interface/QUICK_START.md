# Chat Interface - Quick Start Guide

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- 后端 API 服务运行在 `http://localhost:3000`

### 1. 安装依赖

```bash
cd frontend/chat-interface
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_ENABLE_BLOCKCHAIN=true
VITE_ENABLE_RAG=true
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5174` 启动

### 4. 构建生产版本

```bash
npm run build
```

构建产物将在 `dist/` 目录

### 5. 预览生产构建

```bash
npm run preview
```

## 📱 功能演示

### 创建会话
1. 点击左侧边栏的 "New Session" 按钮
2. 系统自动创建新会话并切换到该会话

### 发送消息
1. 在底部输入框输入消息
2. 按 Enter 发送（Shift+Enter 换行）
3. 等待 AI 响应

### 切换会话
1. 点击左侧边栏的会话列表
2. 选择要切换的会话

### 查看记忆
1. 点击右侧可视化面板
2. 切换不同的视图标签
3. 当前支持列表视图

### 响应式布局
- **桌面**：三栏布局（会话列表 | 聊天 | 可视化）
- **平板**：两栏布局 + 可折叠侧边栏
- **移动**：单栏布局 + 底部导航

## 🎨 界面说明

### 左侧边栏 - 会话管理
- 显示所有会话列表
- 创建新会话按钮
- 会话切换

### 中间面板 - 聊天区域
- 消息历史显示
- Markdown 渲染
- 消息输入框

### 右侧面板 - 可视化
- 时间线视图（待实现）
- 图谱视图（待实现）
- 列表视图（已实现）
- 统计视图（待实现）
- 区块链视图（待实现）

## 🔧 开发工具

### 代码检查
```bash
npm run lint
```

### 类型检查
```bash
npx tsc --noEmit
```

### 格式化代码
```bash
npx prettier --write src/
```

## 🐛 故障排除

### 问题：无法连接到后端
**解决方案**：
1. 确认后端服务正在运行
2. 检查 `.env` 中的 API URL 配置
3. 查看浏览器控制台的网络请求

### 问题：WebSocket 连接失败
**解决方案**：
1. 确认后端支持 WebSocket
2. 检查 `.env` 中的 WS URL 配置
3. 查看右下角的连接状态指示器

### 问题：样式不显示
**解决方案**：
1. 确认 Tailwind CSS 已正确配置
2. 重启开发服务器
3. 清除浏览器缓存

### 问题：TypeScript 错误
**解决方案**：
1. 运行 `npm install` 确保依赖完整
2. 检查 `tsconfig.json` 配置
3. 重启 IDE/编辑器

## 📚 相关文档

- [README.md](./README.md) - 项目概述
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - 实现状态
- [设计文档](../../.kiro/specs/chat-interface/design.md) - 详细设计
- [需求文档](../../.kiro/specs/chat-interface/requirements.md) - 功能需求

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 获取帮助

如有问题，请：
1. 查看 [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) 了解已知问题
2. 查看浏览器控制台的错误信息
3. 检查后端 API 日志

## 🎉 开始使用

现在你已经准备好开始使用聊天界面了！享受与 AI Agent 的对话吧！
