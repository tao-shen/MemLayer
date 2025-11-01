import OpenAI from 'openai';
import { createLogger } from '@agent-memory/shared';
import { createHash } from 'crypto';
import * as cache from '@agent-memory/cache';

const logger = createLogger('EmbeddingClient');

export interface EmbeddingConfig {
  apiKey: string;
  model?: string;
  dimension?: number;
  timeout?: number;
  maxRetries?: number;
}

export class EmbeddingClient {
  private openai: OpenAI;
  private model: string;
  private dimension: number;

  constructor(config: EmbeddingConfig) {
    this.openai = new OpenAI({
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
  async generateEmbedding(text: string, useCache: boolean = true): Promise<number[]> {
    try {
      // Check cache first
      if (useCache) {
        const cacheKey = this.getCacheKey(text);
        const cached = await cache.get<number[]>(cacheKey);
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
    } catch (error) {
      logger.error('Failed to generate embedding', error as Error, {
        textLength: text.length,
        model: this.model,
      });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(
    texts: string[],
    useCache: boolean = true
  ): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    try {
      // Check cache for all texts
      const results: (number[] | null)[] = [];
      const uncachedIndices: number[] = [];
      const uncachedTexts: string[] = [];

      if (useCache) {
        for (let i = 0; i < texts.length; i++) {
          const cacheKey = this.getCacheKey(texts[i]);
          const cached = await cache.get<number[]>(cacheKey);
          if (cached) {
            results[i] = cached;
          } else {
            results[i] = null;
            uncachedIndices.push(i);
            uncachedTexts.push(texts[i]);
          }
        }
      } else {
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

      return results as number[][];
    } catch (error) {
      logger.error('Failed to generate batch embeddings', error as Error, {
        count: texts.length,
        model: this.model,
      });
      throw error;
    }
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Get model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Generate cache key for text
   */
  private getCacheKey(text: string): string {
    const hash = createHash('sha256').update(text).digest('hex');
    return `embedding:${this.model}:${hash}`;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ hits: number; misses: number; hitRate: number }> {
    const hits = (await cache.get<number>('embedding:cache:hits')) || 0;
    const misses = (await cache.get<number>('embedding:cache:misses')) || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;

    return { hits, misses, hitRate };
  }
}

// Singleton instance
let embeddingClient: EmbeddingClient;

export function getEmbeddingClient(config?: EmbeddingConfig): EmbeddingClient {
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
