#!/bin/bash

echo "🚀 启动 Memory Platform 前端演示..."
echo ""

# 检查后端是否运行
echo "📡 检查后端 API..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 后端 API 正在运行 (http://localhost:3000)"
else
    echo "⚠️  后端 API 未运行"
    echo "请先启动后端: pnpm --filter @agent-memory/api-gateway dev"
    echo ""
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动前端
echo ""
echo "🎨 启动前端开发服务器..."
echo "📍 前端地址: http://localhost:5173"
echo ""
npm run dev
