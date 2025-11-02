# Memory Platform - Blockchain 前端演示

这是一个基于 React + Vite 的前端演示应用，展示了如何使用 Solana 钱包与 Memory Platform 的区块链功能进行交互。

## 🚀 已启动的服务

### 后端 API
- **URL**: http://localhost:3000
- **状态**: ✅ 运行中
- **健康检查**: http://localhost:3000/health

### 前端应用
- **URL**: http://localhost:5173
- **状态**: ✅ 运行中
- **框架**: React 18 + Vite 5

## 📋 功能特性

### 1. 钱包连接
- 支持 Phantom、Solflare 等主流 Solana 钱包
- 自动连接和状态管理
- 实时显示钱包地址和 SOL 余额

### 2. 记忆 NFT 铸造
- 创建和铸造记忆 NFT 到 Solana 区块链
- 支持添加标题、内容、描述和标签
- 使用钱包签名进行身份验证

### 3. 资产管理
- 查看您拥有的所有记忆 NFT
- 显示资产详情（ID、内容、元数据等）
- 实时刷新资产列表

### 4. API 状态监控
- 实时显示后端 API 连接状态
- 自动健康检查

## 🎯 使用步骤

### 1. 安装 Solana 钱包

推荐使用 **Phantom 钱包**：
- 访问 https://phantom.app/
- 下载并安装浏览器扩展
- 创建或导入钱包
- 切换到 **Devnet** 网络

### 2. 获取测试 SOL

在 Devnet 上获取免费的测试 SOL：
```bash
# 使用 Solana CLI
solana airdrop 2 <你的钱包地址> --url devnet

# 或访问水龙头网站
# https://faucet.solana.com/
```

### 3. 打开前端应用

在浏览器中访问：
```
http://localhost:5173
```

### 4. 连接钱包

1. 点击右上角的 "Select Wallet" 按钮
2. 选择您的钱包（如 Phantom）
3. 在钱包弹窗中确认连接

### 5. 铸造记忆 NFT

1. 连接钱包后，填写表单：
   - **标题**: 记忆的标题
   - **内容**: 记忆的详细内容
   - **描述**: 简短描述（可选）
   - **标签**: 用逗号分隔的标签（可选）

2. 点击 "铸造记忆 NFT" 按钮

3. 在钱包中签名两次：
   - 第一次：认证签名
   - 第二次：交易签名

4. 等待交易确认

### 6. 查看资产

1. 切换到 "我的资产" 标签
2. 查看您铸造的所有记忆 NFT
3. 点击 "刷新" 按钮更新列表

## 🔧 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Solana Web3.js** - Solana 区块链交互
- **Wallet Adapter** - 钱包连接
- **Axios** - HTTP 客户端

## 📁 项目结构

```
blockchain/frontend-demo/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # 主仪表板
│   │   ├── WalletInfoCard.tsx     # 钱包信息卡片
│   │   ├── ApiStatus.tsx          # API 状态显示
│   │   ├── MintMemoryForm.tsx     # 铸造表单
│   │   └── AssetsList.tsx         # 资产列表
│   ├── App.tsx                    # 应用入口
│   ├── main.tsx                   # React 入口
│   └── index.css                  # 全局样式
├── index.html                     # HTML 模板
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 配置
└── package.json                   # 依赖配置
```

## 🎨 界面预览

### 主界面
- 顶部：应用标题 + 钱包连接按钮
- API 状态卡片：显示后端连接状态
- 钱包信息卡片：显示连接状态、地址、余额、网络
- 功能标签页：铸造 / 资产管理

### 铸造页面
- 表单输入：标题、内容、描述、标签
- 实时验证和错误提示
- 成功/失败消息显示

### 资产页面
- 网格布局展示所有资产
- 每个资产卡片显示：
  - 标题
  - 资产 ID
  - 内容预览
  - 描述
  - 标签
  - 创建时间

## ⚠️ 注意事项

### 网络配置
- 当前配置为 **Devnet** 网络
- 确保钱包也切换到 Devnet
- 不要在 Mainnet 上使用测试代码

### 认证流程
每次操作都需要：
1. 获取认证挑战
2. 签名挑战消息
3. 验证签名获取 token
4. 使用 token 调用 API

### 错误处理
- 钱包未连接：提示连接钱包
- 签名被拒绝：显示错误消息
- API 离线：显示离线状态
- 交易失败：显示详细错误

## 🐛 故障排除

### 钱包无法连接
1. 确保已安装钱包扩展
2. 刷新页面重试
3. 检查浏览器控制台错误

### 铸造失败
1. 确保钱包有足够的 SOL（至少 0.01 SOL）
2. 确认在 Devnet 网络
3. 检查后端 API 是否运行
4. 查看浏览器控制台的详细错误

### API 显示离线
1. 检查后端是否运行：`curl http://localhost:3000/health`
2. 查看后端日志
3. 确认端口 3000 未被占用

### 资产列表为空
1. 确保已铸造至少一个 NFT
2. 点击刷新按钮
3. 检查钱包地址是否正确

## 🔄 开发命令

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

## 📚 相关文档

- [Solana 文档](https://docs.solana.com/)
- [Wallet Adapter 文档](https://github.com/solana-labs/wallet-adapter)
- [Phantom 钱包](https://phantom.app/)
- [项目主 README](../../README.md)
- [Blockchain 快速开始](../QUICK_START.md)

## 🎉 下一步

1. **添加更多功能**
   - 转移资产
   - 访问控制管理
   - 批量铸造
   - 资产详情页

2. **优化用户体验**
   - 加载动画
   - 交易进度显示
   - 更好的错误提示
   - 响应式设计

3. **集成更多服务**
   - Arweave 存储
   - 加密功能
   - 索引服务
   - 分析统计

## 📝 许可证

MIT
