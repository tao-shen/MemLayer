import { SearchResult } from '@agent-memory/shared';
export interface VectorRetrievalParams {
    collection: string;
    queryText?: string;
    queryEmbedding?: number[];
    topK?: number;
    filters?: Record<string, any>;
    similarityThreshold?: number;
}
export declare class VectorRetriever {
    /**
     * Retrieve similar vectors
     */
    retrieve(params: VectorRetrievalParams): Promise<SearchResult[]>;
    /**
     * Retrieve from multiple collections and merge results
     */
    retrieveMulti(collections: string[], queryText: string, topK?: number, filters?: Record<string, any>): Promise<SearchResult[]>;
    /**
     * Retrieve with metadata filtering
     */
    retrieveWithFilters(collection: string, queryText: string, metadataFilters: Array<{
        key: string;
        value: any;
        operator?: 'eq' | 'ne' | 'gt' | 'lt';
    }>, topK?: number): Promise<SearchResult[]>;
    /**
     * Retrieve with score threshold
     */
    retrieveAboveThreshold(collection: string, queryText: string, threshold: number, maxResults?: number): Promise<SearchResult[]>;
}
export declare function getVectorRetriever(): VectorRetriever;
//# sourceMappingURL=vector-retriever.d.ts.map