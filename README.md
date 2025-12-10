# MemLayer - Agent Memory Platform

<div align="center">

**Professional AI Agent Memory System Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![GitHub](https://img.shields.io/github/stars/tao-shen/MemLayer?style=social)](https://github.com/tao-shen/MemLayer)

A comprehensive memory system for AI Agents with episodic, semantic, and procedural memory support, featuring vector search, knowledge graphs, RAG, and reflection mechanisms.

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#️-architecture)

</div>

---

## 🌍 Vision

**AI Democratization: Every Individual Deserves Their Own AI**

We are building MemLayer to realize a future where AI is truly personal and accessible to everyone. Our vision is to empower every individual to own their own AI that learns from their unique experiences.

- **Experience to Memory**: Transform your personal life experiences into structured, AI-readable memory.
- **Shared Value**: Participate in a collaborative ecosystem where you can share your memories and knowledge to train better AIs, and **get paid for it**. Your unique perspective is an asset.


## 📖 About

MemLayer is a professional-grade memory platform for AI Agents, inspired by cognitive science and implementing the complete memory architecture described in modern AI research. It provides:

- **Multi-type Memory System**: Short-term, episodic, semantic, and procedural memory
- **Advanced Retrieval**: Vector search, knowledge graphs, and hybrid strategies
- **RAG Support**: Both standard and agentic RAG workflows
- **Reflection Mechanism**: LLM-powered insight generation from experiences
- **Production-Ready**: Full authentication, monitoring, and scalability

## 🌟 Features

### Core Memory System
- **Short-Term Memory (STM)**: Session-level context window management
- **Long-Term Memory (LTM)**:
  - **Episodic Memory**: Time-stamped personal experiences and interactions
  - **Semantic Memory**: Structured factual knowledge and knowledge graphs
  - **Reflection Memory**: LLM-powered insight generation from experiences

### Advanced Retrieval
- **Vector Search**: Efficient semantic similarity search using Qdrant
- **Knowledge Graph**: Complex relationship reasoning using Neo4j
- **Hybrid Retrieval**: Multi-strategy fusion for optimal results
- **RAG (Retrieval-Augmented Generation)**: Standard and Agentic RAG workflows
- **Three-Component Scoring**: Recency, importance, and relevance scoring

### Blockchain Integration
- **Solana Smart Contracts**: Memory asset minting with compressed NFTs (cNFT)
- **Permanent Storage**: Arweave/IPFS integration for decentralized storage
- **End-to-End Encryption**: AES-256-GCM encryption for privacy protection
- **Batch Optimization**: Automatic batching to reduce costs by 30-50%
- **Access Control**: Fine-grained permissions with audit logging
- **TypeScript & Rust SDKs**: Complete client libraries

### Visualization & UI
- **Real-time Visualization**: Timeline, graph, list, and statistics views
- **Chat Interface**: Integrated chat interface with all features
- **WebSocket Support**: Real-time updates and notifications
- **Responsive Design**: Perfect adaptation for desktop, tablet, and mobile

### Production Ready
- **Security**: JWT authentication, RBAC, data encryption, audit logging
- **Monitoring**: Prometheus metrics, Grafana dashboards, Jaeger tracing
- **Scalability**: Microservices architecture with horizontal scaling
- **DevOps**: Docker containerization, Kubernetes ready, CI/CD support

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
git clone https://github.com/tao-shen/MemLayer.git
cd MemLayer
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

- [Architecture Documentation](PROJECT_ARCHITECTURE.md) - Complete system architecture
- [API Documentation](docs/API_GUIDE.md) - API usage guide
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions
- [Blockchain Module](blockchain/README.md) - Blockchain integration guide
- [Solana Setup](docs/SOLANA_SETUP.md) - Solana environment setup
- [API Reference](http://localhost:3000/api-docs) - Swagger UI (when running)

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
- **Blockchain**: Solana Network, Metaplex Bubblegum
- **Storage**: Arweave, IPFS (Pinata)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Tracing**: Jaeger

## 📦 Project Structure

```
MemLayer/
├── packages/                # Shared packages
│   ├── shared/              # Shared types and utilities
│   ├── database/            # Database client (Prisma)
│   ├── vector-db/           # Qdrant client
│   ├── knowledge-graph/     # Neo4j client
│   └── cache/               # Redis client
├── services/                # Core microservices
│   ├── api-gateway/         # API Gateway service
│   ├── memory-service/      # Core memory management
│   ├── embedding-service/   # Embedding generation
│   ├── retrieval-service/   # Retrieval and RAG
│   ├── reflection-service/  # Reflection mechanism
│   ├── management-service/  # Memory lifecycle management
│   └── visualization-service/ # Visualization service
├── blockchain/             # Blockchain module
│   ├── programs/            # Solana smart contracts
│   ├── services/            # Blockchain services
│   ├── sdk/                 # TypeScript & Rust SDKs
│   └── cli/                 # CLI tools
├── frontend/                # Frontend applications
│   ├── chat-interface/      # Chat interface
│   └── memory-visualization/ # Memory visualization
├── scripts/                 # Database initialization scripts
├── config/                  # Configuration files
├── docs/                    # Documentation
├── docker-compose.yml       # Docker services definition
└── package.json             # Root package.json
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

## 🔗 Links

- **GitHub Repository**: [https://github.com/tao-shen/MemLayer](https://github.com/tao-shen/MemLayer)
- **Issues**: [Report a bug or request a feature](https://github.com/tao-shen/MemLayer/issues)
- **Documentation**: See [docs/](docs/) directory for detailed documentation

## 📧 Contact

For questions and support, please open an issue on [GitHub](https://github.com/tao-shen/MemLayer/issues).

## 🙏 Acknowledgments

MemLayer is inspired by cognitive science research and modern AI agent architectures. Special thanks to the open-source community for the amazing tools and libraries that made this project possible.
