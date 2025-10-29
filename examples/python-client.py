#!/usr/bin/env python3
"""
Agent Memory Platform - Python Client Example
"""

import requests
import json

class AgentMemoryClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def create_agent(self, user_id, name):
        """Create a new agent"""
        response = requests.post(
            f"{self.base_url}/agents",
            headers=self.headers,
            json={"userId": user_id, "name": name}
        )
        return response.json()
    
    def store_memory(self, agent_id, content, memory_type="episodic", importance=5):
        """Store a memory"""
        response = requests.post(
            f"{self.base_url}/agents/{agent_id}/memories",
            headers=self.headers,
            json={
                "content": content,
                "type": memory_type,
                "importance": importance
            }
        )
        return response.json()
    
    def retrieve_memories(self, agent_id, limit=10):
        """Retrieve memories"""
        response = requests.get(
            f"{self.base_url}/agents/{agent_id}/memories",
            headers=self.headers,
            params={"limit": limit}
        )
        return response.json()
    
    def rag_query(self, agent_id, query, mode="standard", top_k=5):
        """Perform RAG query"""
        response = requests.post(
            f"{self.base_url}/agents/{agent_id}/rag/retrieve",
            headers=self.headers,
            json={
                "query": query,
                "mode": mode,
                "topK": top_k
            }
        )
        return response.json()

# Example usage
if __name__ == "__main__":
    client = AgentMemoryClient(
        base_url="http://localhost:3000/v1",
        api_key="your-jwt-token-here"
    )
    
    # Create agent
    agent = client.create_agent("user-123", "My Assistant")
    agent_id = agent["id"]
    print(f"Created agent: {agent_id}")
    
    # Store memories
    client.store_memory(agent_id, "User prefers dark mode", importance=7)
    client.store_memory(agent_id, "User is interested in AI", importance=8)
    print("Stored memories")
    
    # Retrieve memories
    memories = client.retrieve_memories(agent_id)
    print(f"Retrieved {len(memories['memories'])} memories")
    
    # RAG query
    result = client.rag_query(agent_id, "What are the user's preferences?")
    print(f"RAG result: {result['augmentedPrompt'][:100]}...")
