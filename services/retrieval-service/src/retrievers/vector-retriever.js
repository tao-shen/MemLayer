"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorRetriever = void 0;
exports.getVectorRetriever = getVectorRetriever;
const vectorDb = __importStar(require("@agent-memory/vector-db"));
const shared_1 = require("@agent-memory/shared");
const client_1 = require("../../../embedding-service/src/client");
const logger = (0, shared_1.createLogger)('VectorRetriever');
class VectorRetriever {
    /**
     * Retrieve similar vectors
     */
    async retrieve(params) {
        try {
            const { collection, queryText, queryEmbedding, topK = 10, filters, similarityThreshold, } = params;
            // Get query embedding
            let embedding;
            if (queryEmbedding) {
                embedding = queryEmbedding;
            }
            else if (queryText) {
                const embeddingClient = (0, client_1.getEmbeddingClient)();
                embedding = await embeddingClient.generateEmbedding(queryText);
            }
            else {
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
            const searchResults = results.map((r) => ({
                id: r.id,
                content: r.payload.content,
                score: r.score,
                relevanceScore: r.score,
                metadata: r.payload,
                timestamp: new Date(r.payload.timestamp || Date.now()),
            }));
            logger.info('Vector retrieval completed', {
                collection,
                queryProvided: !!queryText,
                resultCount: searchResults.length,
            });
            return searchResults;
        }
        catch (error) {
            logger.error('Vector retrieval failed', error, {
                collection: params.collection,
            });
            throw error;
        }
    }
    /**
     * Retrieve from multiple collections and merge results
     */
    async retrieveMulti(collections, queryText, topK = 10, filters) {
        try {
            // Generate embedding once
            const embeddingClient = (0, client_1.getEmbeddingClient)();
            const embedding = await embeddingClient.generateEmbedding(queryText);
            // Retrieve from all collections in parallel
            const allResults = await Promise.all(collections.map((collection) => this.retrieve({
                collection,
                queryEmbedding: embedding,
                topK,
                filters,
            })));
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
        }
        catch (error) {
            logger.error('Multi-collection retrieval failed', error);
            throw error;
        }
    }
    /**
     * Retrieve with metadata filtering
     */
    async retrieveWithFilters(collection, queryText, metadataFilters, topK = 10) {
        try {
            // Build Qdrant filter
            const filter = {
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
        }
        catch (error) {
            logger.error('Filtered retrieval failed', error, { collection });
            throw error;
        }
    }
    /**
     * Retrieve with score threshold
     */
    async retrieveAboveThreshold(collection, queryText, threshold, maxResults = 100) {
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
        }
        catch (error) {
            logger.error('Threshold retrieval failed', error, { collection });
            throw error;
        }
    }
}
exports.VectorRetriever = VectorRetriever;
// Singleton instance
let vectorRetriever;
function getVectorRetriever() {
    if (!vectorRetriever) {
        vectorRetriever = new VectorRetriever();
    }
    return vectorRetriever;
}
//# sourceMappingURL=vector-retriever.js.map