import {
  FilterRule,
  ForgettingPolicy,
  MemoryStats,
  createLogger,
} from '@agent-memory/shared';
import { getPrismaClient } from '@agent-memory/database';
import * as vectorDb from '@agent-memory/vector-db';
import OpenAI from 'openai';
import * as cron from 'node-cron';

const logger = createLogger('ManagementService');

export class ManagementService {
  private openai: OpenAI;
  private forgettingScheduler?: cron.ScheduledTask;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Set filter rules for an agent
   */
  async setFilterRules(agentId: string, rules: FilterRule[]): Promise<void> {
    try {
      const prisma = getPrismaClient();

      await prisma.agent.update({
        where: { id: agentId },
        data: {
          config: {
            filterRules: rules,
          },
        },
      });

      logger.info('Filter rules updated', { agentId, ruleCount: rules.length });
    } catch (error) {
      logger.error('Failed to set filter rules', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Apply filter rules to memory input
   */
  async applyFilters(agentId: string, content: string, metadata: any): Promise<boolean> {
    try {
      const prisma = getPrismaClient();
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { config: true },
      });

      const config = agent?.config as any;
      const rules: FilterRule[] = config?.filterRules || [];

      for (const rule of rules) {
        let shouldFilter = false;

        switch (rule.type) {
          case 'content':
            shouldFilter = this.evaluateContentFilter(content, rule.condition);
            break;
          case 'metadata':
            shouldFilter = this.evaluateMetadataFilter(metadata, rule.condition);
            break;
          case 'importance':
            shouldFilter = this.evaluateImportanceFilter(metadata?.importance, rule.condition);
            break;
        }

        if (shouldFilter) {
          if (rule.action === 'reject') {
            logger.debug('Memory rejected by filter', { agentId, rule: rule.type });
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to apply filters', error as Error, { agentId });
      return true; // Default to accept on error
    }
  }

  private evaluateContentFilter(content: string, condition: string): boolean {
    // Simple keyword matching
    return content.toLowerCase().includes(condition.toLowerCase());
  }

  private evaluateMetadataFilter(metadata: any, condition: string): boolean {
    // Simple key existence check
    return metadata && metadata[condition] !== undefined;
  }

  private evaluateImportanceFilter(importance: number | undefined, condition: string): boolean {
    if (!importance) return false;
    const [operator, value] = condition.split(' ');
    const threshold = parseFloat(value);

    switch (operator) {
      case '>':
        return importance > threshold;
      case '<':
        return importance < threshold;
      case '>=':
        return importance >= threshold;
      case '<=':
        return importance <= threshold;
      case '==':
        return importance === threshold;
      default:
        return false;
    }
  }

  /**
   * Set forgetting policy for an agent
   */
  async setForgettingPolicy(agentId: string, policy: ForgettingPolicy): Promise<void> {
    try {
      const prisma = getPrismaClient();

      await prisma.agent.update({
        where: { id: agentId },
        data: {
          config: {
            forgettingPolicy: policy,
          },
        },
      });

      logger.info('Forgetting policy updated', { agentId, enabled: policy.enabled });

      // Start scheduler if enabled
      if (policy.enabled && !this.forgettingScheduler) {
        this.startForgettingScheduler();
      }
    } catch (error) {
      logger.error('Failed to set forgetting policy', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Start forgetting scheduler
   */
  private startForgettingScheduler(): void {
    // Run every day at 2 AM
    this.forgettingScheduler = cron.schedule('0 2 * * *', async () => {
      logger.info('Running forgetting scheduler');
      try {
        await this.runForgettingProcess();
      } catch (error) {
        logger.error('Forgetting scheduler failed', error as Error);
      }
    });

    logger.info('Forgetting scheduler started');
  }

  /**
   * Run forgetting process for all agents
   */
  private async runForgettingProcess(): Promise<void> {
    const prisma = getPrismaClient();

    const agents = await prisma.agent.findMany({
      select: { id: true, config: true },
    });

    for (const agent of agents) {
      const config = agent.config as any;
      const policy: ForgettingPolicy = config?.forgettingPolicy;

      if (policy?.enabled) {
        await this.forgetMemories(agent.id, policy);
      }
    }
  }

  /**
   * Forget memories based on policy
   */
  private async forgetMemories(agentId: string, policy: ForgettingPolicy): Promise<number> {
    try {
      const prisma = getPrismaClient();
      let forgottenCount = 0;

      // Get memories to forget based on strategy
      let memoriesToForget: any[] = [];

      switch (policy.strategy) {
        case 'time-based':
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - policy.threshold);

          memoriesToForget = await prisma.memoryIndex.findMany({
            where: {
              agentId,
              createdAt: { lt: cutoffDate },
            },
          });
          break;

        case 'access-based':
          const accessCutoffDate = new Date();
          accessCutoffDate.setDate(accessCutoffDate.getDate() - policy.threshold);

          memoriesToForget = await prisma.memoryIndex.findMany({
            where: {
              agentId,
              OR: [
                { accessedAt: { lt: accessCutoffDate } },
                { accessedAt: null, createdAt: { lt: accessCutoffDate } },
              ],
            },
          });
          break;

        case 'importance-based':
          memoriesToForget = await prisma.memoryIndex.findMany({
            where: {
              agentId,
              importance: { lt: policy.threshold },
            },
          });
          break;
      }

      // Archive or delete
      for (const memory of memoriesToForget) {
        if (policy.archiveBeforeDelete) {
          // Archive logic would go here
          logger.debug('Archiving memory', { id: memory.id });
        }

        // Delete from vector database
        const collection = memory.memoryType === 'episodic'
          ? vectorDb.COLLECTIONS.EPISODIC_MEMORIES
          : vectorDb.COLLECTIONS.SEMANTIC_MEMORIES;

        const vectorId = memory.storageLocation.split(':').pop();
        if (vectorId) {
          await vectorDb.deleteVector(collection, vectorId);
        }

        // Delete from PostgreSQL
        await prisma.memoryIndex.delete({ where: { id: memory.id } });

        forgottenCount++;
      }

      logger.info('Memories forgotten', { agentId, count: forgottenCount });
      return forgottenCount;
    } catch (error) {
      logger.error('Failed to forget memories', error as Error, { agentId });
      return 0;
    }
  }

  /**
   * Consolidate memories (summarize and compress)
   */
  async consolidateMemories(
    agentId: string,
    options?: {
      timeRange?: { start: Date; end: Date };
      summarizationLevel?: 'low' | 'medium' | 'high';
    }
  ): Promise<{ originalCount: number; consolidatedCount: number; summary: string }> {
    try {
      const prisma = getPrismaClient();

      // Get memories to consolidate
      const where: any = {
        agentId,
        memoryType: 'episodic',
      };

      if (options?.timeRange) {
        where.createdAt = {
          gte: options.timeRange.start,
          lte: options.timeRange.end,
        };
      }

      const memories = await prisma.memoryIndex.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      if (memories.length === 0) {
        return { originalCount: 0, consolidatedCount: 0, summary: '' };
      }

      // Fetch content from vector database
      const contents: string[] = [];
      for (const memory of memories) {
        try {
          const vectorId = memory.storageLocation.split(':').pop();
          if (vectorId) {
            const client = vectorDb.getQdrantClient();
            const points = await client.retrieve(vectorDb.COLLECTIONS.EPISODIC_MEMORIES, {
              ids: [vectorId],
              with_payload: true,
            });

            if (points.length > 0) {
              contents.push(points[0].payload?.content as string);
            }
          }
        } catch (error) {
          logger.warn('Failed to retrieve memory for consolidation', { id: memory.id });
        }
      }

      // Generate summary using LLM
      const summary = await this.generateSummary(contents, options?.summarizationLevel || 'medium');

      logger.info('Memories consolidated', {
        agentId,
        originalCount: memories.length,
        summaryLength: summary.length,
      });

      return {
        originalCount: memories.length,
        consolidatedCount: 1,
        summary,
      };
    } catch (error) {
      logger.error('Failed to consolidate memories', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Generate summary using LLM
   */
  private async generateSummary(contents: string[], level: 'low' | 'medium' | 'high'): Promise<string> {
    try {
      const maxTokens = level === 'low' ? 100 : level === 'medium' ? 250 : 500;

      const prompt = `Summarize the following memories into a concise overview. Focus on key events, patterns, and important information.

Memories:
${contents.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Provide a ${level}-detail summary:`;

      const response = await this.openai.chat.completions.create({
        model: process.env.LLM_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that summarizes memories concisely.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
      });

      return response.choices[0].message.content || 'Summary generation failed.';
    } catch (error) {
      logger.error('Failed to generate summary', error as Error);
      return 'Summary generation failed.';
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

      const dates = memories.map((m) => m.createdAt).sort((a, b) => a.getTime() - b.getTime());

      return {
        totalMemories: memories.length,
        byType,
        storageSize: 0,
        oldestMemory: dates.length > 0 ? dates[0] : new Date(),
        newestMemory: dates.length > 0 ? dates[dates.length - 1] : new Date(),
        averageImportance: importanceCount > 0 ? totalImportance / importanceCount : 0,
      };
    } catch (error) {
      logger.error('Failed to get memory stats', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Export memories
   */
  async exportMemories(agentId: string, format: 'json' | 'csv'): Promise<Buffer> {
    try {
      const prisma = getPrismaClient();

      const memories = await prisma.memoryIndex.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
      });

      if (format === 'json') {
        const json = JSON.stringify(memories, null, 2);
        return Buffer.from(json);
      } else {
        // CSV format
        const headers = 'id,type,importance,created_at\n';
        const rows = memories
          .map((m) => `${m.id},${m.memoryType},${m.importance},${m.createdAt.toISOString()}`)
          .join('\n');
        return Buffer.from(headers + rows);
      }
    } catch (error) {
      logger.error('Failed to export memories', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Purge all memories for an agent
   */
  async purgeMemories(agentId: string): Promise<number> {
    try {
      const prisma = getPrismaClient();

      const memories = await prisma.memoryIndex.findMany({
        where: { agentId },
      });

      let deletedCount = 0;

      for (const memory of memories) {
        try {
          const collection =
            memory.memoryType === 'episodic'
              ? vectorDb.COLLECTIONS.EPISODIC_MEMORIES
              : memory.memoryType === 'semantic'
              ? vectorDb.COLLECTIONS.SEMANTIC_MEMORIES
              : vectorDb.COLLECTIONS.REFLECTIONS;

          const vectorId = memory.storageLocation.split(':').pop();
          if (vectorId) {
            await vectorDb.deleteVector(collection, vectorId);
          }

          await prisma.memoryIndex.delete({ where: { id: memory.id } });
          deletedCount++;
        } catch (error) {
          logger.warn('Failed to delete memory during purge', { id: memory.id });
        }
      }

      logger.info('Memories purged', { agentId, count: deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Failed to purge memories', error as Error, { agentId });
      throw error;
    }
  }
}

// Singleton instance
let managementService: ManagementService;

export function getManagementService(): ManagementService {
  if (!managementService) {
    managementService = new ManagementService();
  }
  return managementService;
}
