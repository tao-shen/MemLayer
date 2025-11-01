import { SearchResult, Entity, Relation } from '@agent-memory/shared';
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
export declare class HybridRetriever {
    /**
     * Perform hybrid retrieval combining vector and graph search
     */
    retrieve(params: HybridRetrievalParams): Promise<HybridResult>;
    /**
     * Extract entity IDs from search results
     */
    private extractEntityIds;
    /**
     * Merge vector and graph results with weighted scoring
     */
    private mergeResults;
    /**
     * Deduplicate entities by ID
     */
    private deduplicateEntities;
    /**
     * Deduplicate relations
     */
    private deduplicateRelations;
    /**
     * Retrieve with automatic strategy selection
     */
    retrieveAuto(queryText: string, agentId: string, topK?: number): Promise<HybridResult>;
    /**
     * Detect if query mentions specific entities
     */
    private detectEntityMentions;
    /**
     * Detect if query is asking for factual information
     */
    private detectFactualQuery;
}
export declare function getHybridRetriever(): HybridRetriever;
//# sourceMappingURL=hybrid-retriever.d.ts.map