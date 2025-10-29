# MemLayer - Agent Memory Platform

<div align="center">

**Professional AI Agent Memory System Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

A comprehensive memory system for AI Agents with episodic, semantic, and procedural memory support, featuring vector search, knowledge graphs, RAG, and reflection mechanisms.

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#️-architecture)

</div>

---

## 📖 About

MemLayer is a professional-grade memory platform for AI Agents, inspired by cognitive science and implementing the complete memory architecture described in modern AI research. It provides:

- **Multi-type Memory System**: Short-term, episodic, semantic, and procedural memory
- **Advanced Retrieval**: Vector search, knowledge graphs, and hybrid strategies
- **RAG Support**: Both standard and agentic RAG workflows
- **Reflection Mechanism**: LLM-powered insight generation from experiences
- **Production-Ready**: Full authentication, monitoring, and scalability

## 🌟 Features

- **Short-Term Memory (STM)**: Session-level context window management
- **Long-Term Memory (LTM)**:
  - **Episodic Memory**: Time-stamped personal experiences and interactions
  - **Semantic Memory**: Structured factual knowledge and knowledge graphs
  - **Procedural Memory**: Learned skills and behavior patterns
- **Vector Database**: Efficient semantic similarity search using Qdrant
- **Knowledge Graph**: Complex relationship reasoning using Neo4j
- **RAG (Retrieval-Augmented Generation)**: Standard and Agentic RAG workflows
- **Reflection Mechanism**: Abstract insight generation from experiences
- **Three-Component Retrieval**: Recency, importance, and relevance scoring
- **Intelligent Memory Management**: Filtering, forgetting, and consolidation
- **Security**: Data encryption, RBAC, audit logging
- **Monitoring**: Prometheus metrics, Grafana dashboards, Jaeger tracing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  (AI Agents, Web Apps, Third-party Services)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   API Gateway Layer                          │
│  (Auth, Rate Limiting, Routing, Versioning)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Service Layer                             │
│  Memory │ Embedding │ Retrieval │ Reflection │ Management   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Core Engine Layer                            │
│  STM │ Episodic Memory │ Semantic Memory │ RAG │ Reflection │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Storage Layer                              │
│  Vector DB │ Knowledge Graph │ Time-Series │ Relational │ Cache│
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd agent-memory-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start infrastructure services:
```bash
pnpm docker:up
```

5. Run database migrations:
```bash
pnpm migrate
```

6. Start development servers:
```bash
pnpm dev
```

The API Gateway will be available at `http://localhost:3000`

## 📚 Documentation

- [Architecture Documentation](.kiro/specs/agent-memory-platform/design.md)
- [Requirements Specification](.kiro/specs/agent-memory-platform/requirements.md)
- [API Documentation](http://localhost:3000/api-docs) (when running)
- [Implementation Tasks](.kiro/specs/agent-memory-platform/tasks.md)

## 🛠️ Technology Stack

### Backend
- **Language**: TypeScript / Node.js
- **Framework**: Express.js
- **API Documentation**: OpenAPI 3.0 / Swagger

### Databases
- **Vector Database**: Qdrant
- **Knowledge Graph**: Neo4j
- **Relational**: PostgreSQL
- **Cache**: Redis

### External Services
- **Embedding Model**: OpenAI Embeddings API
- **LLM**: OpenAI GPT-4 (for reflection and scoring)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Tracing**: Jaeger

## 📦 Project Structure

```
agent-memory-platform/
├── packages/
│   └── shared/              # Shared types and utilities
├── services/
│   ├── api-gateway/         # API Gateway service
│   ├── memory-service/      # Core memory management
│   ├── embedding-service/   # Embedding generation
│   ├── retrieval-service/   # Retrieval and RAG
│   ├── reflection-service/  # Reflection mechanism
│   └── management-service/  # Memory lifecycle management
├── scripts/                 # Database initialization scripts
├── config/                  # Configuration files
├── docker-compose.yml       # Docker services definition
└── .kiro/specs/            # Project specifications
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific service tests
pnpm --filter @agent-memory/memory-service test
```

## 🔧 Development

```bash
# Start all services in development mode
pnpm dev

# Build all services
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format

# View Docker logs
pnpm docker:logs
```

## 📊 Monitoring

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Jaeger UI**: http://localhost:16686
- **Neo4j Browser**: http://localhost:7474 (neo4j/neo4j_password)

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Audit logging for all operations
- Rate limiting and DDoS protection

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📧 Contact

For questions and support, please open an issue on GitHub.
