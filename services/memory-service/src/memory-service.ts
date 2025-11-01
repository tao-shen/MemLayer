import {
  MemoryInput,
  MemoryQuery,
  SearchResult,
  MemoryStats,
  createLogger,
  validate,
  memoryInputSchema,
  memoryQuerySchema,
} from '@agent-memory/shared';
import { getSTMEngine } from './engines/stm-engine';
import { getEpisodicMemoryEngine } from './engines/episodic-memory-engine';
import { getSemanticMemoryEngine } from './engines/semantic-memory-engine';
import { ReflectionEngine } from '../../reflection-service/src/reflection-engine';

let reflectionEngine: ReflectionEngine | null = null;
function getReflectionEngine(): ReflectionEngine {
  if (!reflectionEngine) {
    reflectionEngine = new ReflectionEngine();
  }
  return reflectionEngine;
}
import { getPrismaClient } from '@agent-memory/database';

const logger = createLogger('MemoryService');

export class MemoryService {
  /**
   * Store memory (write coordinator)
   */
  async storeMemory(input: MemoryInput): Promise<string> {
    try {
      // Validate input
      const validatedInput = validate(memoryInputSchema, input);

      logger.info('Storing memory', {
        agentId: validatedInput.agentId,
        type: validatedInput.type,
      });

      let memoryId: string;

      // Route to appropriate engine based on type
      switch (validatedInput.type) {
        case 'short-term':
          if (!validatedInput.sessionId) {
            throw new Error('sessionId is required for short-term memory');
          }
          const stmEngine = getSTMEngine();
          await stmEngine.addToSTM(validatedInput.sessionId, validatedInput.content);
          memoryId = `stm:${validatedInput.sessionId}:${Date.now()}`;
          break;

        case 'episodic':
          const episodicEngine = getEpisodicMemoryEngine();
          memoryId = await episodicEngine.recordEvent({
            agentId: validatedInput.agentId,
            content: validatedInput.content,
            eventType: validatedInput.eventType || 'observation',
            context: validatedInput.metadata,
          });

          // Check if reflection should be triggered
          if (validatedInput.importance) {
            const reflectionEngine = getReflectionEngine();
            await reflectionEngine.incrementAccumulated(
              validatedInput.agentId,
              validatedInput.importance
            );

            const shouldReflect = await reflectionEngine.shouldReflect(validatedInput.agentId);
            if (shouldReflect) {
              // Trigger reflection asynchronously
              reflectionEngine.triggerReflection(validatedInput.agentId).catch((error) => {
                logger.error('Reflection failed', error);
              });
            }
          }
          break;

        case 'semantic':
          const semanticEngine = getSemanticMemoryEngine();
          memoryId = await semanticEngine.storeSemanticMemory(
            validatedInput.agentId,
            validatedInput.content,
            validatedInput.metadata?.source || 'user',
            validatedInput.metadata?.category
          );
          break;

        default:
          throw new Error(`Unsupported memory type: ${validatedInput.type}`);
      }

      logger.info('Memory stored successfully', {
        memoryId,
        agentId: validatedInput.agentId,
        type: validatedInput.type,
      });

      return memoryId;
    } catch (error) {
      logger.error('Failed to store memory', error as Error, {
        agentId: input.agentId,
        type: input.type,
      });
      throw error;
    }
  }

  /**
   * Retrieve memories (read coordinator)
   */
  async retrieveMemories(query: MemoryQuery): Promise<SearchResult[]> {
    try {
      // Validate query
      const validatedQuery = validate(memoryQuerySchema, query);

      logger.info('Retrieving memories', {
        agentId: validatedQuery.agentId,
        type: validatedQuery.type,
      });

      let results: SearchResult[] = [];

      // Route based on type
      if (!validatedQuery.type || validatedQuery.type === 'episodic') {
        const episodicEngine = getEpisodicMemoryEngine();
        const episodicResults = await episodicEngine.retrieveEpisodes({
          agentId: validatedQuery.agentId,
          timeRange: validatedQuery.timeRange,
          minImportance: validatedQuery.minImportance,
          topK: validatedQuery.limit,
        });

        results.push(
          ...episodicResults.map((r) => ({
            id: r.id,
            content: r.content,
            score: r.compositeScore,
            recencyScore: r.recencyScore,
            importanceScore: r.importance / 10,
            relevanceScore: r.relevanceScore,
            compositeScore: r.compositeScore,
            metadata: {},
            timestamp: r.timestamp,
          }))
        );
      }

      if (!validatedQuery.type || validatedQuery.type === 'semantic') {
        // Semantic memories would be retrieved here
        // For now, we'll skip if no query text is provided
      }

      if (validatedQuery.type === 'short-term' && validatedQuery.sessionId) {
        const stmEngine = getSTMEngine();
        const stmContents = await stmEngine.getSTM(validatedQuery.sessionId);

        results.push(
          ...stmContents.map((content, index) => ({
            id: `stm:${validatedQuery.sessionId}:${index}`,
            content,
            score: 1.0,
            metadata: { position: index },
            timestamp: new Date(),
          }))
        );
      }

      // Apply limit and offset
      const offset = validatedQuery.offset || 0;
      const limit = validatedQuery.limit || 10;
      results = results.slice(offset, offset + limit);

      logger.info('Memories retrieved', {
        agentId: validatedQuery.agentId,
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to retrieve memories', error as Error, {
        agentId: query.agentId,
      });
      throw error;
    }
  }

