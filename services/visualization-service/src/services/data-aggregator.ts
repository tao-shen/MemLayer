import axios from 'axios';
import {
  AggregatedMemory,
  MemoryFilters,
  MemoryRelationship,
  SimilarityEdge,
  VisualizationError,
  VisualizationErrorCodes,
} from '../types';

export class DataAggregator {
  private memoryServiceUrl: string;

  constructor(memoryServiceUrl: string = process.env.MEMORY_SERVICE_URL || 'http://localhost:3001') {
    this.memoryServiceUrl = memoryServiceUrl;
  }

  /**
   * Aggregate memories from all memory engines
   */
  async aggregateMemories(agentId: string, filters: MemoryFilters = {}): Promise<AggregatedMemory[]> {
    try {
      const memories: AggregatedMemory[] = [];

      // Fetch from different memory types based on filters
      const typesToFetch = filters.types || ['stm', 'episodic', 'semantic', 'reflection'];

      const fetchPromises = typesToFetch.map(type => this.fetchMemoriesByType(agentId, type, filters));
      const results = await Promise.all(fetchPromises);

      // Flatten and combine all memories
      results.forEach(typeMemories => {
        memories.push(...typeMemories);
      });

      // Apply additional filters
      let filteredMemories = memories;

      if (filters.timeRange) {
        filteredMemories = this.filterByTimeRange(filteredMemories, filters.timeRange);
      }

      if (filters.importanceRange) {
        filteredMemories = this.filterByImportance(filteredMemories, filters.importanceRange);
      }

      if (filters.searchQuery) {
        filteredMemories = this.filterBySearch(filteredMemories, filters.searchQuery);
      }

      if (filters.sessionId) {
        filteredMemories = filteredMemories.filter(m => m.sessionId === filters.sessionId);
      }

      return filteredMemories;
    } catch (error) {
      throw new VisualizationError(
        `Failed to aggregate memories: ${error instanceof Error ? error.message : 'Unknown error'}`,
        VisualizationErrorCodes.DATA_AGGREGATION_FAILED,
        500
      );
    }
  }

  /**
   * Fetch memories by type from memory service
   */
  private async fetchMemoriesByType(
    agentId: string,
    type: string,
    filters: MemoryFilters
  ): Promise<AggregatedMemory[]> {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'stm':
          endpoint = `/v1/agents/${agentId}/memories/stm`;
          break;
        case 'episodic':
          endpoint = `/v1/agents/${agentId}/memories/episodic`;
          break;
        case 'semantic':
          endpoint = `/v1/agents/${agentId}/memories/semantic`;
          break;
        case 'reflection':
          endpoint = `/v1/agents/${agentId}/memories/reflections`;
          break;
        default:
          return [];
      }

      const response = await axios.get(`${this.memoryServiceUrl}${endpoint}`);
      const rawMemories = response.data.memories || response.data;

