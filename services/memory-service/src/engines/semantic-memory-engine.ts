import {
  Entity,
  Relation,
  Fact,
  KnowledgeQuery,
  KnowledgeResult,
  GraphPath,
  createLogger,
} from '@agent-memory/shared';
import * as kg from '@agent-memory/knowledge-graph';
import * as vectorDb from '@agent-memory/vector-db';
import { getPrismaClient } from '@agent-memory/database';
import { getEmbeddingClient } from '@agent-memory/shared';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('SemanticMemoryEngine');

export class SemanticMemoryEngine {
  /**
   * Create entity in knowledge graph
   */
  async createEntity(entity: Entity): Promise<string> {
    try {
      const id = await kg.createEntity(entity);

      logger.info('Created entity', { id, type: entity.type });
      return id;
    } catch (error) {
      logger.error('Failed to create entity', error as Error, { type: entity.type });
      throw error;
    }
  }

  /**
   * Get entity by ID
   */
  async getEntity(id: string): Promise<Entity | null> {
    try {
      return await kg.getEntity(id);
    } catch (error) {
      logger.error('Failed to get entity', error as Error, { id });
      throw error;
    }
  }

  /**
   * Update entity
   */
  async updateEntity(id: string, properties: Record<string, any>): Promise<void> {
    try {
      await kg.updateEntity(id, properties);
      logger.info('Updated entity', { id });
    } catch (error) {
      logger.error('Failed to update entity', error as Error, { id });
      throw error;
    }
  }

  /**
   * Delete entity
   */
  async deleteEntity(id: string): Promise<void> {
    try {
      await kg.deleteEntity(id);
      logger.info('Deleted entity', { id });
    } catch (error) {
      logger.error('Failed to delete entity', error as Error, { id });
      throw error;
    }
  }

  /**
   * Create relation between entities
   */
  async createRelation(relation: Relation): Promise<void> {
    try {
      await kg.createRelation(relation);
      logger.info('Created relation', {
        from: relation.from,
        to: relation.to,
        type: relation.type,
      });
    } catch (error) {
      logger.error('Failed to create relation', error as Error, {
        from: relation.from,
        to: relation.to,
      });
      throw error;
    }
  }

  /**
   * Delete relation
   */
  async deleteRelation(from: string, to: string, type: string): Promise<void> {
    try {
      await kg.deleteRelation(from, to, type);
      logger.info('Deleted relation', { from, to, type });
    } catch (error) {
      logger.error('Failed to delete relation', error as Error, { from, to, type });
      throw error;
    }
  }

  /**
   * Store fact (triple) in knowledge graph
   */
  async storeFact(fact: Fact): Promise<void> {
    try {
      await kg.storeFact(fact);
      logger.info('Stored fact', {
        subject: fact.subject,
        predicate: fact.predicate,
        object: fact.object,
      });
    } catch (error) {
      logger.error('Failed to store fact', error as Error, {
        subject: fact.subject,
        predicate: fact.predicate,
      });
      throw error;
    }
  }

