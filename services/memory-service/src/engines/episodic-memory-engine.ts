import {
  EpisodicMemoryRecord,
  EventType,
  createLogger,
  EpisodicQuery,
  EpisodicMemory,
  EpisodicEvent,
} from '@agent-memory/shared';
import * as vectorDb from '@agent-memory/vector-db';
import { getPrismaClient } from '@agent-memory/database';
import { getEmbeddingClient } from '../../../embedding-service/src/client';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('EpisodicMemoryEngine');

export class EpisodicMemoryEngine {
  /**
   * Record an episodic event
   */
  async recordEvent(event: EpisodicEvent): Promise<string> {
    try {
      const id = uuidv4();
      const timestamp = event.timestamp || new Date();

      // Calculate importance score
      const importance = await this.calculateImportance(event);

      // Generate embedding
      const embeddingClient = getEmbeddingClient();
      const embedding = await embeddingClient.generateEmbedding(event.content);

      // Store in vector database
      await vectorDb.upsertVector({
        collection: vectorDb.COLLECTIONS.EPISODIC_MEMORIES,
        id,
        vector: embedding,
        payload: {
          agent_id: event.agentId,
          content: event.content,
          event_type: event.eventType,
          importance,
          timestamp: timestamp.toISOString(),
          context: event.context || {},
        },
      });

      // Store metadata in PostgreSQL
      const prisma = getPrismaClient();
      await prisma.memoryIndex.create({
        data: {
          id,
          agentId: event.agentId,
          memoryType: 'episodic',
          storageLocation: `qdrant:${vectorDb.COLLECTIONS.EPISODIC_MEMORIES}:${id}`,
          importance,
          metadata: {
            eventType: event.eventType,
            context: event.context || {},
          },
        },
      });

      logger.info('Recorded episodic event', {
        id,
        agentId: event.agentId,
        eventType: event.eventType,
        importance,
      });

      return id;
    } catch (error) {
      logger.error('Failed to record episodic event', error as Error, {
        agentId: event.agentId,
      });
      throw error;
    }
  }

  /**
   * Calculate importance score for an event (1-10)
   */
  async calculateImportance(event: EpisodicEvent): Promise<number> {
    try {
      // Simple heuristic-based scoring for now
      // In production, this would call an LLM API
      let score = 5; // Base score

      // Event type weights
      const eventTypeWeights: Record<EventType, number> = {
        observation: 0,
        action: 1,
        interaction: 2,
      };
      score += eventTypeWeights[event.eventType] || 0;

      // Content length factor (longer content might be more important)
      if (event.content.length > 500) score += 1;
      if (event.content.length > 1000) score += 1;

      // Context factors
      if (event.context?.priority === 'high') score += 2;
      if (event.context?.priority === 'critical') score += 3;

      // Clamp to 1-10 range
      score = Math.max(1, Math.min(10, score));

      logger.debug('Calculated importance score', {
        agentId: event.agentId,
        eventType: event.eventType,
        score,
      });

      return score;
    } catch (error) {
      logger.error('Failed to calculate importance', error as Error);
      return 5; // Default score on error
    }
  }

