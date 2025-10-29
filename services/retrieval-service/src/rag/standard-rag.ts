import { getHybridRetriever } from '../retrievers/hybrid-retriever';
import { RAGQuery, RAGResult, SearchResult, createLogger } from '@agent-memory/shared';

const logger = createLogger('StandardRAG');

export class StandardRAG {
  /**
   * Execute standard RAG workflow
   */
  async execute(query: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();

    try {
      const { query: queryText, agentId, topK = 5 } = query;

      // Step 1: Retrieve relevant memories
      const hybridRetriever = getHybridRetriever();
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
    } catch (error) {
      logger.error('Standard RAG failed', error as Error, {
        agentId: query.agentId,
      });
      throw error;
    }
  }

  /**
   * Build augmented prompt with retrieved context
   */
  private buildAugmentedPrompt(query: string, sources: SearchResult[]): string {
    if (sources.length === 0) {
      return query;
    }

    // Build context section
    const contextParts: string[] = [];
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
  async executeWithTemplate(
    query: RAGQuery,
    promptTemplate: string
  ): Promise<RAGResult> {
    const startTime = Date.now();

    try {
      const { query: queryText, agentId, topK = 5 } = query;

      // Retrieve
      const hybridRetriever = getHybridRetriever();
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
    } catch (error) {
      logger.error('Template-based RAG failed', error as Error);
      throw error;
    }
  }

  /**
   * Execute RAG with source citations
   */
  async executeWithCitations(query: RAGQuery): Promise<RAGResult & { citations: string[] }> {
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
  async executeWithConfidence(
    query: RAGQuery
  ): Promise<RAGResult & { confidence: number; reasoning: string }> {
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
    } else if (maxScore > 0.8 && result.sources.length >= 3) {
      confidence = 0.9;
      reasoning = 'High-quality matches with multiple sources';
    } else if (avgScore > 0.6) {
      confidence = 0.7;
      reasoning = 'Good average relevance across sources';
    } else if (maxScore > 0.5) {
      confidence = 0.5;
      reasoning = 'Moderate relevance, limited context';
    } else {
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

// Singleton instance
let standardRAG: StandardRAG;

export function getStandardRAG(): StandardRAG {
  if (!standardRAG) {
    standardRAG = new StandardRAG();
  }
  return standardRAG;
}
