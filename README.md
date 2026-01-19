# MemLayer - Agent Memory Platform

<div align="center">

**Professional Memory Infrastructure for AI Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

Empowering everyone to own, share, and monetize their experience in the age of AI.

[Vision](#-vision) • [Quick Start](#-quick-start) • [Agent Store](#-agent-store) • [Documentation](#-documentation)

</div>

---

## 🌍 Vision

**AI Democratization: Every Individual Deserves Their Own AI**

We are building MemLayer to realize a future where AI is truly personal and accessible to everyone.

- **Experience to Memory**: Transform your personal life experiences into structured, AI-readable memory.
- **Shared Value**: Participate in a collaborative ecosystem where you can share your memories and knowledge to train better AIs, and **get paid for it**.

## 🌟 Features

### Your Digital Twin's Brain
- **Short-Term Memory (STM)**: Fluid conversation context for natural interactions
- **Episodic Memory**: "Time Travel" for AI - remembers your history and life events
- **Semantic Memory**: Personal Knowledge Graph that organizes your knowledge
- **Reflection**: Internal monologue that generates insights and self-awareness

### Memory Economy & Ownership
- **Turn Experience into Assets**: Mint memories as cNFTs on Solana
- **Get Paid to Share**: Earn from your shared memory contributions
- **Decentralized Permanence**: Store on Arweave/IPFS forever

### Privacy & Control
- **AES-256-GCM Encryption**: Military-grade protection
- **Granular Access**: Control which agents see which memories
- **Audit Trails**: Full transparency on data access

## 🛒 Agent Store

A Fiverr-style marketplace for AI Agents. Browse, discover, and purchase AI agents for any task.

### Run Agent Store

```bash
cd frontend/agent-store
npm install
npm run dev
```

Visit http://localhost:3000

### Features
- Modern, responsive UI
- Search and filter agents
- Category browsing
- Agent detail pages with pricing packages
- Favorites and cart functionality

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose

### Installation

```bash
# Clone the repository
git clone https://github.com/tao-shen/MemLayer.git
cd MemLayer

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services
pnpm docker:up

# Start development servers
pnpm dev
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  (AI Agents, Web Apps, Agent Store)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   API Gateway Layer                          │
│  (Auth, Rate Limiting, Routing)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Service Layer                             │
│  Memory │ Embedding │ Retrieval │ Reflection │ Management   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Storage Layer                              │
│  Vector DB │ Knowledge Graph │ PostgreSQL │ Redis           │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
MemLayer/
├── packages/                # Shared packages
│   ├── shared/              # Shared types and utilities
│   ├── database/            # Database client (Prisma)
│   ├── vector-db/           # Qdrant client
│   └── cache/               # Redis client
├── services/                # Core microservices
│   ├── api-gateway/         # API Gateway
│   └── ...                  # Other services
├── blockchain/              # Blockchain module
│   ├── programs/            # Solana smart contracts
│   ├── services/            # Blockchain services
│   └── sdk/                 # TypeScript & Rust SDKs
├── frontend/                # Frontend applications
│   ├── agent-store/         # Agent Store marketplace
│   ├── chat-interface/      # Chat interface
│   └── memory-visualization/ # Memory visualization
├── docs/                    # Documentation
└── docker-compose.yml       # Docker services
```

## 🛠️ Technology Stack

- **Backend**: TypeScript, Node.js, Express.js
- **Frontend**: React, Tailwind CSS, Zustand
- **Databases**: Qdrant, Neo4j, PostgreSQL, Redis
- **Blockchain**: Solana, Metaplex Bubblegum
- **Storage**: Arweave, IPFS

## 📚 Documentation

- [API Guide](docs/API_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Blockchain Module](blockchain/README.md)
- [Solana Setup](docs/SOLANA_SETUP.md)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## 🔗 Links

- [GitHub Repository](https://github.com/tao-shen/MemLayer)
- [Report Issues](https://github.com/tao-shen/MemLayer/issues)
