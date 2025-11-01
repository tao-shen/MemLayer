import { Entity, Relation, Fact, KnowledgeQuery, KnowledgeResult, GraphPath } from '@agent-memory/shared';
export declare class SemanticMemoryEngine {
    /**
     * Create entity in knowledge graph
     */
    createEntity(entity: Entity): Promise<string>;
    /**
     * Get entity by ID
     */
    getEntity(id: string): Promise<Entity | null>;
    /**
     * Update entity
     */
    updateEntity(id: string, properties: Record<string, any>): Promise<void>;
    /**
     * Delete entity
     */
    deleteEntity(id: string): Promise<void>;
    /**
     * Create relation between entities
     */
    createRelation(relation: Relation): Promise<void>;
    /**
     * Delete relation
     */
    deleteRelation(from: string, to: string, type: string): Promise<void>;
    /**
     * Store fact (triple) in knowledge graph
     */
    storeFact(fact: Fact): Promise<void>;
    /**
     * Store semantic memory with vector embedding
     */
    storeSemanticMemory(agentId: string, content: string, source: string, category?: string): Promise<string>;
    /**
     * Query knowledge graph
     */
    queryKnowledge(query: KnowledgeQuery): Promise<KnowledgeResult>;
    /**
     * Traverse knowledge graph
     */
    traverseGraph(startNodeId: string, depth: number): Promise<GraphPath[]>;
    /**
     * Search semantic memories by vector similarity
     */
    searchSemanticMemories(agentId: string, queryText: string, topK?: number, category?: string): Promise<Array<{
        id: string;
        content: string;
        score: number;
        source: string;
    }>>;
    /**
     * Export subgraph for visualization
     */
    exportSubgraph(entityId: string, depth?: number): Promise<{
        nodes: Entity[];
        edges: Relation[];
    }>;
    /**
     * Get semantic memory statistics
     */
    getStats(agentId: string): Promise<{
        totalMemories: number;
        byCategory: Record<string, number>;
        bySource: Record<string, number>;
    }>;
}
export declare function getSemanticMemoryEngine(): SemanticMemoryEngine;
//# sourceMappingURL=semantic-memory-engine.d.ts.map