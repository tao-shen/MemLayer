#!/bin/bash

# Agent Memory Platform Startup Script

set -e

echo "🚀 Starting Agent Memory Platform..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env with your configuration"
fi

# Start infrastructure
echo "📦 Starting infrastructure services..."
docker-compose up -d postgres qdrant neo4j redis prometheus grafana jaeger

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Initialize databases
echo "🗄️  Initializing databases..."
# PostgreSQL is auto-initialized via init-db.sql
# Neo4j is auto-initialized via init-neo4j.cypher

# Initialize Qdrant collections
echo "📊 Initializing vector collections..."
# This would be done by the application on first run

echo "✅ Infrastructure is ready!"
echo ""
echo "📝 Next steps:"
echo "1. Install dependencies: pnpm install"
echo "2. Build services: pnpm build"
echo "3. Start API Gateway: pnpm --filter @agent-memory/api-gateway start"
echo ""
echo "🌐 Services:"
echo "  - API Gateway: http://localhost:3000"
echo "  - PostgreSQL: localhost:5432"
echo "  - Qdrant: http://localhost:6333"
echo "  - Neo4j: http://localhost:7474"
echo "  - Redis: localhost:6379"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001"
echo "  - Jaeger: http://localhost:16686"
