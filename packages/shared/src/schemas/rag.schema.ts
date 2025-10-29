import { z } from 'zod';

// RAG query schema
export const ragQuerySchema = z.object({
  query: z.string().min(1),
  agentId: z.string().uuid(),
  topK: z.number().min(1).max(100).default(5),
  mode: z.enum(['standard', 'agentic']).default('standard'),
  context: z.record(z.any()).optional(),
});

// Export types
export type RAGQuerySchema = z.infer<typeof ragQuerySchema>;
