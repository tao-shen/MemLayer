import * as kg from '@agent-memory/knowledge-graph';
import { Entity, Relation, GraphPath, createLogger } from '@agent-memory/shared';

const logger = createLogger('GraphRetriever');

export interface GraphRetrievalParams {
  entityId?: string;
  relationshipType?: string;
  depth?: number;
  limit?: number;
}

export class GraphRetriever {
  /**
   * Retrieve entities and relationships from knowledge graph
   */
  async retrieve(params: GraphRetrievalParams): Promise<{
    entities: Entity[];
    relations: Relation[];
  }> {
    try {
      const { entityId, depth = 1, limit = 100 } = params;

      if (!entityId) {
        throw new Error('entityId is required for graph retrieval');
      }

      // Traverse graph
      const paths = await kg.traverseGraph(entityId, depth);

      // Extract unique entities and relations
      const entitiesMap = new Map<string, Entity>();
      const relationsSet = new Set<string>();
      const relations: Relation[] = [];

      for (const path of paths.slice(0, limit)) {
        for (const node of path.nodes) {
          if (node.id) {
            entitiesMap.set(node.id, node);
          }
        }

        for (const rel of path.relationships) {
          const key = `${rel.from}-${rel.type}-${rel.to}`;
          if (!relationsSet.has(key)) {
            relationsSet.add(key);
            relations.push(rel);
          }
        }
      }

      const entities = Array.from(entitiesMap.values());

      logger.info('Graph retrieval completed', {
        entityId,
        depth,
        entityCount: entities.length,
        relationCount: relations.length,
      });

      return { entities, relations };
    } catch (error) {
      logger.error('Graph retrieval failed', error as Error, {
        entityId: params.entityId,
      });
      throw error;
    }
  }

  /**
   * Find paths between two entities
   */
  async findPaths(
    fromEntityId: string,
    toEntityId: string,
    maxDepth: number = 3
  ): Promise<GraphPath[]> {
    try {
      const session = kg.getSession();

      const result = await session.run(
        `
        MATCH path = shortestPath(
          (from:Entity {id: $fromId})-[*1..${maxDepth}]-(to:Entity {id: $toId})
        )
        RETURN path
        LIMIT 10
        `,
        { fromId: fromEntityId, toId: toEntityId }
      );

      await session.close();

      const paths: GraphPath[] = result.records.map((record) => {
        const path = record.get('path');
        return {
          nodes: path.segments.map((seg: any) => ({
            id: seg.start.properties.id,
            type: seg.start.properties.type,
            properties: seg.start.properties,
          })),
          relationships: path.segments.map((seg: any) => ({
            from: seg.start.properties.id,
            to: seg.end.properties.id,
            type: seg.relationship.type,
            properties: seg.relationship.properties,
          })),
        };
      });

      logger.info('Found paths between entities', {
        from: fromEntityId,
        to: toEntityId,
        pathCount: paths.length,
      });

      return paths;
    } catch (error) {
      logger.error('Path finding failed', error as Error, {
        from: fromEntityId,
        to: toEntityId,
      });
      throw error;
    }
  }

  /**
   * Retrieve entities by type
   */
  async retrieveByType(entityType: string, limit: number = 100): Promise<Entity[]> {
    try {
      const session = kg.getSession();

      const result = await session.run(
        `
        MATCH (e:Entity {type: $type})
        RETURN e
        LIMIT $limit
        `,
        { type: entityType, limit }
      );

      await session.close();

      const entities: Entity[] = result.records.map((record) => {
        const node = record.get('e');
        return {
          id: node.properties.id,
          type: node.properties.type,
          properties: node.properties,
        };
      });

      logger.info('Retrieved entities by type', {
        type: entityType,
        count: entities.length,
      });

      return entities;
    } catch (error) {
      logger.error('Type-based retrieval failed', error as Error, { type: entityType });
      throw error;
    }
  }

  /**
   * Retrieve related entities
   */
  async retrieveRelated(
    entityId: string,
    relationshipType?: string,
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ): Promise<{ entity: Entity; relationship: Relation }[]> {
    try {
      const session = kg.getSession();

      let pattern = '';
      if (direction === 'outgoing') {
        pattern = relationshipType
          ? `(e:Entity {id: $entityId})-[r:${relationshipType}]->(related)`
          : `(e:Entity {id: $entityId})-[r]->(related)`;
      } else if (direction === 'incoming') {
        pattern = relationshipType
          ? `(related)-[r:${relationshipType}]->(e:Entity {id: $entityId})`
          : `(related)-[r]->(e:Entity {id: $entityId})`;
      } else {
        pattern = relationshipType
          ? `(e:Entity {id: $entityId})-[r:${relationshipType}]-(related)`
          : `(e:Entity {id: $entityId})-[r]-(related)`;
      }

      const result = await session.run(
        `
        MATCH ${pattern}
        RETURN related, r
        LIMIT 100
        `,
        { entityId }
      );

      await session.close();

      const results = result.records.map((record) => {
        const relatedNode = record.get('related');
        const relationship = record.get('r');

        return {
          entity: {
            id: relatedNode.properties.id,
            type: relatedNode.properties.type,
            properties: relatedNode.properties,
          },
          relationship: {
            from: relationship.start.toString(),
            to: relationship.end.toString(),
            type: relationship.type,
            properties: relationship.properties,
          },
        };
      });

      logger.info('Retrieved related entities', {
        entityId,
        relationshipType,
        direction,
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Related entities retrieval failed', error as Error, { entityId });
      throw error;
    }
  }

  /**
   * Execute custom Cypher query
   */
  async executeQuery(cypherQuery: string, params: Record<string, any> = {}): Promise<any[]> {
    try {
      const session = kg.getSession();
      const result = await session.run(cypherQuery, params);
      await session.close();

      const results = result.records.map((record) => record.toObject());

      logger.info('Executed custom Cypher query', {
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Custom query execution failed', error as Error);
      throw error;
    }
  }
}

// Singleton instance
let graphRetriever: GraphRetriever;

export function getGraphRetriever(): GraphRetriever {
  if (!graphRetriever) {
    graphRetriever = new GraphRetriever();
  }
  return graphRetriever;
}
