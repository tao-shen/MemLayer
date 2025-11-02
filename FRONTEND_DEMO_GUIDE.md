# 🎨 前端演示应用使用指南

## ✅ 当前状态

### 运行中的服务

1. **后端 API Gateway**
   - 地址: http://localhost:3000
   - 状态: ✅ 运行中
   - 健康检查: http://localhost:3000/health

2. **前端演示应用**
   - 地址: http://localhost:5173
   - 状态: ✅ 运行中
   - 框架: React 18 + Vite 5

## 🚀 快速开始

### 1. 打开前端应用

在浏览器中访问：
```
http://localhost:5173
```

### 2. 安装 Solana 钱包

**推荐使用 Phantom 钱包：**
- 访问: https://phantom.app/
- 下载浏览器扩展
- 创建新钱包或导入现有钱包
- **重要**: 切换到 Devnet 网络

### 3. 获取测试 SOL

在 Phantom 钱包中：
1. 点击设置 → 开发者设置
2. 切换到 "Devnet" 网络
3. 复制钱包地址
4. 访问水龙头获取测试 SOL:
   - https://faucet.solana.com/
   - 或使用命令: `solana airdrop 2 <地址> --url devnet`

### 4. 连接钱包并使用

1. 在前端页面点击 "Select Wallet"
2. 选择 Phantom 钱包
3. 在弹窗中点击 "连接"
4. 开始铸造记忆 NFT！

## 📋 功能演示

### 铸造记忆 NFT

1. 填写表单：
   ```
   标题: 我的第一个记忆
   内容: 这是一个测试记忆，记录了重要的对话内容
   描述: 测试记忆
   标签: AI, 测试, 重要
   ```

2. 点击 "铸造记忆 NFT"

3. 在钱包中签名（需要签名两次）：
   - 第一次：身份认证签名
   - 第二次：交易签名

4. 等待交易确认（通常几秒钟）

5. 成功后会显示资产 ID

### 查看资产

1. 切换到 "我的资产" 标签
2. 查看所有已铸造的记忆 NFT
3. 点击 "刷新" 更新列表

## 🎯 界面说明

### 顶部导航栏
- 左侧：应用标题
- 右侧：钱包连接按钮

### API 状态卡片
- 显示后端 API 连接状态
- 绿色 = 在线，红色 = 离线

### 钱包信息卡片
- 连接状态
- 钱包地址（缩略显示）
- SOL 余额
- 网络（Devnet）

### 功能标签页

**铸造记忆 NFT:**
- 标题输入框（必填）
- 内容文本框（必填）
- 描述输入框（可选）
- 标签输入框（可选，逗号分隔）
- 铸造按钮

**我的资产:**
- 资产网格展示
- 每个资产显示：
  - 标题
  - 资产 ID
  - 内容预览
  - 描述
  - 标签
  - 创建时间
- 刷新按钮

## 🔧 技术细节

### 认证流程

每次 API 调用都需要 Solana 钱包签名认证：

1. **获取挑战**: `POST /v1/blockchain/auth/challenge`
   ```json
   {
     "walletAddress": "你的钱包地址"
   }
   ```

2. **签名消息**: 使用钱包签名挑战消息

3. **验证签名**: `POST /v1/blockchain/auth/verify`
   ```json
   {
     "walletAddress": "你的钱包地址",
     "signature": "签名的 base58 编码",
     "message": "挑战消息"
   }
   ```

4. **获取 Token**: 返回 JWT token 用于后续 API 调用

### 铸造流程

1. 完成认证获取 token
2. 调用铸造 API: `POST /v1/blockchain/memories/mint`
   ```json
   {
     "content": "记忆内容",
     "metadata": {
       "title": "标题",
       "description": "描述",
       "tags": ["标签1", "标签2"]
     },
     "encrypted": false
   }
   ```
3. 返回资产 ID 和交易签名

### 查询资产

1. 完成认证获取 token
2. 调用查询 API: `GET /v1/blockchain/memories?owner=钱包地址`
3. 返回资产列表

## 📁 项目文件

```
blockchain/frontend-demo/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # 主仪表板
│   │   ├── WalletInfoCard.tsx     # 钱包信息
│   │   ├── ApiStatus.tsx          # API 状态
│   │   ├── MintMemoryForm.tsx     # 铸造表单
│   │   └── AssetsList.tsx         # 资产列表
│   ├── App.tsx                    # 应用根组件
│   ├── main.tsx                   # 入口文件
│   └── index.css                  # 全局样式
├── index.html                     # HTML 模板
├── vite.config.ts                 # Vite 配置
├── package.json                   # 依赖配置
├── start.sh                       # 启动脚本
└── README.md                      # 详细文档
```

## 🐛 常见问题

### Q: 钱包连接失败？
A: 
1. 确保已安装 Phantom 钱包扩展
2. 刷新页面重试
3. 检查浏览器是否允许弹窗

### Q: 铸造时提示签名失败？
A:
1. 确保钱包有足够的 SOL（至少 0.01 SOL）
2. 确认钱包已切换到 Devnet 网络
3. 不要在签名弹窗中点击拒绝

### Q: 看不到我的资产？
A:
1. 确保已成功铸造至少一个 NFT
2. 点击刷新按钮
3. 检查钱包地址是否正确
4. 查看浏览器控制台是否有错误

### Q: API 显示离线？
A:
1. 检查后端是否运行: `curl http://localhost:3000/health`
2. 如果未运行，启动后端: `pnpm --filter @agent-memory/api-gateway dev`

## 🎨 自定义样式

所有样式都在 `src/index.css` 中，可以自由修改：

- 主题色: `#667eea` (紫色)
- 背景渐变: `#667eea` → `#764ba2`
- 卡片圆角: `12px`
- 阴影: `0 4px 6px rgba(0, 0, 0, 0.1)`

## 🔄 重启服务

如果需要重启服务：

### 停止服务
```bash
# 停止前端 (Ctrl+C)
# 停止后端 (Ctrl+C)
```

### 重新启动
```bash
# 启动后端
pnpm --filter @agent-memory/api-gateway dev

# 启动前端
cd blockchain/frontend-demo
npm run dev
```

或使用快捷脚本：
```bash
cd blockchain/frontend-demo
./start.sh
```

## 📚 相关资源

- **Solana 文档**: https://docs.solana.com/
- **Phantom 钱包**: https://phantom.app/
- **Wallet Adapter**: https://github.com/solana-labs/wallet-adapter
- **Vite 文档**: https://vitejs.dev/
- **React 文档**: https://react.dev/

## 🎉 下一步

1. **尝试更多功能**
   - 铸造多个记忆 NFT
   - 使用不同的标签分类
   - 查看资产详情

2. **探索代码**
   - 查看组件实现
   - 了解认证流程
   - 学习 Solana 交互

3. **扩展功能**
   - 添加资产转移
   - 实现访问控制
   - 集成批量铸造

## 💡 提示

- 在 Devnet 上测试是免费的，不用担心费用
- 每次铸造大约需要 0.001-0.01 SOL
- 签名时仔细检查交易内容
- 保存好您的资产 ID

祝您使用愉快！🎊
