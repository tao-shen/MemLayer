# Solana 开发环境搭建指南

本指南将帮助你设置 Solana 区块链开发环境，包括 Rust、Solana CLI、Anchor 框架等工具。

## 前置要求

- macOS、Linux 或 WSL2 (Windows)
- 至少 10GB 可用磁盘空间
- 稳定的网络连接

## 自动安装（推荐）

运行自动安装脚本：

```bash
./scripts/setup-solana-dev.sh
```

脚本将自动完成以下步骤：
1. 安装 Rust 编程语言
2. 安装 Solana CLI 工具
3. 安装 Anchor 框架
4. 配置 Solana 到 Devnet
5. 创建开发钱包并请求测试 SOL

## 手动安装

### 1. 安装 Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

验证安装：
```bash
rustc --version
cargo --version
```

### 2. 安装 Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

添加到 PATH（添加到 ~/.bashrc 或 ~/.zshrc）：
```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

验证安装：
```bash
solana --version
```

### 3. 安装 Anchor 框架

```bash
# 安装 AVM (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# 安装最新版本的 Anchor
avm install latest
avm use latest
```

验证安装：
```bash
anchor --version
```

### 4. 配置 Solana 网络

配置到 Devnet（开发测试网）：
```bash
solana config set --url https://api.devnet.solana.com
```

查看当前配置：
```bash
solana config get
```

### 5. 创建开发钱包

创建新钱包：
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

查看钱包地址：
```bash
solana address
```

### 6. 获取测试 SOL

通过命令行请求空投：
```bash
solana airdrop 2
```

或访问 Solana Faucet：
- https://faucet.solana.com

查看余额：
```bash
solana balance
```

## 验证安装

运行以下命令验证所有工具已正确安装：

```bash
# 检查 Rust
rustc --version
cargo --version

# 检查 Solana CLI
solana --version
solana config get
solana balance

# 检查 Anchor
anchor --version

# 检查 Node.js (用于 TypeScript 开发)
node --version
npm --version
yarn --version
```

## 配置 Phantom 钱包（可选）

Phantom 是最流行的 Solana 钱包浏览器扩展。

1. 访问 https://phantom.app
2. 下载并安装浏览器扩展
3. 创建新钱包或导入现有钱包
4. 切换到 Devnet 网络：
   - 点击设置 → 开发者设置
   - 启用"测试网模式"
   - 选择 Devnet

## 本地测试验证器

启动本地 Solana 测试验证器（用于快速开发）：

```bash
solana-test-validator
```

在另一个终端配置到本地网络：
```bash
solana config set --url http://localhost:8899
```

## 常见问题

### 1. 空投失败

如果 `solana airdrop` 失败，可以：
- 访问 https://faucet.solana.com 手动请求
- 等待几分钟后重试
- 检查网络连接

### 2. Anchor 安装失败

确保已安装所有依赖：
```bash
# macOS
brew install pkg-config openssl

# Ubuntu/Debian
sudo apt-get install pkg-config libssl-dev
```

### 3. 权限错误

如果遇到权限问题：
```bash
sudo chown -R $(whoami) ~/.cargo
```

## 下一步

环境搭建完成后，你可以：

1. 创建第一个 Solana Program
2. 学习 Anchor 框架
3. 部署到 Devnet
4. 开发前端 DApp

## 有用的资源

- [Solana 官方文档](https://docs.solana.com)
- [Anchor 文档](https://www.anchor-lang.com)
- [Solana Cookbook](https://solanacookbook.com)
- [Solana Stack Exchange](https://solana.stackexchange.com)

## 环境变量

建议在 `.env` 文件中配置以下环境变量：

```bash
# Solana 配置
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WALLET_PATH=~/.config/solana/id.json

# Helius RPC (可选，用于更好的性能)
HELIUS_API_KEY=your_api_key_here
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=your_api_key_here
```

## 故障排查

如果遇到问题，请检查：

1. 网络连接是否正常
2. 防火墙是否阻止了连接
3. 是否有足够的磁盘空间
4. Rust 和 Solana CLI 版本是否兼容

获取帮助：
```bash
solana --help
anchor --help
```
