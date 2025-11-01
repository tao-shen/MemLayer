"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardRAG = void 0;
exports.getStandardRAG = getStandardRAG;
const hybrid_retriever_1 = require("../retrievers/hybrid-retriever");
const shared_1 = require("@agent-memory/shared");
const logger = (0, shared_1.createLogger)('StandardRAG');
class StandardRAG {
    /**
     * Execute standard RAG workflow
     */
    async execute(query) {
        const startTime = Date.now();
        try {
            const { query: queryText, agentId, topK = 5 } = query;
            // Step 1: Retrieve relevant memories
            const hybridRetriever = (0, hybrid_retriever_1.getHybridRetriever)();
            const retrievalResult = await hybridRetriever.retrieve({
                queryText,
                agentId,
                topK,
                includeGraph: false, // Standard RAG uses vector only
            });
            const sources = retrievalResult.vectorResults;
            // Step 2: Augment prompt with retrieved context
            const augmentedPrompt = this.buildAugmentedPrompt(queryText, sources);
            const retrievalTime = Date.now() - startTime;
            logger.info('Standard RAG completed', {
                agentId,
                queryLength: queryText.length,
                sourcesCount: sources.length,
                retrievalTime,
            });
            return {
                augmentedPrompt,
                sources,
                metadata: {
                    retrievalTime,
                    totalResults: sources.length,
                    mode: 'standard',
                },
            };
        }
        catch (error) {
            logger.error('Standard RAG failed', error, {
                agentId: query.agentId,
            });
            throw error;
        }
    }
    /**
     * Build augmented prompt with retrieved context
     */
    buildAugmentedPrompt(query, sources) {
        if (sources.length === 0) {
            return query;
        }
        // Build context section
        const contextParts = [];
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            contextParts.push(`[${i + 1}] ${source.content}`);
        }
        const context = contextParts.join('\n\n');
        // Build augmented prompt
        const augmentedPrompt = `Context information is below:
---
${context}
---

Given the context information above, please answer the following question:
${query}

If the context doesn't contain relevant information to answer the question, please say so.`;
        return augmentedPrompt;
    }
    /**
     * Execute RAG with custom prompt template
     */
    async executeWithTemplate(query, promptTemplate) {
        const startTime = Date.now();
        try {
            const { query: queryText, agentId, topK = 5 } = query;
            // Retrieve
            const hybridRetriever = (0, hybrid_retriever_1.getHybridRetriever)();
            const retrievalResult = await hybridRetriever.retrieve({
                queryText,
                agentId,
                topK,
                includeGraph: false,
            });
            const sources = retrievalResult.vectorResults;
            // Build context
            const context = sources.map((s, i) => `[${i + 1}] ${s.content}`).join('\n\n');
            // Apply template
            const augmentedPrompt = promptTemplate
                .replace('{context}', context)
                .replace('{query}', queryText);
            const retrievalTime = Date.now() - startTime;
            return {
                augmentedPrompt,
                sources,
                metadata: {
                    retrievalTime,
                    totalResults: sources.length,
                    mode: 'standard',
                },
            };
        }
        catch (error) {
            logger.error('Template-based RAG failed', error);
            throw error;
        }
    }
    /**
     * Execute RAG with source citations
     */
    async executeWithCitations(query) {
        const result = await this.execute(query);
        // Generate citations
        const citations = result.sources.map((source, i) => {
            const timestamp = source.timestamp.toISOString().split('T')[0];
            return `[${i + 1}] Memory from ${timestamp} (relevance: ${(source.score * 100).toFixed(1)}%)`;
        });
        return {
            ...result,
            citations,
        };
    }
    /**
     * Execute RAG with confidence scoring
     */
    async executeWithConfidence(query) {
        const result = await this.execute(query);
        // Calculate confidence based on retrieval scores
        const avgScore = result.sources.reduce((sum, s) => sum + s.score, 0) / result.sources.length;
        const maxScore = Math.max(...result.sources.map((s) => s.score));
        const minScore = Math.min(...result.sources.map((s) => s.score));
        // Confidence heuristic
        let confidence = 0;
        let reasoning = '';
        if (result.sources.length === 0) {
            confidence = 0;
            reasoning = 'No relevant context found';
        }
        else if (maxScore > 0.8 && result.sources.length >= 3) {
            confidence = 0.9;
            reasoning = 'High-quality matches with multiple sources';
        }
        else if (avgScore > 0.6) {
            confidence = 0.7;
            reasoning = 'Good average relevance across sources';
        }
        else if (maxScore > 0.5) {
            confidence = 0.5;
            reasoning = 'Moderate relevance, limited context';
        }
        else {
            confidence = 0.3;
            reasoning = 'Low relevance scores, answer may be uncertain';
        }
        logger.debug('Confidence calculated', {
            confidence,
            avgScore,
            maxScore,
            minScore,
            sourceCount: result.sources.length,
        });
        return {
            ...result,
            confidence,
            reasoning,
        };
    }
}
exports.StandardRAG = StandardRAG;
// Singleton instance
let standardRAG;
function getStandardRAG() {
    if (!standardRAG) {
        standardRAG = new StandardRAG();
    }
    return standardRAG;
}
//# sourceMappingURL=standard-rag.js.map