  /**
   * Update memory
   */
  async updateMemory(id: string, _updates: Partial<MemoryInput>): Promise<void> {
    try {
      logger.info('Updating memory', { id });

      // Get memory type from database
      const prisma = getPrismaClient();
      const memory = await prisma.memoryIndex.findUnique({
        where: { id },
        select: { memoryType: true },
      });

      if (!memory) {
        throw new Error(`Memory not found: ${id}`);
      }

      // Update based on type
      if (memory.memoryType === 'semantic') {
        // Semantic updates would go here
        logger.warn('Semantic memory updates not yet implemented');
      } else if (memory.memoryType === 'episodic') {
        // Episodic updates would go here
        logger.warn('Episodic memory updates not yet implemented');
      }

      logger.info('Memory updated', { id });
    } catch (error) {
      logger.error('Failed to update memory', error as Error, { id });
      throw error;
    }
  }

  /**
   * Delete memory
   */
  async deleteMemory(id: string): Promise<void> {
    try {
      logger.info('Deleting memory', { id });

      // Get memory type from database
      const prisma = getPrismaClient();
      const memory = await prisma.memoryIndex.findUnique({
        where: { id },
        select: { memoryType: true },
      });

      if (!memory) {
        throw new Error(`Memory not found: ${id}`);
      }

      // Delete based on type
      if (memory.memoryType === 'episodic') {
        const episodicEngine = getEpisodicMemoryEngine();
        await episodicEngine.deleteMemory(id);
      } else if (memory.memoryType === 'semantic') {
        // Semantic deletion would go here
        await prisma.memoryIndex.delete({ where: { id } });
      }

      logger.info('Memory deleted', { id });
    } catch (error) {
      logger.error('Failed to delete memory', error as Error, { id });
      throw error;
    }
  }

  /**
   * Get session memories
   */
  async getSessionMemories(sessionId: string): Promise<string[]> {
    try {
      const stmEngine = getSTMEngine();
      return await stmEngine.getSTM(sessionId);
    } catch (error) {
      logger.error('Failed to get session memories', error as Error, { sessionId });
      throw error;
    }
  }

  /**
   * Create session
   */
  async createSession(agentId: string, metadata?: Record<string, any>): Promise<string> {
    try {
      const prisma = getPrismaClient();
      const session = await prisma.session.create({
        data: {
          agentId,
          metadata: metadata || {},
        },
      });

      logger.info('Session created', { sessionId: session.id, agentId });
      return session.id;
    } catch (error) {
      logger.error('Failed to create session', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const prisma = getPrismaClient();
      await prisma.session.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });

      // Clear STM
      const stmEngine = getSTMEngine();
      await stmEngine.clearSTM(sessionId);

      logger.info('Session ended', { sessionId });
    } catch (error) {
      logger.error('Failed to end session', error as Error, { sessionId });
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(agentId: string): Promise<MemoryStats> {
    try {
      const prisma = getPrismaClient();

      const memories = await prisma.memoryIndex.findMany({
        where: { agentId },
        select: {
          memoryType: true,
          importance: true,
          createdAt: true,
        },
      });

      const byType: Record<string, number> = {};
      let totalImportance = 0;
      let importanceCount = 0;

      for (const memory of memories) {
        byType[memory.memoryType] = (byType[memory.memoryType] || 0) + 1;
        if (memory.importance) {
          totalImportance += memory.importance.toNumber();
          importanceCount++;
        }
      }

      const dates = memories.map((m: any) => m.createdAt).sort((a: Date, b: Date) => a.getTime() - b.getTime());

      return {
        totalMemories: memories.length,
        byType,
        storageSize: 0, // Would need to calculate actual storage
        oldestMemory: dates.length > 0 ? dates[0] : new Date(),
        newestMemory: dates.length > 0 ? dates[dates.length - 1] : new Date(),
        averageImportance: importanceCount > 0 ? totalImportance / importanceCount : 0,
      };
    } catch (error) {
      logger.error('Failed to get memory stats', error as Error, { agentId });
      throw error;
    }
  }
}

// Singleton instance
let memoryService: MemoryService;

export function getMemoryService(): MemoryService {
  if (!memoryService) {
    memoryService = new MemoryService();
  }
  return memoryService;
}
