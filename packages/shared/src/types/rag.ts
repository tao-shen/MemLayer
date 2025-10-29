import { SearchResult } from './memory';

// RAG query
export interface RAGQuery {
  query: string;
  agentId: string;
  topK?: number;
  mode?: 'standard' | 'agentic';
  context?: Record<string, any>;
}

// RAG result
export interface RAGResult {
  augmentedPrompt: string;
  sources: SearchResult[];
  metadata: {
    retrievalTime: number;
    totalResults: number;
    mode: 'standard' | 'agentic';
  };
}

// Agentic RAG step
export interface AgenticRAGStep {
  stepNumber: number;
  action: 'analyze' | 'retrieve' | 'route' | 'synthesize';
  query: string;
  results?: SearchResult[];
  reasoning?: string;
}

// Agentic RAG result
export interface AgenticRAGResult extends RAGResult {
  steps: AgenticRAGStep[];
  finalReasoning: string;
}
