export interface EmbeddingConfig {
    apiKey: string;
    model?: string;
    dimension?: number;
    timeout?: number;
    maxRetries?: number;
}
export declare class EmbeddingClient {
    private openai;
    private model;
    private dimension;
    constructor(config: EmbeddingConfig);
    /**
     * Generate embedding for a single text
     */
    generateEmbedding(text: string, useCache?: boolean): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts in batch
     */
    generateBatchEmbeddings(texts: string[], useCache?: boolean): Promise<number[][]>;
    /**
     * Get embedding dimension
     */
    getDimension(): number;
    /**
     * Get model name
     */
    getModel(): string;
    /**
     * Generate cache key for text
     */
    private getCacheKey;
    /**
     * Get cache statistics
     */
    getCacheStats(): Promise<{
        hits: number;
        misses: number;
        hitRate: number;
    }>;
}
export declare function getEmbeddingClient(config?: EmbeddingConfig): EmbeddingClient;
//# sourceMappingURL=client.d.ts.map