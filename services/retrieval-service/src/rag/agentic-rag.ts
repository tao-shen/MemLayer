import { getHybridRetriever } from '../retrievers/hybrid-retriever';
import {
  RAGQuery,
  AgenticRAGResult,
  AgenticRAGStep,
  SearchResult,
  createLogger,
} from '@agent-memory/shared';

const logger = createLogger('AgenticRAG');

export class AgenticRAG {
  /**
   * Execute Agentic RAG workflow with multi-step reasoning
   */
  async execute(query: RAGQuery): Promise<AgenticRAGResult> {
    const startTime = Date.now();
    const steps: AgenticRAGStep[] = [];

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
    } catch (error) {
      logger.error('Agentic RAG failed', error as Error, {
        agentId: query.agentId,
      });
      throw error;
    }
  }

  /**
   * Step 1: Analyze the query
   */
  private async analyzeQuery(query: string): Promise<AgenticRAGStep> {
    // Simple analysis - in production, this would use an LLM
    const isFactual = /what|who|when|where|which|how many/i.test(query);
    const isComparison = /compare|difference|versus|vs/i.test(query);
    const isMultiPart = query.includes('and') || query.includes('also');

    const reasoning = `Query analysis: ${
      isFactual ? 'Factual question' : 'Open-ended question'
    }. ${isComparison ? 'Requires comparison.' : ''} ${
      isMultiPart ? 'Multi-part query detected.' : ''
    }`;

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
  private async planRetrieval(query: string, analysisStep: AgenticRAGStep): Promise<AgenticRAGStep> {
    // Determine retrieval strategy based on analysis
    let strategy = 'hybrid'; // Default

    if (analysisStep.reasoning?.includes('Factual')) {
      strategy = 'graph-enhanced';
    } else if (analysisStep.reasoning?.includes('Multi-part')) {
      strategy = 'multi-query';
    }

    const reasoning = `Retrieval strategy: ${strategy}. Will use ${
      strategy === 'graph-enhanced' ? 'knowledge graph + vector search' : 'vector search'
    }.`;

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
  private async executeRetrieval(
    agentId: string,
    planStep: AgenticRAGStep,
    topK: number
  ): Promise<AgenticRAGStep> {
    const hybridRetriever = getHybridRetriever();

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
      reasoning: `Retrieved ${result.mergedResults.length} results using ${
        useGraph ? 'hybrid' : 'vector'
      } search.`,
    };
  }

  /**
   * Step 4: Evaluate results
   */
  private async evaluateResults(retrievalStep: AgenticRAGStep): Promise<AgenticRAGStep> {
    const results = retrievalStep.results || [];

    let reasoning = '';
    if (results.length === 0) {
      reasoning = 'No results found - insufficient context.';
    } else if (results.length < 3) {
      reasoning = 'Limited results - may need refinement.';
    } else {
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      if (avgScore > 0.7) {
        reasoning = 'High-quality results obtained.';
      } else if (avgScore > 0.5) {
        reasoning = 'Moderate quality results.';
      } else {
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
  private async refineRetrieval(
    agentId: string,
    originalQuery: string,
    _previousStep: AgenticRAGStep,
    topK: number
  ): Promise<AgenticRAGStep> {
    // Expand search with relaxed filters
    const hybridRetriever = getHybridRetriever();

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
  private async synthesizeContext(steps: AgenticRAGStep[]): Promise<AgenticRAGStep> {
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
  private collectAllSources(steps: AgenticRAGStep[]): SearchResult[] {
    const allResults = steps.flatMap((s) => s.results || []);
    return this.deduplicateResults(allResults);
  }

  /**
   * Deduplicate search results by ID
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

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
  private buildAgenticPrompt(
    query: string,
    sources: SearchResult[],
    steps: AgenticRAGStep[]
  ): string {
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
  private generateFinalReasoning(steps: AgenticRAGStep[]): string {
    const stepSummaries = steps.map((s) => `${s.action}: ${s.reasoning}`);
    return `Agentic RAG completed ${steps.length} steps: ${stepSummaries.join(' → ')}`;
  }
}

// Singleton instance
let agenticRAG: AgenticRAG;

export function getAgenticRAG(): AgenticRAG {
  if (!agenticRAG) {
    agenticRAG = new AgenticRAG();
  }
  return agenticRAG;
}
