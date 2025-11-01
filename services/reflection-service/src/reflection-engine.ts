import {
  Reflection,
  ReflectionContext,
  createLogger,
} from '@agent-memory/shared';
import { getPrismaClient } from '@agent-memory/database';
import * as vectorDb from '@agent-memory/vector-db';
import * as cache from '@agent-memory/cache';
import OpenAI from 'openai';
import { getEmbeddingClient } from '@agent-memory/shared';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('ReflectionEngine');

export class ReflectionEngine {
  private openai: OpenAI;
  private defaultThreshold: number;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
    });
    this.defaultThreshold = parseInt(process.env.REFLECTION_IMPORTANCE_THRESHOLD || '50');
  }

  /**
   * Check if reflection should be triggered
   */
  async shouldReflect(agentId: string): Promise<boolean> {
    try {
      // Get accumulated importance since last reflection
      const accumulated = await this.getAccumulatedImportance(agentId);
      const threshold = await this.getThreshold(agentId);

      const should = accumulated >= threshold;

      logger.debug('Reflection check', {
        agentId,
        accumulated,
        threshold,
        shouldReflect: should,
      });

      return should;
    } catch (error) {
      logger.error('Failed to check reflection trigger', error as Error, { agentId });
      return false;
    }
  }

  /**
   * Get accumulated importance since last reflection
   */
  private async getAccumulatedImportance(agentId: string): Promise<number> {
    const key = `reflection:accumulated:${agentId}`;
    const accumulated = await cache.get<number>(key);
    return accumulated || 0;
  }

  /**
   * Increment accumulated importance
   */
  async incrementAccumulated(agentId: string, importance: number): Promise<void> {
    const key = `reflection:accumulated:${agentId}`;
    await cache.incrby(key, Math.round(importance));
  }

  /**
   * Reset accumulated importance
   */
  private async resetAccumulated(agentId: string): Promise<void> {
    const key = `reflection:accumulated:${agentId}`;
    await cache.set(key, 0);
  }

  /**
   * Get reflection threshold for agent
   */
  private async getThreshold(agentId: string): Promise<number> {
    try {
      const prisma = getPrismaClient();
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { config: true },
      });

      const config = agent?.config as any;
      return config?.reflectionThreshold || this.defaultThreshold;
    } catch (error) {
      return this.defaultThreshold;
    }
  }

  /**
   * Trigger reflection process
   */
  async triggerReflection(agentId: string, context?: ReflectionContext): Promise<Reflection> {
    try {
      logger.info('Triggering reflection', { agentId });

      // Step 1: Retrieve recent memories
      const memories = await this.retrieveRecentMemories(agentId, context);

      if (memories.length === 0) {
        throw new Error('No memories found for reflection');
      }

      // Step 2: Generate insights using LLM
      const insights = await this.generateInsights(memories);

      // Step 3: Store reflection
      const reflection = await this.storeReflection(agentId, insights, memories);

      // Step 4: Reset accumulated importance
      await this.resetAccumulated(agentId);

      logger.info('Reflection completed', {
        agentId,
        insightCount: insights.length,
        sourceMemoryCount: memories.length,
      });

      return reflection;
    } catch (error) {
      logger.error('Reflection failed', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Retrieve recent memories for reflection
   */
  private async retrieveRecentMemories(
    agentId: string,
    context?: ReflectionContext
  ): Promise<Array<{ id: string; content: string; importance: number }>> {
    try {
      const prisma = getPrismaClient();

      // Build query conditions
      const where: any = {
        agentId,
        memoryType: 'episodic',
      };

      if (context?.timeRange) {
        where.createdAt = {
          gte: context.timeRange.start,
          lte: context.timeRange.end,
        };
      }

      if (context?.importanceThreshold) {
        where.importance = {
          gte: context.importanceThreshold,
        };
      }

      // Query memories
      const memoryIndices = await prisma.memoryIndex.findMany({
        where,
        orderBy: {
          importance: 'desc',
        },
        take: context?.maxMemories || 20,
        select: {
          id: true,
          importance: true,
          storageLocation: true,
        },
      });

      // Fetch content from vector database
      const memories: Array<{ id: string; content: string; importance: number }> = [];

      for (const index of memoryIndices) {
        try {
          const vectorId = index.storageLocation.split(':').pop();
          if (vectorId) {
            const client = vectorDb.getQdrantClient();
            const points = await client.retrieve(vectorDb.COLLECTIONS.EPISODIC_MEMORIES, {
              ids: [vectorId],
              with_payload: true,
            });

            if (points.length > 0) {
              memories.push({
                id: index.id,
                content: points[0].payload?.content as string,
                importance: index.importance?.toNumber() || 5,
              });
            }
          }
        } catch (error) {
          logger.warn('Failed to retrieve memory content', { id: index.id });
        }
      }

      return memories;
    } catch (error) {
      logger.error('Failed to retrieve memories for reflection', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Generate insights from memories using LLM
   */
  private async generateInsights(
    memories: Array<{ id: string; content: string; importance: number }>
  ): Promise<string[]> {
    try {
      // Build prompt
      const memoryTexts = memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');

      const prompt = `Based on the following observations and experiences, generate 3-5 high-level insights or patterns. Focus on identifying:
- Recurring themes or patterns
- Important relationships or connections
- Key learnings or conclusions
- Behavioral patterns or preferences

Observations:
${memoryTexts}

Please provide insights as a numbered list, with each insight being a concise statement (1-2 sentences).`;

      // Call LLM
      const response = await this.openai.chat.completions.create({
        model: process.env.LLM_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that helps analyze memories and generate meaningful insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || '';

      // Parse insights from response
      const insights = content
        .split('\n')
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((insight) => insight.length > 0);

      logger.debug('Generated insights', { count: insights.length });

      return insights;
    } catch (error) {
      logger.error('Failed to generate insights', error as Error);
      // Return fallback insights
      return ['Accumulated significant experiences requiring further analysis.'];
    }
  }

  /**
   * Store reflection in database
   */
  private async storeReflection(
    agentId: string,
    insights: string[],
    sourceMemories: Array<{ id: string; content: string; importance: number }>
  ): Promise<Reflection> {
    try {
      const id = uuidv4();
      const timestamp = new Date();

      // Generate embedding for insights
      const embeddingClient = getEmbeddingClient();
      const insightsText = insights.join(' ');
      const embedding = await embeddingClient.generateEmbedding(insightsText);

      // Store in vector database
      await vectorDb.upsertVector({
        collection: vectorDb.COLLECTIONS.REFLECTIONS,
        id,
        vector: embedding,
        payload: {
          agent_id: agentId,
          insights,
          source_memory_ids: sourceMemories.map((m) => m.id),
          importance: 8, // Reflections are high importance
          timestamp: timestamp.toISOString(),
        },
      });

      // Store metadata in PostgreSQL
      const prisma = getPrismaClient();
      await prisma.memoryIndex.create({
        data: {
          id,
          agentId,
          memoryType: 'reflection',
          storageLocation: `qdrant:${vectorDb.COLLECTIONS.REFLECTIONS}:${id}`,
          importance: 8,
          metadata: {
            insightCount: insights.length,
            sourceMemoryCount: sourceMemories.length,
          },
        },
      });

      logger.info('Stored reflection', { id, agentId, insightCount: insights.length });

      return {
        id,
        agentId,
        insights,
        sourceMemories: sourceMemories.map((m) => m.id),
        importance: 8,
        timestamp,
      };
    } catch (error) {
      logger.error('Failed to store reflection', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Get reflection history for an agent
   */
  async getReflections(agentId: string, limit: number = 10): Promise<Reflection[]> {
    try {
      const prisma = getPrismaClient();

      const reflectionIndices = await prisma.memoryIndex.findMany({
        where: {
          agentId,
          memoryType: 'reflection',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      const reflections: Reflection[] = [];

      for (const index of reflectionIndices) {
        try {
          const vectorId = index.storageLocation.split(':').pop();
          if (vectorId) {
            const client = vectorDb.getQdrantClient();
            const points = await client.retrieve(vectorDb.COLLECTIONS.REFLECTIONS, {
              ids: [vectorId],
              with_payload: true,
            });

            if (points.length > 0) {
              const payload = points[0].payload as any;
              reflections.push({
                id: index.id,
                agentId,
                insights: payload.insights,
                sourceMemories: payload.source_memory_ids,
                importance: payload.importance,
                timestamp: new Date(payload.timestamp),
              });
            }
          }
        } catch (error) {
          logger.warn('Failed to retrieve reflection', { id: index.id });
        }
      }

      return reflections;
    } catch (error) {
      logger.error('Failed to get reflections', error as Error, { agentId });
      throw error;
    }
  }
}

// Singleton instance
let reflectionEngine: ReflectionEngine;

export function getReflectionEngine(): ReflectionEngine {
  if (!reflectionEngine) {
    reflectionEngine = new ReflectionEngine();
  }
  return reflectionEngine;
}