      // Transform to AggregatedMemory format
      return rawMemories.map((memory: any) => this.transformToAggregatedMemory(memory, type));
    } catch (error) {
      console.error(`Error fetching ${type} memories:`, error);
      return [];
    }
  }

  /**
   * Transform raw memory to AggregatedMemory format
   */
  private transformToAggregatedMemory(memory: any, type: string): AggregatedMemory {
    const base: AggregatedMemory = {
      id: memory.id,
      agentId: memory.agentId,
      type: type as any,
      content: memory.content,
      timestamp: new Date(memory.timestamp || memory.createdAt),
      createdAt: new Date(memory.createdAt),
      importance: memory.importance,
      metadata: memory.metadata || {},
    };

    // Add type-specific fields
    switch (type) {
      case 'stm':
        base.sessionId = memory.sessionId;
        break;
      case 'episodic':
        base.eventType = memory.eventType;
        base.accessCount = memory.accessCount || 0;
        break;
      case 'semantic':
        base.source = memory.source;
        base.category = memory.category;
        base.verified = memory.verified;
        break;
      case 'reflection':
        base.insights = memory.insights || [];
        base.sourceMemoryIds = memory.sourceMemoryIds || [];
        break;
    }

    return base;
  }

  /**
   * Filter memories by time range
   */
  private filterByTimeRange(memories: AggregatedMemory[], timeRange: { start: Date; end: Date }): AggregatedMemory[] {
    return memories.filter(memory => {
      const timestamp = new Date(memory.timestamp);
      return timestamp >= timeRange.start && timestamp <= timeRange.end;
    });
  }

  /**
   * Filter memories by importance range
   */
  private filterByImportance(
    memories: AggregatedMemory[],
    importanceRange: { min: number; max: number }
  ): AggregatedMemory[] {
    return memories.filter(memory => {
      if (memory.importance === undefined) return false;
      return memory.importance >= importanceRange.min && memory.importance <= importanceRange.max;
    });
  }

  /**
   * Filter memories by search query
   */
  private filterBySearch(memories: AggregatedMemory[], searchQuery: string): AggregatedMemory[] {
    const query = searchQuery.toLowerCase();
    return memories.filter(memory => {
      return (
        memory.content.toLowerCase().includes(query) ||
        (memory.insights && memory.insights.some(insight => insight.toLowerCase().includes(query)))
      );
    });
  }

  /**
   * Get memory relationships (reflection sources, knowledge graph connections)
   */
  async getMemoryRelationships(memoryIds: string[]): Promise<MemoryRelationship[]> {
    try {
      const relationships: MemoryRelationship[] = [];

      // Fetch reflection relationships
      const reflectionRelationships = await this.fetchReflectionRelationships(memoryIds);
      relationships.push(...reflectionRelationships);

      // Fetch knowledge graph relationships
      const graphRelationships = await this.fetchKnowledgeGraphRelationships(memoryIds);
      relationships.push(...graphRelationships);

      return relationships;
    } catch (error) {
      console.error('Error fetching memory relationships:', error);
      return [];
    }
  }

  /**
   * Fetch reflection memory relationships
   */
  private async fetchReflectionRelationships(memoryIds: string[]): Promise<MemoryRelationship[]> {
    try {
      const relationships: MemoryRelationship[] = [];

      // For each memory, check if it's a reflection and get its sources
      for (const memoryId of memoryIds) {
        try {
          const response = await axios.get(`${this.memoryServiceUrl}/v1/memories/${memoryId}`);
          const memory = response.data;

          if (memory.type === 'reflection' && memory.sourceMemoryIds) {
            memory.sourceMemoryIds.forEach((sourceId: string) => {
              relationships.push({
                sourceId,
                targetId: memoryId,
                type: 'reflection',
              });
            });
          }
        } catch (error) {
          // Skip if memory not found
          continue;
        }
      }

      return relationships;
    } catch (error) {
      console.error('Error fetching reflection relationships:', error);
      return [];
    }
  }

  /**
   * Fetch knowledge graph relationships
   */
  private async fetchKnowledgeGraphRelationships(memoryIds: string[]): Promise<MemoryRelationship[]> {
    try {
      // Query knowledge graph for semantic relationships
      const response = await axios.post(`${this.memoryServiceUrl}/v1/knowledge-graph/relationships`, {
        memoryIds,
      });

      const graphRelations = response.data.relationships || [];
      
      return graphRelations.map((rel: any) => ({
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        type: 'semantic' as const,
        metadata: rel.metadata,
      }));
    } catch (error) {
      console.error('Error fetching knowledge graph relationships:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between memories using embeddings
   */
  async calculateSimilarities(memoryIds: string[], threshold: number = 0.7): Promise<SimilarityEdge[]> {
    try {
      // Fetch embeddings for all memories
      const embeddings = await this.fetchEmbeddings(memoryIds);
      
      const similarities: SimilarityEdge[] = [];

      // Calculate pairwise similarities
      for (let i = 0; i < memoryIds.length; i++) {
        for (let j = i + 1; j < memoryIds.length; j++) {
          const embedding1 = embeddings[memoryIds[i]];
          const embedding2 = embeddings[memoryIds[j]];

          if (embedding1 && embedding2) {
            const similarity = this.cosineSimilarity(embedding1, embedding2);
            
            if (similarity >= threshold) {
              similarities.push({
                sourceId: memoryIds[i],
                targetId: memoryIds[j],
                similarity,
              });
            }
          }
        }
      }

      return similarities;
    } catch (error) {
      console.error('Error calculating similarities:', error);
      return [];
    }
  }

  /**
   * Fetch embeddings for memories
   */
  private async fetchEmbeddings(memoryIds: string[]): Promise<Record<string, number[]>> {
    try {
      const response = await axios.post(`${this.memoryServiceUrl}/v1/embeddings/batch`, {
        memoryIds,
      });

      return response.data.embeddings || {};
    } catch (error) {
      console.error('Error fetching embeddings:', error);
      return {};
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
