#!/bin/bash

# Solana 开发环境搭建脚本
# 此脚本将安装 Rust、Solana CLI、Anchor 框架和相关工具

set -e

echo "🚀 开始 Solana 开发环境搭建..."

# 检查操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "检测到操作系统: $MACHINE"

# 1. 安装 Rust
echo ""
echo "📦 步骤 1/5: 安装 Rust..."
if command -v rustc &> /dev/null; then
    echo "✅ Rust 已安装: $(rustc --version)"
else
    echo "正在安装 Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    echo "✅ Rust 安装完成"
fi

# 2. 安装 Solana CLI
echo ""
echo "📦 步骤 2/5: 安装 Solana CLI..."
if command -v solana &> /dev/null; then
    echo "✅ Solana CLI 已安装: $(solana --version)"
else
    echo "正在安装 Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo "✅ Solana CLI 安装完成"
fi

# 3. 安装 Anchor
echo ""
echo "📦 步骤 3/5: 安装 Anchor 框架..."
if command -v anchor &> /dev/null; then
    echo "✅ Anchor 已安装: $(anchor --version)"
else
    echo "正在安装 Anchor..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    echo "✅ Anchor 安装完成"
fi

# 4. 配置 Solana 到 Devnet
echo ""
echo "📦 步骤 4/5: 配置 Solana 网络..."
solana config set --url https://api.devnet.solana.com
echo "✅ Solana 配置为 Devnet"

# 5. 创建开发钱包
echo ""
echo "📦 步骤 5/5: 创建开发钱包..."
WALLET_PATH="$HOME/.config/solana/id.json"
if [ -f "$WALLET_PATH" ]; then
    echo "✅ 钱包已存在: $WALLET_PATH"
else
    solana-keygen new --outfile $WALLET_PATH --no-bip39-passphrase
    echo "✅ 钱包创建完成"
fi

# 获取钱包地址
WALLET_ADDRESS=$(solana address)
echo ""
echo "💰 钱包地址: $WALLET_ADDRESS"

# 请求 Devnet SOL
echo ""
echo "💸 正在请求 Devnet SOL..."
solana airdrop 2 $WALLET_ADDRESS || echo "⚠️  空投失败，请手动访问 https://faucet.solana.com"

# 检查余额
BALANCE=$(solana balance)
echo "💰 当前余额: $BALANCE"

# 安装其他依赖
echo ""
echo "📦 安装其他依赖..."
if command -v node &> /dev/null; then
    echo "✅ Node.js 已安装: $(node --version)"
    npm install -g yarn
    echo "✅ Yarn 已安装"
else
    echo "⚠️  请先安装 Node.js (https://nodejs.org)"
fi

echo ""
echo "✅ Solana 开发环境搭建完成！"
echo ""
echo "📝 下一步："
echo "  1. 运行 'solana config get' 查看配置"
echo "  2. 运行 'solana balance' 查看余额"
echo "  3. 如需更多 SOL，访问: https://faucet.solana.com"
echo "  4. 开始开发 Solana Program!"
echo ""
