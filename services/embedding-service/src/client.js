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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingClient = void 0;
exports.getEmbeddingClient = getEmbeddingClient;
const openai_1 = __importDefault(require("openai"));
const shared_1 = require("@agent-memory/shared");
const crypto_1 = require("crypto");
const cache = __importStar(require("@agent-memory/cache"));
const logger = (0, shared_1.createLogger)('EmbeddingClient');
class EmbeddingClient {
    openai;
    model;
    dimension;
    constructor(config) {
        this.openai = new openai_1.default({
            apiKey: config.apiKey,
            timeout: config.timeout || 30000,
            maxRetries: config.maxRetries || 3,
        });
        this.model = config.model || 'text-embedding-3-small';
        this.dimension = config.dimension || 1536;
    }
    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text, useCache = true) {
        try {
            // Check cache first
            if (useCache) {
                const cacheKey = this.getCacheKey(text);
                const cached = await cache.get(cacheKey);
                if (cached) {
                    logger.debug('Cache hit for embedding', { textLength: text.length });
                    return cached;
                }
            }
            // Generate embedding
            logger.debug('Generating embedding', { textLength: text.length, model: this.model });
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: text,
                dimensions: this.dimension,
            });
            const embedding = response.data[0].embedding;
            // Cache the result
            if (useCache) {
                const cacheKey = this.getCacheKey(text);
                await cache.set(cacheKey, embedding, 86400); // 24 hours
            }
            logger.info('Embedding generated successfully', {
                textLength: text.length,
                dimension: embedding.length,
            });
            return embedding;
        }
        catch (error) {
            logger.error('Failed to generate embedding', error, {
                textLength: text.length,
                model: this.model,
            });
            throw error;
        }
    }
    /**
     * Generate embeddings for multiple texts in batch
     */
    async generateBatchEmbeddings(texts, useCache = true) {
        if (texts.length === 0) {
            return [];
        }
        try {
            // Check cache for all texts
            const results = [];
            const uncachedIndices = [];
            const uncachedTexts = [];
            if (useCache) {
                for (let i = 0; i < texts.length; i++) {
                    const cacheKey = this.getCacheKey(texts[i]);
                    const cached = await cache.get(cacheKey);
                    if (cached) {
                        results[i] = cached;
                    }
                    else {
                        results[i] = null;
                        uncachedIndices.push(i);
                        uncachedTexts.push(texts[i]);
                    }
                }
            }
            else {
                uncachedIndices.push(...texts.map((_, i) => i));
                uncachedTexts.push(...texts);
            }
            // Generate embeddings for uncached texts
            if (uncachedTexts.length > 0) {
                logger.debug('Generating batch embeddings', {
                    total: texts.length,
                    uncached: uncachedTexts.length,
                    model: this.model,
                });
                const response = await this.openai.embeddings.create({
                    model: this.model,
                    input: uncachedTexts,
                    dimensions: this.dimension,
                });
                // Fill in results and cache
                for (let i = 0; i < uncachedIndices.length; i++) {
                    const embedding = response.data[i].embedding;
                    const originalIndex = uncachedIndices[i];
                    results[originalIndex] = embedding;
                    // Cache the result
                    if (useCache) {
                        const cacheKey = this.getCacheKey(texts[originalIndex]);
                        await cache.set(cacheKey, embedding, 86400); // 24 hours
                    }
                }
                logger.info('Batch embeddings generated successfully', {
                    total: texts.length,
                    generated: uncachedTexts.length,
                    cached: texts.length - uncachedTexts.length,
                });
            }
            return results;
        }
        catch (error) {
            logger.error('Failed to generate batch embeddings', error, {
                count: texts.length,
                model: this.model,
            });
            throw error;
        }
    }
    /**
     * Get embedding dimension
     */
    getDimension() {
        return this.dimension;
    }
    /**
     * Get model name
     */
    getModel() {
        return this.model;
    }
    /**
     * Generate cache key for text
     */
    getCacheKey(text) {
        const hash = (0, crypto_1.createHash)('sha256').update(text).digest('hex');
        return `embedding:${this.model}:${hash}`;
    }
    /**
     * Get cache statistics
     */
    async getCacheStats() {
        const hits = (await cache.get('embedding:cache:hits')) || 0;
        const misses = (await cache.get('embedding:cache:misses')) || 0;
        const total = hits + misses;
        const hitRate = total > 0 ? hits / total : 0;
        return { hits, misses, hitRate };
    }
}
exports.EmbeddingClient = EmbeddingClient;
// Singleton instance
let embeddingClient;
function getEmbeddingClient(config) {
    if (!embeddingClient) {
        const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }
        embeddingClient = new EmbeddingClient({
            apiKey,
            model: config?.model || process.env.EMBEDDING_MODEL,
            dimension: config?.dimension || parseInt(process.env.EMBEDDING_DIMENSION || '1536'),
            timeout: config?.timeout,
            maxRetries: config?.maxRetries,
        });
    }
    return embeddingClient;
}
//# sourceMappingURL=client.js.map