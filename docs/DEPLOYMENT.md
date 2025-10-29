# Deployment Guide

## Local Development

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose

### Setup

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Start infrastructure:
```bash
./scripts/start.sh
# or
pnpm docker:up
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run database migrations:
```bash
pnpm --filter @agent-memory/database prisma:migrate
```

6. Start services:
```bash
pnpm dev
```

## Docker Deployment

### Build Images

```bash
docker build -f services/api-gateway/Dockerfile -t agent-memory-api-gateway:latest .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

## Production Deployment

### Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis host
- `QDRANT_HOST`: Qdrant host
- `NEO4J_URI`: Neo4j connection URI
- `OPENAI_API_KEY`: OpenAI API key
- `JWT_SECRET`: JWT signing secret

### Health Checks

- API Gateway: `GET /health`
- Returns: `{"status": "healthy", "timestamp": "..."}`

### Monitoring

- Prometheus metrics: `http://localhost:9090`
- Grafana dashboards: `http://localhost:3001`
- Jaeger tracing: `http://localhost:16686`

## Kubernetes Deployment

(Kubernetes manifests would be added here)

## Scaling

The platform is designed for horizontal scaling:
- API Gateway: Stateless, scale freely
- Memory Service: Stateless, scale freely
- Databases: Use managed services or clustering

## Backup and Recovery

### Database Backups

PostgreSQL:
```bash
pg_dump -h localhost -U postgres agent_memory > backup.sql
```

Qdrant:
```bash
# Use Qdrant's snapshot API
curl -X POST http://localhost:6333/collections/episodic_memories/snapshots
```

Neo4j:
```bash
# Use Neo4j backup tools
neo4j-admin backup --backup-dir=/backups
```
