import {
  TacitInput,
  TacitQuery,
  SearchResult,
  TacitStats,
  createLogger,
  validate,
  tacitInputSchema,
  tacitQuerySchema,
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

const logger = createLogger('TacitService');

export class TacitService {
  /**
   * Store tacit knowledge (write coordinator)
   */
  async storeTacit(input: TacitInput): Promise<string> {
    try {
      // Validate input
      const validatedInput = validate(tacitInputSchema, input);

      logger.info('Storing tacit knowledge', {
        agentId: validatedInput.agentId,
        type: validatedInput.type,
      });

      let tacitId: string;

      // Route to appropriate engine based on type
      switch (validatedInput.type) {
        case 'short-term':
          if (!validatedInput.sessionId) {
            throw new Error('sessionId is required for short-term tacit knowledge');
          }
          const stmEngine = getSTMEngine();
          await stmEngine.addToSTM(validatedInput.sessionId, validatedInput.content);
          tacitId = `stm:${validatedInput.sessionId}:${Date.now()}`;
          break;

        case 'episodic':
          const episodicEngine = getEpisodicMemoryEngine();
          tacitId = await episodicEngine.recordEvent({
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
          tacitId = await semanticEngine.storeSemanticMemory(
            validatedInput.agentId,
            validatedInput.content,
            validatedInput.metadata?.source || 'user',
            validatedInput.metadata?.category
          );
          break;

        default:
          throw new Error(`Unsupported tacit knowledge type: ${validatedInput.type}`);
      }

      logger.info('Tacit knowledge stored successfully', {
        tacitId,
        agentId: validatedInput.agentId,
        type: validatedInput.type,
      });

      return tacitId;
    } catch (error) {
      logger.error('Failed to store tacit knowledge', error as Error, {
        agentId: input.agentId,
        type: input.type,
      });
      throw error;
    }
  }

  /**
   * Retrieve tacit knowledge (read coordinator)
   */
  async retrieveTacits(query: TacitQuery): Promise<SearchResult[]> {
    try {
      // Validate query
      const validatedQuery = validate(tacitQuerySchema, query);

      logger.info('Retrieving tacit knowledge', {
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
        // Semantic tacit knowledge would be retrieved here
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

      logger.info('Tacit knowledge retrieved', {
        agentId: validatedQuery.agentId,
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to retrieve tacit knowledge', error as Error, {
        agentId: query.agentId,
      });
      throw error;
    }
  }

  /**
   * Update tacit knowledge
   */
  async updateTacit(id: string, _updates: Partial<TacitInput>): Promise<void> {
    try {
      logger.info('Updating tacit knowledge', { id });

      // Get tacit knowledge type from database
      const prisma = getPrismaClient();
      const tacit = await prisma.memoryIndex.findUnique({
        where: { id },
        select: { memoryType: true },
      });

      if (!tacit) {
        throw new Error(`Tacit knowledge not found: ${id}`);
      }

      // Update based on type
      if (tacit.memoryType === 'semantic') {
        // Semantic updates would go here
        logger.warn('Semantic tacit knowledge updates not yet implemented');
      } else if (tacit.memoryType === 'episodic') {
        // Episodic updates would go here
        logger.warn('Episodic tacit knowledge updates not yet implemented');
      }

      logger.info('Tacit knowledge updated', { id });
    } catch (error) {
      logger.error('Failed to update tacit knowledge', error as Error, { id });
      throw error;
    }
  }

  /**
   * Delete tacit knowledge
   */
  async deleteTacit(id: string): Promise<void> {
    try {
      logger.info('Deleting tacit knowledge', { id });

      // Get tacit knowledge type from database
      const prisma = getPrismaClient();
      const tacit = await prisma.memoryIndex.findUnique({
        where: { id },
        select: { memoryType: true },
      });

      if (!tacit) {
        throw new Error(`Tacit knowledge not found: ${id}`);
      }

      // Delete based on type
      if (tacit.memoryType === 'episodic') {
        const episodicEngine = getEpisodicMemoryEngine();
        await episodicEngine.deleteMemory(id);
      } else if (tacit.memoryType === 'semantic') {
        // Semantic deletion would go here
        await prisma.memoryIndex.delete({ where: { id } });
      }

      logger.info('Tacit knowledge deleted', { id });
    } catch (error) {
      logger.error('Failed to delete tacit knowledge', error as Error, { id });
      throw error;
    }
  }

  /**
   * Get session tacit knowledge
   */
  async getSessionTacits(sessionId: string): Promise<string[]> {
    try {
      const stmEngine = getSTMEngine();
      return await stmEngine.getSTM(sessionId);
    } catch (error) {
      logger.error('Failed to get session tacit knowledge', error as Error, { sessionId });
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
   * Get tacit knowledge statistics
   */
  async getTacitStats(agentId: string): Promise<TacitStats> {
    try {
      const prisma = getPrismaClient();

      const tacits = await prisma.memoryIndex.findMany({
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

      for (const tacit of tacits) {
        byType[tacit.memoryType] = (byType[tacit.memoryType] || 0) + 1;
        if (tacit.importance) {
          totalImportance += tacit.importance.toNumber();
          importanceCount++;
        }
      }

      const dates = tacits.map((m: any) => m.createdAt).sort((a: Date, b: Date) => a.getTime() - b.getTime());

      return {
        totalTacits: tacits.length,
        byType,
        storageSize: 0, // Would need to calculate actual storage
        oldestTacit: dates.length > 0 ? dates[0] : new Date(),
        newestTacit: dates.length > 0 ? dates[dates.length - 1] : new Date(),
        averageImportance: importanceCount > 0 ? totalImportance / importanceCount : 0,
      };
    } catch (error) {
      logger.error('Failed to get tacit knowledge stats', error as Error, { agentId });
      throw error;
    }
  }
}

// Singleton instance
let tacitService: TacitService;

export function getTacitService(): TacitService {
  if (!tacitService) {
    tacitService = new TacitService();
  }
  return tacitService;
}
