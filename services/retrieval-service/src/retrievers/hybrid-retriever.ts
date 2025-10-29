import { getVectorRetriever } from './vector-retriever';
import { getGraphRetriever } from './graph-retriever';
import { SearchResult, Entity, Relation, createLogger } from '@agent-memory/shared';

const logger = createLogger('HybridRetriever');

export interface HybridRetrievalParams {
  queryText: string;
  agentId: string;
  topK?: number;
  vectorWeight?: number;
  graphWeight?: number;
  includeGraph?: boolean;
}

export interface HybridResult {
  vectorResults: SearchResult[];
  graphResults?: {
    entities: Entity[];
    relations: Relation[];
  };
  mergedResults: SearchResult[];
}

export class HybridRetriever {
  /**
   * Perform hybrid retrieval combining vector and graph search
   */
  async retrieve(params: HybridRetrievalParams): Promise<HybridResult> {
    try {
      const {
        queryText,
        agentId,
        topK = 10,
        vectorWeight = 0.7,
        graphWeight = 0.3,
        includeGraph = true,
      } = params;

      // Vector retrieval
      const vectorRetriever = getVectorRetriever();
      const vectorResults = await vectorRetriever.retrieveMulti(
        ['episodic_memories', 'semantic_memories'],
        queryText,
        topK,
        {
          must: [{ key: 'agent_id', match: { value: agentId } }],
        }
      );

      let graphResults: { entities: Entity[]; relations: Relation[] } | undefined;
      let mergedResults = vectorResults;

      // Graph retrieval (if enabled)
      if (includeGraph) {
        try {
          // Extract entities from vector results to use as starting points
          const entityIds = this.extractEntityIds(vectorResults);

          if (entityIds.length > 0) {
            const graphRetriever = getGraphRetriever();
            const allEntities: Entity[] = [];
            const allRelations: Relation[] = [];

            // Retrieve graph context for each entity
            for (const entityId of entityIds.slice(0, 3)) {
              // Limit to top 3
              const graphData = await graphRetriever.retrieve({
                entityId,
                depth: 1,
                limit: 20,
              });
              allEntities.push(...graphData.entities);
              allRelations.push(...graphData.relations);
            }

            graphResults = {
              entities: this.deduplicateEntities(allEntities),
              relations: this.deduplicateRelations(allRelations),
            };

            // Merge and re-rank results
            mergedResults = this.mergeResults(vectorResults, graphResults, vectorWeight, graphWeight);
          }
        } catch (error) {
          logger.warn('Graph retrieval failed, using vector results only', error as Error);
        }
      }

      logger.info('Hybrid retrieval completed', {
        agentId,
        vectorCount: vectorResults.length,
        graphEntityCount: graphResults?.entities.length || 0,
        mergedCount: mergedResults.length,
      });

      return {
        vectorResults,
        graphResults,
        mergedResults: mergedResults.slice(0, topK),
      };
    } catch (error) {
      logger.error('Hybrid retrieval failed', error as Error, {
        agentId: params.agentId,
      });
      throw error;
    }
  }

  /**
   * Extract entity IDs from search results
   */
  private extractEntityIds(results: SearchResult[]): string[] {
    const entityIds: string[] = [];

    for (const result of results) {
      // Look for entity references in metadata
      if (result.metadata.entity_id) {
        entityIds.push(result.metadata.entity_id as string);
      }
      if (result.metadata.entities) {
        const entities = result.metadata.entities as string[];
        entityIds.push(...entities);
      }
    }

    return [...new Set(entityIds)]; // Deduplicate
  }

  /**
   * Merge vector and graph results with weighted scoring
   */
  private mergeResults(
    vectorResults: SearchResult[],
    graphResults: { entities: Entity[]; relations: Relation[] },
    vectorWeight: number,
    graphWeight: number
  ): SearchResult[] {
    const merged = [...vectorResults];

    // Add graph-derived results
    for (const entity of graphResults.entities) {
      // Check if entity is already in vector results
      const existing = merged.find((r) => r.metadata.entity_id === entity.id);

      if (existing) {
        // Boost score for entities found in both
        existing.score = existing.score * vectorWeight + 0.5 * graphWeight;
      } else {
        // Add new result from graph
        merged.push({
          id: entity.id || '',
          content: JSON.stringify(entity.properties),
          score: 0.3 * graphWeight, // Lower base score for graph-only results
          metadata: {
            source: 'graph',
            entity_id: entity.id,
            entity_type: entity.type,
            ...entity.properties,
          },
          timestamp: new Date(),
        });
      }
    }

    // Sort by final score
    merged.sort((a, b) => b.score - a.score);

    return merged;
  }

  /**
   * Deduplicate entities by ID
   */
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    const unique: Entity[] = [];

    for (const entity of entities) {
      if (entity.id && !seen.has(entity.id)) {
        seen.add(entity.id);
        unique.push(entity);
      }
    }

    return unique;
  }

  /**
   * Deduplicate relations
   */
  private deduplicateRelations(relations: Relation[]): Relation[] {
    const seen = new Set<string>();
    const unique: Relation[] = [];

    for (const relation of relations) {
      const key = `${relation.from}-${relation.type}-${relation.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(relation);
      }
    }

    return unique;
  }

  /**
   * Retrieve with automatic strategy selection
   */
  async retrieveAuto(
    queryText: string,
    agentId: string,
    topK: number = 10
  ): Promise<HybridResult> {
    // Analyze query to determine best strategy
    const hasEntityMentions = this.detectEntityMentions(queryText);
    const isFactualQuery = this.detectFactualQuery(queryText);

    let vectorWeight = 0.7;
    let graphWeight = 0.3;
    let includeGraph = true;

    if (hasEntityMentions && isFactualQuery) {
      // Favor graph for entity-centric factual queries
      vectorWeight = 0.4;
      graphWeight = 0.6;
    } else if (!hasEntityMentions) {
      // Use vector-only for general queries
      includeGraph = false;
    }

    logger.debug('Auto strategy selected', {
      hasEntityMentions,
      isFactualQuery,
      vectorWeight,
      graphWeight,
      includeGraph,
    });

    return await this.retrieve({
      queryText,
      agentId,
      topK,
      vectorWeight,
      graphWeight,
      includeGraph,
    });
  }

  /**
   * Detect if query mentions specific entities
   */
  private detectEntityMentions(query: string): boolean {
    // Simple heuristic: check for capitalized words (proper nouns)
    const words = query.split(/\s+/);
    const capitalizedWords = words.filter((w) => /^[A-Z][a-z]+/.test(w));
    return capitalizedWords.length >= 2;
  }

  /**
   * Detect if query is asking for factual information
   */
  private detectFactualQuery(query: string): boolean {
    const factualKeywords = [
      'what',
      'who',
      'when',
      'where',
      'which',
      'how many',
      'is',
      'are',
      'was',
      'were',
      'does',
      'did',
    ];
    const lowerQuery = query.toLowerCase();
    return factualKeywords.some((keyword) => lowerQuery.includes(keyword));
  }
}

// Singleton instance
let hybridRetriever: HybridRetriever;

export function getHybridRetriever(): HybridRetriever {
  if (!hybridRetriever) {
    hybridRetriever = new HybridRetriever();
  }
  return hybridRetriever;
}
