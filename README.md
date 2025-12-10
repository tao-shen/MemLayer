# MemLayer - Agent Memory Platform

<div align="center">

**Professional Memory Infrastructure for AI Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![GitHub](https://img.shields.io/github/stars/tao-shen/MemLayer?style=social)](https://github.com/tao-shen/MemLayer)

Empowering everyone to own, share, and monetize their experience in the age of AI.

[Vision](#-vision) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#️-architecture)

</div>

---

## 🌍 Vision

**AI Democratization: Every Individual Deserves Their Own AI**

We are building MemLayer to realize a future where AI is truly personal and accessible to everyone. Our vision is to empower every individual to own their own AI that learns from their unique experiences.

- **Experience to Memory**: Transform your personal life experiences into structured, AI-readable memory.
- **Shared Value**: Participate in a collaborative ecosystem where you can share your memories and knowledge to train better AIs, and **get paid for it**. Your unique perspective is an asset.


## 📖 About

**MemLayer is not just a database; it is the cognitive foundation for your Digital Self.**

In the era of AI, your experiences, knowledge, and memories are your most valuable assets. MemLayer allows you to capture, structure, and own these assets, enabling you to run **Personal AIs** that truly understand you—because they remember what you remember.

-   **Cognitive Sovereignty**: You own your memory. It's encrypted, decentralized, and under your control.
-   **Universal Compatibility**: A standardized memory layer that any AI agent can plug into (with your permission) to serve you better.
-   **Living Memory**: A dynamic system that evolves with you, turning daily interactions into structured wisdom.

## 🌟 Features

### Your Digital Twin's Brain
-   **Short-Term Memory (STM)**: Fluid conversation context that makes interactions feel natural.
-   **Episodic Memory**: **"Time Travel" for AI.** It remembers your history, personal stories, and life events exactly as they happened.
-   **Semantic Memory**: **Your Personal Knowledge Graph.** It organizes what you know into a structured web of concepts, making your AI smarter over time.
-   **Reflection**: An internal monologue that digests your experiences to generate new insights and self-awareness for your AI.

### Memory Economy & Ownership
-   **Turn Experience into Assets**: Mint your high-value memories and knowledge contributions as **cNFTs (Compressed NFTs)** on Solana.
-   **Get Paid to Share**: Participate in the collaborative training of specialized models. If your shared memory helps an AI learn a new skill, **you get paid**.
-   **Decentralized Permanence**: Store critical memories on Arweave/IPFS. Your digital legacy lives forever, independent of any central server.

### Privacy & Control
-   **You Hold the Keys**: Military-grade **AES-256-GCM encryption** ensures that only you (and the agents you authorize) can read your thoughts.
-   **Granular Access**: Grant specific agents access to specific memory segments. "My financial advisor AI sees my ledger, but not my diary."
-   **Audit Trails**: See exactly who accessed what and when.

### Advanced Cognitive Architecture
-   **Visual Recall**: Vector search capabilities (Qdrant) allow agents to find "similar" past situations instantly.
-   **Reasoning Engine**: Knowledge graphs (Neo4j) enable complex reasoning and connecting dots between seemingly unrelated facts.
-   **Hybrid Intelligence**: Fuses vector similarity with structural knowledge for human-like recall.

## 🏗️ Architecture: The Engine of Democratized AI

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
