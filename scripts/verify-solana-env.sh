#!/bin/bash

# Solana 环境验证脚本
# 检查所有必需的工具是否已正确安装

echo "🔍 验证 Solana 开发环境..."
echo ""

ERRORS=0

# 检查 Rust
echo "📦 检查 Rust..."
if command -v rustc &> /dev/null; then
    echo "  ✅ Rust: $(rustc --version)"
    echo "  ✅ Cargo: $(cargo --version)"
else
    echo "  ❌ Rust 未安装"
    ERRORS=$((ERRORS + 1))
fi

# 检查 Solana CLI
echo ""
echo "📦 检查 Solana CLI..."
if command -v solana &> /dev/null; then
    echo "  ✅ Solana CLI: $(solana --version)"
    echo "  ✅ 当前网络: $(solana config get | grep 'RPC URL' | awk '{print $3}')"
    
    # 检查钱包
    if [ -f "$HOME/.config/solana/id.json" ]; then
        WALLET_ADDRESS=$(solana address)
        BALANCE=$(solana balance 2>/dev/null || echo "0 SOL")
        echo "  ✅ 钱包地址: $WALLET_ADDRESS"
        echo "  💰 余额: $BALANCE"
        
        # 检查余额是否足够
        BALANCE_NUM=$(echo $BALANCE | awk '{print $1}')
        if (( $(echo "$BALANCE_NUM < 0.1" | bc -l) )); then
            echo "  ⚠️  余额较低，建议请求更多测试 SOL"
        fi
    else
        echo "  ⚠️  钱包未创建"
    fi
else
    echo "  ❌ Solana CLI 未安装"
    ERRORS=$((ERRORS + 1))
fi

# 检查 Anchor
echo ""
echo "📦 检查 Anchor..."
if command -v anchor &> /dev/null; then
    echo "  ✅ Anchor: $(anchor --version)"
else
    echo "  ❌ Anchor 未安装"
    ERRORS=$((ERRORS + 1))
fi

# 检查 Node.js
echo ""
echo "📦 检查 Node.js..."
if command -v node &> /dev/null; then
    echo "  ✅ Node.js: $(node --version)"
    echo "  ✅ npm: $(npm --version)"
    
    if command -v yarn &> /dev/null; then
        echo "  ✅ Yarn: $(yarn --version)"
    else
        echo "  ⚠️  Yarn 未安装（可选）"
    fi
else
    echo "  ❌ Node.js 未安装"
    ERRORS=$((ERRORS + 1))
fi

# 检查 Git
echo ""
echo "📦 检查 Git..."
if command -v git &> /dev/null; then
    echo "  ✅ Git: $(git --version)"
else
    echo "  ⚠️  Git 未安装（推荐安装）"
fi

# 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ 环境验证通过！所有必需工具已安装。"
    echo ""
    echo "📝 下一步："
    echo "  1. 确保有足够的 Devnet SOL (运行: solana airdrop 2)"
    echo "  2. 开始创建 Solana Program"
    echo "  3. 运行: cd programs && anchor init memory-asset"
else
    echo "❌ 发现 $ERRORS 个问题，请先解决这些问题。"
    echo ""
    echo "💡 运行安装脚本: ./scripts/setup-solana-dev.sh"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
