#!/bin/bash

echo "=== API Gateway 测试 ==="
echo ""

# 测试健康检查
echo "1. 测试健康检查端点..."
curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health
echo ""
echo ""

# 测试未认证的请求
echo "2. 测试未认证的 agents 请求（应该返回 401）..."
curl -s http://localhost:3000/v1/agents | jq '.' 2>/dev/null || curl -s http://localhost:3000/v1/agents
echo ""
echo ""

# 测试 blockchain 路由（不需要认证的端点）
echo "3. 测试 blockchain 挑战生成..."
curl -s -X POST http://localhost:3000/v1/blockchain/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"test123"}' | jq '.' 2>/dev/null || \
  curl -s -X POST http://localhost:3000/v1/blockchain/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"test123"}'
echo ""
echo ""

echo "=== 测试完成 ==="
echo ""
echo "✅ API Gateway 正在运行在 http://localhost:3000"
echo "✅ 健康检查端点: http://localhost:3000/health"
echo ""
echo "📝 注意："
echo "  - 大多数端点需要 JWT 认证"
echo "  - 使用 POST /v1/agents 创建 agent 需要认证"
echo "  - Blockchain 端点可能需要 Solana 签名认证"
