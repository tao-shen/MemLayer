import * as vectorDb from '@agent-memory/vector-db';
import { SearchResult, createLogger } from '@agent-memory/shared';
import { getEmbeddingClient } from '@agent-memory/shared';

const logger = createLogger('VectorRetriever');

export interface VectorRetrievalParams {
  collection: string;
  queryText?: string;
  queryEmbedding?: number[];
  topK?: number;
  filters?: Record<string, any>;
  similarityThreshold?: number;
}

export class VectorRetriever {
  /**
   * Retrieve similar vectors
   */
  async retrieve(params: VectorRetrievalParams): Promise<SearchResult[]> {
    try {
      const {
        collection,
        queryText,
        queryEmbedding,
        topK = 10,
        filters,
        similarityThreshold,
      } = params;

      // Get query embedding
      let embedding: number[];
      if (queryEmbedding) {
        embedding = queryEmbedding;
      } else if (queryText) {
        const embeddingClient = getEmbeddingClient();
        embedding = await embeddingClient.generateEmbedding(queryText);
      } else {
        throw new Error('Either queryText or queryEmbedding must be provided');
      }

      // Search vector database
      const results = await vectorDb.vectorSearch({
        collection,
        vector: embedding,
        limit: topK,
        filter: filters,
        scoreThreshold: similarityThreshold,
      });

      // Transform to SearchResult format
      const searchResults: SearchResult[] = results.map((r) => ({
        id: r.id,
        content: r.payload.content as string,
        score: r.score,
        relevanceScore: r.score,
        metadata: r.payload,
        timestamp: new Date(r.payload.timestamp as string || Date.now()),
      }));

      logger.info('Vector retrieval completed', {
        collection,
        queryProvided: !!queryText,
        resultCount: searchResults.length,
      });

      return searchResults;
    } catch (error) {
      logger.error('Vector retrieval failed', error as Error, {
        collection: params.collection,
      });
      throw error;
    }
  }

  /**
   * Retrieve from multiple collections and merge results
   */
  async retrieveMulti(
    collections: string[],
    queryText: string,
    topK: number = 10,
    filters?: Record<string, any>
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding once
      const embeddingClient = getEmbeddingClient();
      const embedding = await embeddingClient.generateEmbedding(queryText);

      // Retrieve from all collections in parallel
      const allResults = await Promise.all(
        collections.map((collection) =>
          this.retrieve({
            collection,
            queryEmbedding: embedding,
            topK,
            filters,
          })
        )
      );

      // Merge and sort by score
      const merged = allResults.flat();
      merged.sort((a, b) => b.score - a.score);

      // Take top K
      const topResults = merged.slice(0, topK);

      logger.info('Multi-collection retrieval completed', {
        collections: collections.length,
        totalResults: merged.length,
        topK,
      });

      return topResults;
    } catch (error) {
      logger.error('Multi-collection retrieval failed', error as Error);
      throw error;
    }
  }

  /**
   * Retrieve with metadata filtering
   */
  async retrieveWithFilters(
    collection: string,
    queryText: string,
    metadataFilters: Array<{ key: string; value: any; operator?: 'eq' | 'ne' | 'gt' | 'lt' }>,
    topK: number = 10
  ): Promise<SearchResult[]> {
    try {
      // Build Qdrant filter
      const filter: any = {
        must: metadataFilters.map((f) => ({
          key: f.key,
          match: { value: f.value },
        })),
      };

      return await this.retrieve({
        collection,
        queryText,
        topK,
        filters: filter,
      });
    } catch (error) {
      logger.error('Filtered retrieval failed', error as Error, { collection });
      throw error;
    }
  }

  /**
   * Retrieve with score threshold
   */
  async retrieveAboveThreshold(
    collection: string,
    queryText: string,
    threshold: number,
    maxResults: number = 100
  ): Promise<SearchResult[]> {
    try {
      const results = await this.retrieve({
        collection,
        queryText,
        topK: maxResults,
        similarityThreshold: threshold,
      });

      logger.info('Threshold retrieval completed', {
        collection,
        threshold,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Threshold retrieval failed', error as Error, { collection });
      throw error;
    }
  }
}

// Singleton instance
let vectorRetriever: VectorRetriever;

export function getVectorRetriever(): VectorRetriever {
  if (!vectorRetriever) {
    vectorRetriever = new VectorRetriever();
  }
  return vectorRetriever;
}
