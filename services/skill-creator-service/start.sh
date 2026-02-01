#!/bin/bash

# Skill Creator Service Startup Script
# Usage: ./start.sh

set -e

echo "🚀 Starting Skill Creator Service..."

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY not set. OpenAI fallback will not work."
fi

# Set default values if not provided
export PORT=${PORT:-3001}
export OPENCODE_HOST=${OPENCODE_HOST:-127.0.0.1}
export OPENCODE_PORT=${OPENCODE_PORT:-44681}

echo "📋 Configuration:"
echo "   PORT: $PORT"
echo "   OPENCODE_HOST: $OPENCODE_HOST"
echo "   OPENCODE_PORT: $OPENCODE_PORT"
echo "   OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build if needed
if [ ! -d "dist" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

# Start the service
echo "✅ Starting server on port $PORT..."
exec npm run start