  /**
   * Retrieve episodic memories using three-component model
   */
  async retrieveEpisodes(query: EpisodicQuery): Promise<EpisodicMemory[]> {
    try {
      const {
        agentId,
        queryText,
        timeRange,
        minImportance,
        topK = 10,
        weights = { recency: 0.33, importance: 0.33, relevance: 0.34 },
      } = query;

      // Generate query embedding if text provided
      let queryEmbedding: number[] | undefined;
      if (queryText) {
        const embeddingClient = getEmbeddingClient();
        queryEmbedding = await embeddingClient.generateEmbedding(queryText);
      }

      // Build filter
      const filter: any = {
        must: [{ key: 'agent_id', match: { value: agentId } }],
      };

      if (minImportance) {
        filter.must.push({
          key: 'importance',
          range: { gte: minImportance },
        });
      }

      if (timeRange) {
        filter.must.push({
          key: 'timestamp',
          range: {
            gte: timeRange.start.toISOString(),
            lte: timeRange.end.toISOString(),
          },
        });
      }

      // Retrieve from vector database
      const results = queryEmbedding
        ? await vectorDb.vectorSearch({
            collection: vectorDb.COLLECTIONS.EPISODIC_MEMORIES,
            vector: queryEmbedding,
            limit: topK * 2, // Get more for re-ranking
            filter,
          })
        : await this.getAllEpisodes(agentId, topK * 2, filter);

      // Calculate composite scores
      const now = Date.now();
      const scoredMemories = results.map((result) => {
        const timestamp = new Date(result.payload.timestamp as string);
        const importance = result.payload.importance as number;

        // Recency score (exponential decay)
        const ageInDays = (now - timestamp.getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.exp(-ageInDays / 30); // 30-day half-life

        // Importance score (normalized to 0-1)
        const importanceScore = importance / 10;

        // Relevance score (from vector similarity, already 0-1)
        const relevanceScore = result.score;

        // Composite score
        const compositeScore =
          weights.recency * recencyScore +
          weights.importance * importanceScore +
          weights.relevance * relevanceScore;

        return {
          id: result.id,
          content: result.payload.content as string,
          importance,
          timestamp,
          recencyScore,
          relevanceScore,
          compositeScore,
        };
      });

      // Sort by composite score and take top K
      scoredMemories.sort((a, b) => b.compositeScore - a.compositeScore);
      const topMemories = scoredMemories.slice(0, topK);

      logger.info('Retrieved episodic memories', {
        agentId,
        queryProvided: !!queryText,
        retrieved: topMemories.length,
      });

      return topMemories;
    } catch (error) {
      logger.error('Failed to retrieve episodic memories', error as Error, {
        agentId: query.agentId,
      });
      throw error;
    }
  }

  /**
   * Get all episodes for an agent (without vector search)
   */
  private async getAllEpisodes(
    agentId: string,
    limit: number,
    filter: any
  ): Promise<vectorDb.VectorSearchResult[]> {
    // This is a simplified version - in production, you'd use scroll/pagination
    const prisma = getPrismaClient();
    const memories = await prisma.memoryIndex.findMany({
      where: {
        agentId,
        memoryType: 'episodic',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Fetch from vector DB
    const results: vectorDb.VectorSearchResult[] = [];
    for (const memory of memories) {
      const id = memory.storageLocation.split(':').pop();
      if (id) {
        try {
          const client = vectorDb.getQdrantClient();
          const points = await client.retrieve(vectorDb.COLLECTIONS.EPISODIC_MEMORIES, {
            ids: [id],
            with_payload: true,
          });
          if (points.length > 0) {
            results.push({
              id: points[0].id.toString(),
              score: 1.0, // No relevance score without query
              payload: points[0].payload as Record<string, any>,
            });
          }
        } catch (error) {
          logger.warn('Failed to retrieve memory from vector DB', { id });
        }
      }
    }

    return results;
  }

  /**
   * Update memory access tracking
   */
  async trackAccess(memoryId: string): Promise<void> {
    try {
      const prisma = getPrismaClient();
      await prisma.memoryIndex.update({
        where: { id: memoryId },
        data: {
          accessedAt: new Date(),
          accessCount: {
            increment: 1,
          },
        },
      });

      logger.debug('Tracked memory access', { memoryId });
    } catch (error) {
      logger.error('Failed to track memory access', error as Error, { memoryId });
    }
  }

  /**
   * Delete episodic memory
   */
  async deleteMemory(memoryId: string): Promise<void> {
    try {
      // Delete from vector database
      await vectorDb.deleteVector(vectorDb.COLLECTIONS.EPISODIC_MEMORIES, memoryId);

      // Delete from PostgreSQL
      const prisma = getPrismaClient();
      await prisma.memoryIndex.delete({
        where: { id: memoryId },
      });

      logger.info('Deleted episodic memory', { memoryId });
    } catch (error) {
      logger.error('Failed to delete episodic memory', error as Error, { memoryId });
      throw error;
    }
  }

  /**
   * Get memory statistics for an agent
   */
  async getStats(agentId: string): Promise<{
    totalMemories: number;
    byEventType: Record<string, number>;
    averageImportance: number;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  }> {
    try {
      const prisma = getPrismaClient();
      const memories = await prisma.memoryIndex.findMany({
        where: {
          agentId,
          memoryType: 'episodic',
        },
        select: {
          importance: true,
          createdAt: true,
          metadata: true,
        },
      });

      const byEventType: Record<string, number> = {};
      let totalImportance = 0;

      for (const memory of memories) {
        const eventType = (memory.metadata as any)?.eventType || 'unknown';
        byEventType[eventType] = (byEventType[eventType] || 0) + 1;
        totalImportance += memory.importance?.toNumber() || 0;
      }

      const dates = memories.map((m) => m.createdAt).sort((a, b) => a.getTime() - b.getTime());

      return {
        totalMemories: memories.length,
        byEventType,
        averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
        oldestMemory: dates.length > 0 ? dates[0] : null,
        newestMemory: dates.length > 0 ? dates[dates.length - 1] : null,
      };
    } catch (error) {
      logger.error('Failed to get episodic memory stats', error as Error, { agentId });
      throw error;
    }
  }
}

// Singleton instance
let episodicMemoryEngine: EpisodicMemoryEngine;

export function getEpisodicMemoryEngine(): EpisodicMemoryEngine {
  if (!episodicMemoryEngine) {
    episodicMemoryEngine = new EpisodicMemoryEngine();
  }
  return episodicMemoryEngine;
}
