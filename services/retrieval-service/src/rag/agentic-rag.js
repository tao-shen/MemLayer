"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgenticRAG = void 0;
exports.getAgenticRAG = getAgenticRAG;
const hybrid_retriever_1 = require("../retrievers/hybrid-retriever");
const shared_1 = require("@agent-memory/shared");
const logger = (0, shared_1.createLogger)('AgenticRAG');
class AgenticRAG {
    /**
     * Execute Agentic RAG workflow with multi-step reasoning
     */
    async execute(query) {
        const startTime = Date.now();
        const steps = [];
        try {
            const { query: queryText, agentId, topK = 5 } = query;
            // Step 1: Analyze query
            const analysisStep = await this.analyzeQuery(queryText);
            steps.push(analysisStep);
            // Step 2: Plan retrieval strategy
            const planStep = await this.planRetrieval(queryText, analysisStep);
            steps.push(planStep);
            // Step 3: Execute retrieval
            const retrievalStep = await this.executeRetrieval(agentId, planStep, topK);
            steps.push(retrievalStep);
            // Step 4: Evaluate and potentially iterate
            const evaluationStep = await this.evaluateResults(retrievalStep);
            steps.push(evaluationStep);
            // If results are insufficient, perform additional retrieval
            if (evaluationStep.reasoning?.includes('insufficient') && steps.length < 6) {
                const refinedStep = await this.refineRetrieval(agentId, queryText, retrievalStep, topK);
                steps.push(refinedStep);
            }
            // Step 5: Synthesize final context
            const synthesisStep = await this.synthesizeContext(steps);
            steps.push(synthesisStep);
            // Build augmented prompt
            const allSources = this.collectAllSources(steps);
            const augmentedPrompt = this.buildAgenticPrompt(queryText, allSources, steps);
            const retrievalTime = Date.now() - startTime;
            // Generate final reasoning
            const finalReasoning = this.generateFinalReasoning(steps);
            logger.info('Agentic RAG completed', {
                agentId,
                queryLength: queryText.length,
                stepsCount: steps.length,
                sourcesCount: allSources.length,
                retrievalTime,
            });
            return {
                augmentedPrompt,
                sources: allSources,
                metadata: {
                    retrievalTime,
                    totalResults: allSources.length,
                    mode: 'agentic',
                },
                steps,
                finalReasoning,
            };
        }
        catch (error) {
            logger.error('Agentic RAG failed', error, {
                agentId: query.agentId,
            });
            throw error;
        }
    }
    /**
     * Step 1: Analyze the query
     */
    async analyzeQuery(query) {
        // Simple analysis - in production, this would use an LLM
        const isFactual = /what|who|when|where|which|how many/i.test(query);
        const isComparison = /compare|difference|versus|vs/i.test(query);
        const isMultiPart = query.includes('and') || query.includes('also');
        const reasoning = `Query analysis: ${isFactual ? 'Factual question' : 'Open-ended question'}. ${isComparison ? 'Requires comparison.' : ''} ${isMultiPart ? 'Multi-part query detected.' : ''}`;
        return {
            stepNumber: 1,
            action: 'analyze',
            query,
            reasoning,
        };
    }
    /**
     * Step 2: Plan retrieval strategy
     */
    async planRetrieval(query, analysisStep) {
        // Determine retrieval strategy based on analysis
        let strategy = 'hybrid'; // Default
        if (analysisStep.reasoning?.includes('Factual')) {
            strategy = 'graph-enhanced';
        }
        else if (analysisStep.reasoning?.includes('Multi-part')) {
            strategy = 'multi-query';
        }
        const reasoning = `Retrieval strategy: ${strategy}. Will use ${strategy === 'graph-enhanced' ? 'knowledge graph + vector search' : 'vector search'}.`;
        return {
            stepNumber: 2,
            action: 'route',
            query,
            reasoning,
        };
    }
    /**
     * Step 3: Execute retrieval
     */
    async executeRetrieval(agentId, planStep, topK) {
        const hybridRetriever = (0, hybrid_retriever_1.getHybridRetriever)();
        const useGraph = planStep.reasoning?.includes('graph');
        const result = await hybridRetriever.retrieve({
            queryText: planStep.query,
            agentId,
            topK,
            includeGraph: useGraph,
        });
        return {
            stepNumber: 3,
            action: 'retrieve',
            query: planStep.query,
            results: result.mergedResults,
            reasoning: `Retrieved ${result.mergedResults.length} results using ${useGraph ? 'hybrid' : 'vector'} search.`,
        };
    }
    /**
     * Step 4: Evaluate results
     */
    async evaluateResults(retrievalStep) {
        const results = retrievalStep.results || [];
        let reasoning = '';
        if (results.length === 0) {
            reasoning = 'No results found - insufficient context.';
        }
        else if (results.length < 3) {
            reasoning = 'Limited results - may need refinement.';
        }
        else {
            const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
            if (avgScore > 0.7) {
                reasoning = 'High-quality results obtained.';
            }
            else if (avgScore > 0.5) {
                reasoning = 'Moderate quality results.';
            }
            else {
                reasoning = 'Low relevance scores - insufficient context.';
            }
        }
        return {
            stepNumber: 4,
            action: 'synthesize',
            query: retrievalStep.query,
            reasoning,
        };
    }
    /**
     * Refine retrieval with adjusted parameters
     */
    async refineRetrieval(agentId, originalQuery, previousStep, topK) {
        // Expand search with relaxed filters
        const hybridRetriever = (0, hybrid_retriever_1.getHybridRetriever)();
        const result = await hybridRetriever.retrieve({
            queryText: originalQuery,
            agentId,
            topK: topK * 2, // Retrieve more
            includeGraph: true, // Enable graph
        });
        return {
            stepNumber: 5,
            action: 'retrieve',
            query: originalQuery,
            results: result.mergedResults,
            reasoning: `Refined search with expanded parameters. Retrieved ${result.mergedResults.length} additional results.`,
        };
    }
    /**
     * Synthesize context from all steps
     */
    async synthesizeContext(steps) {
        const allResults = steps.flatMap((s) => s.results || []);
        const uniqueResults = this.deduplicateResults(allResults);
        return {
            stepNumber: steps.length + 1,
            action: 'synthesize',
            query: steps[0].query,
            results: uniqueResults,
            reasoning: `Synthesized ${uniqueResults.length} unique results from ${steps.length} retrieval steps.`,
        };
    }
    /**
     * Collect all sources from steps
     */
    collectAllSources(steps) {
        const allResults = steps.flatMap((s) => s.results || []);
        return this.deduplicateResults(allResults);
    }
    /**
     * Deduplicate search results by ID
     */
    deduplicateResults(results) {
        const seen = new Set();
        const unique = [];
        for (const result of results) {
            if (!seen.has(result.id)) {
                seen.add(result.id);
                unique.push(result);
            }
        }
        return unique;
    }
    /**
     * Build augmented prompt with agentic reasoning
     */
    buildAgenticPrompt(query, sources, steps) {
        // Build reasoning trace
        const reasoningTrace = steps
            .map((step) => `Step ${step.stepNumber} (${step.action}): ${step.reasoning}`)
            .join('\n');
        // Build context
        const context = sources.map((s, i) => `[${i + 1}] ${s.content}`).join('\n\n');
        // Build augmented prompt
        const augmentedPrompt = `I performed a multi-step analysis to gather relevant context for your question.

Reasoning Process:
${reasoningTrace}

Context Information:
---
${context}
---

Original Question: ${query}

Based on the systematic retrieval and analysis above, please provide a comprehensive answer.`;
        return augmentedPrompt;
    }
    /**
     * Generate final reasoning summary
     */
    generateFinalReasoning(steps) {
        const stepSummaries = steps.map((s) => `${s.action}: ${s.reasoning}`);
        return `Agentic RAG completed ${steps.length} steps: ${stepSummaries.join(' → ')}`;
    }
}
exports.AgenticRAG = AgenticRAG;
// Singleton instance
let agenticRAG;
function getAgenticRAG() {
    if (!agenticRAG) {
        agenticRAG = new AgenticRAG();
    }
    return agenticRAG;
}
//# sourceMappingURL=agentic-rag.js.map