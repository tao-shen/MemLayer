# Agent Memory Platform API Guide

## Quick Start

### Authentication

All API requests require authentication using JWT tokens:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/v1/agents
```

### Create an Agent

```bash
curl -X POST http://localhost:3000/v1/agents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "name": "My Agent"
  }'
```

### Store a Memory

```bash
curl -X POST http://localhost:3000/v1/agents/AGENT_ID/memories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "User prefers dark mode",
    "type": "episodic",
    "importance": 7
  }'
```

### Retrieve Memories

```bash
curl http://localhost:3000/v1/agents/AGENT_ID/memories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### RAG Query

```bash
curl -X POST http://localhost:3000/v1/agents/AGENT_ID/rag/retrieve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the user preferences?",
    "topK": 5,
    "mode": "standard"
  }'
```

## Best Practices

1. **Use appropriate memory types**: Short-term for session data, episodic for events, semantic for facts
2. **Set importance scores**: Help the system prioritize important memories
3. **Use RAG for context**: Retrieve relevant memories before generating responses
4. **Enable reflection**: Let the system generate insights automatically
5. **Configure forgetting**: Set policies to manage memory lifecycle

## Rate Limits

- Standard: 100 requests per minute
- Authenticated users: 1000 requests per minute

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "timestamp": "2025-10-30T10:00:00Z"
  }
}
```

Common error codes:
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_ERROR`: Too many requests
- `NOT_FOUND`: Resource not found
