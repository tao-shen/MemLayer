import { Entity, Relation, GraphPath } from '@agent-memory/shared';
export interface GraphRetrievalParams {
    entityId?: string;
    relationshipType?: string;
    depth?: number;
    limit?: number;
}
export declare class GraphRetriever {
    /**
     * Retrieve entities and relationships from knowledge graph
     */
    retrieve(params: GraphRetrievalParams): Promise<{
        entities: Entity[];
        relations: Relation[];
    }>;
    /**
     * Find paths between two entities
     */
    findPaths(fromEntityId: string, toEntityId: string, maxDepth?: number): Promise<GraphPath[]>;
    /**
     * Retrieve entities by type
     */
    retrieveByType(entityType: string, limit?: number): Promise<Entity[]>;
    /**
     * Retrieve related entities
     */
    retrieveRelated(entityId: string, relationshipType?: string, direction?: 'incoming' | 'outgoing' | 'both'): Promise<{
        entity: Entity;
        relationship: Relation;
    }[]>;
    /**
     * Execute custom Cypher query
     */
    executeQuery(cypherQuery: string, params?: Record<string, any>): Promise<any[]>;
}
export declare function getGraphRetriever(): GraphRetriever;
//# sourceMappingURL=graph-retriever.d.ts.map