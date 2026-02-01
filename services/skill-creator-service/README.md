# Skill Creator Service

Backend API for the Skills Replica application.

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API keys
```

Required environment variables:

- `OPENAI_API_KEY` - OpenAI API key for fallback execution

Optional:

- `OPENCODE_HOST` - OpenCode server host (default: 127.0.0.1)
- `OPENCODE_PORT` - OpenCode server port (default: 44681)
- `PORT` - Service port (default: 3001)

### 2. Start the Service

```bash
# Development mode (auto-reload)
npm run dev

# Or use the startup script
./start.sh

# Production mode
npm run build
npm start
```

### 3. Verify

```bash
curl https://opencode.tao-shen.com/health
# Should return: {"status":"ok"}
```

## Endpoints

| Method | Endpoint                       | Description        |
| ------ | ------------------------------ | ------------------ |
| POST   | `/api/skills/:skillId/execute` | Execute a skill    |
| GET    | `/api/skills`                  | List user's skills |
| POST   | `/api/skills`                  | Create a new skill |
| GET    | `/api/skills/:skillId`         | Get skill details  |
| GET    | `/health`                      | Health check       |

## CORS Configuration

The service allows requests from:

- `http://localhost:5173` (local frontend)
- `http://localhost:3001` (local dev)
- `https://tacits-candy-shop.vercel.app` (production frontend)
- `https://opencode.tao-shen.com` (production)

## Troubleshooting

### Port already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill <PID>
```

### Database errors

This service uses Prisma for database access. Ensure:

1. PostgreSQL is running
2. `DATABASE_URL` is set in environment
3. Run `npx prisma migrate deploy` to apply migrations

### OpenCode connection failed

The service will automatically fall back to OpenAI if OpenCode is unavailable. Ensure `OPENAI_API_KEY` is configured.
