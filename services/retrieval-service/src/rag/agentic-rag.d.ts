import { RAGQuery, AgenticRAGResult } from '@agent-memory/shared';
export declare class AgenticRAG {
    /**
     * Execute Agentic RAG workflow with multi-step reasoning
     */
    execute(query: RAGQuery): Promise<AgenticRAGResult>;
    /**
     * Step 1: Analyze the query
     */
    private analyzeQuery;
    /**
     * Step 2: Plan retrieval strategy
     */
    private planRetrieval;
    /**
     * Step 3: Execute retrieval
     */
    private executeRetrieval;
    /**
     * Step 4: Evaluate results
     */
    private evaluateResults;
    /**
     * Refine retrieval with adjusted parameters
     */
    private refineRetrieval;
    /**
     * Synthesize context from all steps
     */
    private synthesizeContext;
    /**
     * Collect all sources from steps
     */
    private collectAllSources;
    /**
     * Deduplicate search results by ID
     */
    private deduplicateResults;
    /**
     * Build augmented prompt with agentic reasoning
     */
    private buildAgenticPrompt;
    /**
     * Generate final reasoning summary
     */
    private generateFinalReasoning;
}
export declare function getAgenticRAG(): AgenticRAG;
//# sourceMappingURL=agentic-rag.d.ts.map