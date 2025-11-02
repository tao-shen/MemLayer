# Memory Visualization Service

A comprehensive visualization service for the Agent Memory Platform that provides real-time visualization of all memory types (STM, Episodic, Semantic, and Reflection).

## Features

- **Multiple Visualization Views**
  - Timeline View: Chronological display of memories
  - Graph View: Network visualization of memory relationships
  - List View: Tabular display with sorting and filtering
  - Statistics View: Analytics and insights

- **Real-time Updates**: WebSocket support for live memory updates
- **Advanced Filtering**: Filter by type, time range, importance, and search queries
- **Data Export**: Export to JSON, CSV formats
- **Performance Optimized**: Redis caching, pagination, and efficient queries

## Architecture

```
services/visualization-service/
├── src/
│   ├── services/
│   │   ├── visualization-service.ts    # Main service
│   │   ├── data-aggregator.ts          # Data aggregation from memory engines
│   │   ├── graph-builder.ts            # Graph construction and layout
│   │   └── statistics-calculator.ts    # Statistics computation
│   ├── types/
│   │   └── index.ts                    # TypeScript types
│   ├── websocket-server.ts             # WebSocket server
│   └── index.ts                        # Exports
├── package.json
└── tsconfig.json
```

## Installation

```bash
cd services/visualization-service
npm install
```

## Configuration

Environment variables:

```bash
MEMORY_SERVICE_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
```

## Usage

### Starting the Service

```bash
npm run dev
```

### API Endpoints

#### Get Visualization Data
```
GET /v1/agents/:agentId/visualization/data
Query params:
  - types: comma-separated memory types
  - startDate, endDate: time range
  - minImportance, maxImportance: importance range
  - searchQuery: search text
  - includeRelationships: boolean
  - includeSimilarities: boolean
  - similarityThreshold: number (0-1)
```

#### Get Timeline Data
```
GET /v1/agents/:agentId/visualization/timeline
Query params: (same as above) + includeMilestones
```

#### Get Graph Data
```
GET /v1/agents/:agentId/visualization/graph
Query params: (same as above) + layout, showSimilarityEdges
```

#### Get Statistics
```
GET /v1/agents/:agentId/visualization/statistics
Query params:
  - timeGranularity: hour|day|week|month
  - includeAccessFrequency: boolean
```

#### Export Data
```
POST /v1/agents/:agentId/visualization/export
Body:
  - format: json|csv
  - includeMetadata: boolean
  - filters: MemoryFilters object
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/v1/visualization/updates');

// Authenticate
ws.send(JSON.stringify({
  type: 'authenticate',
  agentId: 'your-agent-id',
  token: 'your-jwt-token'
}));

// Subscribe
ws.send(JSON.stringify({
  type: 'subscribe'
}));

// Handle updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'memory-update') {
    console.log('Memory updated:', message.data);
  }
};
```

## Frontend

The frontend is a React application located in `frontend/memory-visualization/`.

### Starting the Frontend

```bash
cd frontend/memory-visualization
npm install
npm run dev
```

The frontend will be available at `http://localhost:3100`.

### Frontend Features

- **Dashboard**: Main interface with view switching
- **Timeline View**: D3.js-based timeline visualization
- **Graph View**: Force-directed graph with D3.js
- **List View**: Virtual scrolling for large datasets
- **Statistics View**: Charts with Recharts
- **Real-time Updates**: Automatic UI updates via WebSocket
- **Export**: Download data in various formats

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## Integration

### Adding to Docker Compose

```yaml
visualization-service:
  build: ./services/visualization-service
  ports:
    - "3002:3002"
  environment:
    - MEMORY_SERVICE_URL=http://memory-service:3001
    - REDIS_URL=redis://redis:6379
  depends_on:
    - redis
    - memory-service
```

### Updating API Gateway

The visualization routes are automatically registered in the API Gateway at `/v1/agents/:agentId/visualization/*`.

## Performance Considerations

- **Caching**: Redis caching with 5-minute TTL
- **Pagination**: Virtual scrolling for large datasets
- **WebSocket Batching**: Updates batched in 100ms windows
- **Graph Optimization**: Canvas rendering for 1000+ nodes

## Security

- JWT authentication required for all endpoints
- WebSocket connections require authentication
- Rate limiting applied (100 req/min for API, 1000 msg/min for WebSocket)
- Input validation on all parameters

## Troubleshooting

### WebSocket Connection Issues

- Ensure WebSocket server is running
- Check firewall settings
- Verify authentication token is valid

### Performance Issues

- Check Redis connection
- Monitor memory usage
- Consider increasing cache TTL
- Use pagination for large datasets

### Data Not Updating

- Verify WebSocket connection
- Check memory service is emitting events
- Ensure cache invalidation is working

## License

MIT