  /**
   * Store semantic memory with vector embedding
   */
  async storeSemanticMemory(
    agentId: string,
    content: string,
    source: string,
    category?: string
  ): Promise<string> {
    try {
      const id = uuidv4();

      // Generate embedding
      const embeddingClient = getEmbeddingClient();
      const embedding = await embeddingClient.generateEmbedding(content);

      // Store in vector database
      await vectorDb.upsertVector({
        collection: vectorDb.COLLECTIONS.SEMANTIC_MEMORIES,
        id,
        vector: embedding,
        payload: {
          agent_id: agentId,
          content,
          source,
          category: category || 'general',
          verified: false,
          created_at: new Date().toISOString(),
        },
      });

      // Store metadata in PostgreSQL
      const prisma = getPrismaClient();
      await prisma.memoryIndex.create({
        data: {
          id,
          agentId,
          memoryType: 'semantic',
          storageLocation: `qdrant:${vectorDb.COLLECTIONS.SEMANTIC_MEMORIES}:${id}`,
          metadata: {
            source,
            category: category || 'general',
            verified: false,
          },
        },
      });

      logger.info('Stored semantic memory', { id, agentId, source, category });
      return id;
    } catch (error) {
      logger.error('Failed to store semantic memory', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Query knowledge graph
   */
  async queryKnowledge(query: KnowledgeQuery): Promise<KnowledgeResult> {
    try {
      const results = await kg.queryKnowledge(query);

      // Parse results into structured format
      const entities: Entity[] = [];
      const relations: Relation[] = [];
      const facts: Fact[] = [];

      for (const result of results) {
        if (result.s) {
          entities.push({
            id: result.s.properties.id,
            type: result.s.properties.type,
            properties: result.s.properties,
          });
        }
        if (result.o) {
          entities.push({
            id: result.o.properties.id,
            type: result.o.properties.type,
            properties: result.o.properties,
          });
        }
        if (result.r) {
          relations.push({
            from: result.s?.properties.id,
            to: result.o?.properties.id,
            type: result.r.type,
            properties: result.r.properties,
          });
        }
      }

      logger.info('Queried knowledge', {
        entityId: query.entityId,
        resultCount: results.length,
      });

      return { entities, relations, facts };
    } catch (error) {
      logger.error('Failed to query knowledge', error as Error);
      throw error;
    }
  }

  /**
   * Traverse knowledge graph
   */
  async traverseGraph(startNodeId: string, depth: number): Promise<GraphPath[]> {
    try {
      const paths = await kg.traverseGraph(startNodeId, depth);
      logger.info('Traversed graph', { startNodeId, depth, pathCount: paths.length });
      return paths;
    } catch (error) {
      logger.error('Failed to traverse graph', error as Error, { startNodeId, depth });
      throw error;
    }
  }

  /**
   * Search semantic memories by vector similarity
   */
  async searchSemanticMemories(
    agentId: string,
    queryText: string,
    topK: number = 10,
    category?: string
  ): Promise<Array<{ id: string; content: string; score: number; source: string }>> {
    try {
      // Generate query embedding
      const embeddingClient = getEmbeddingClient();
      const queryEmbedding = await embeddingClient.generateEmbedding(queryText);

      // Build filter
      const filter: any = {
        must: [{ key: 'agent_id', match: { value: agentId } }],
      };

      if (category) {
        filter.must.push({ key: 'category', match: { value: category } });
      }

      // Search vector database
      const results = await vectorDb.vectorSearch({
        collection: vectorDb.COLLECTIONS.SEMANTIC_MEMORIES,
        vector: queryEmbedding,
        limit: topK,
        filter,
      });

      logger.info('Searched semantic memories', {
        agentId,
        queryLength: queryText.length,
        resultCount: results.length,
      });

      return results.map((r: any) => ({
        id: r.id,
        content: r.payload.content as string,
        score: r.score,
        source: r.payload.source as string,
      }));
    } catch (error) {
      logger.error('Failed to search semantic memories', error as Error, { agentId });
      throw error;
    }
  }

  /**
   * Export subgraph for visualization
   */
  async exportSubgraph(
    entityId: string,
    depth: number = 2
  ): Promise<{ nodes: Entity[]; edges: Relation[] }> {
    try {
      const paths = await this.traverseGraph(entityId, depth);

      const nodesMap = new Map<string, Entity>();
      const edges: Relation[] = [];

      for (const path of paths) {
        for (const node of path.nodes) {
          if (node.id) {
            nodesMap.set(node.id, node);
          }
        }
        edges.push(...path.relationships);
      }

      const nodes = Array.from(nodesMap.values());

      logger.info('Exported subgraph', { entityId, depth, nodeCount: nodes.length });

      return { nodes, edges };
    } catch (error) {
      logger.error('Failed to export subgraph', error as Error, { entityId });
      throw error;
    }
  }

  /**
   * Get semantic memory statistics
   */
  async getStats(agentId: string): Promise<{
    totalMemories: number;
    byCategory: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    try {
      const prisma = getPrismaClient();
      const memories = await prisma.memoryIndex.findMany({
        where: {
          agentId,
          memoryType: 'semantic',
        },
        select: {
          metadata: true,
        },
      });

      const byCategory: Record<string, number> = {};
      const bySource: Record<string, number> = {};

      for (const memory of memories) {
        const meta = memory.metadata as any;
        const category = meta?.category || 'unknown';
        const source = meta?.source || 'unknown';

        byCategory[category] = (byCategory[category] || 0) + 1;
        bySource[source] = (bySource[source] || 0) + 1;
      }

      return {
        totalMemories: memories.length,
        byCategory,
        bySource,
      };
    } catch (error) {
      logger.error('Failed to get semantic memory stats', error as Error, { agentId });
      throw error;
    }
  }
}

// Singleton instance
let semanticMemoryEngine: SemanticMemoryEngine;

export function getSemanticMemoryEngine(): SemanticMemoryEngine {
  if (!semanticMemoryEngine) {
    semanticMemoryEngine = new SemanticMemoryEngine();
  }
  return semanticMemoryEngine;
}
