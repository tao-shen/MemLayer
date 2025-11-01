import { RAGQuery, RAGResult } from '@agent-memory/shared';
export declare class StandardRAG {
    /**
     * Execute standard RAG workflow
     */
    execute(query: RAGQuery): Promise<RAGResult>;
    /**
     * Build augmented prompt with retrieved context
     */
    private buildAugmentedPrompt;
    /**
     * Execute RAG with custom prompt template
     */
    executeWithTemplate(query: RAGQuery, promptTemplate: string): Promise<RAGResult>;
    /**
     * Execute RAG with source citations
     */
    executeWithCitations(query: RAGQuery): Promise<RAGResult & {
        citations: string[];
    }>;
    /**
     * Execute RAG with confidence scoring
     */
    executeWithConfidence(query: RAGQuery): Promise<RAGResult & {
        confidence: number;
        reasoning: string;
    }>;
}
export declare function getStandardRAG(): StandardRAG;
//# sourceMappingURL=standard-rag.d.ts.map