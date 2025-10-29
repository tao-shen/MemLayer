#!/usr/bin/env node
/**
 * Agent Memory Platform - Node.js Client Example
 */

const axios = require('axios');

class AgentMemoryClient {
  constructor(baseURL, apiKey) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createAgent(userId, name) {
    const response = await this.client.post('/agents', { userId, name });
    return response.data;
  }

  async storeMemory(agentId, content, type = 'episodic', importance = 5) {
    const response = await this.client.post(`/agents/${agentId}/memories`, {
      content,
      type,
      importance,
    });
    return response.data;
  }

  async retrieveMemories(agentId, limit = 10) {
    const response = await this.client.get(`/agents/${agentId}/memories`, {
      params: { limit },
    });
    return response.data;
  }

  async ragQuery(agentId, query, mode = 'standard', topK = 5) {
    const response = await this.client.post(`/agents/${agentId}/rag/retrieve`, {
      query,
      mode,
      topK,
    });
    return response.data;
  }
}

// Example usage
async function main() {
  const client = new AgentMemoryClient(
    'http://localhost:3000/v1',
    'your-jwt-token-here'
  );

  // Create agent
  const agent = await client.createAgent('user-123', 'My Assistant');
  console.log(`Created agent: ${agent.id}`);

  // Store memories
  await client.storeMemory(agent.id, 'User prefers dark mode', 'episodic', 7);
  await client.storeMemory(agent.id, 'User is interested in AI', 'episodic', 8);
  console.log('Stored memories');

  // Retrieve memories
  const memories = await client.retrieveMemories(agent.id);
  console.log(`Retrieved ${memories.memories.length} memories`);

  // RAG query
  const result = await client.ragQuery(agent.id, "What are the user's preferences?");
  console.log(`RAG result: ${result.augmentedPrompt.substring(0, 100)}...`);
}

main().catch(console.error);
