import { z } from 'zod';

// Event type schema
export const eventTypeSchema = z.enum(['observation', 'action', 'interaction']);

// Memory type schema
export const memoryTypeSchema = z.enum([
  'short-term',
  'episodic',
  'semantic',
  'procedural',
  'reflection',
]);

// Memory input schema
export const memoryInputSchema = z.object({
  agentId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  content: z.string().min(1).max(10000),
  type: memoryTypeSchema,
  metadata: z.record(z.any()).optional(),
  importance: z.number().min(1).max(10).optional(),
  eventType: eventTypeSchema.optional(),
});

// Memory query schema
export const memoryQuerySchema = z.object({
  agentId: z.string().uuid(),
  type: memoryTypeSchema.optional(),
  sessionId: z.string().uuid().optional(),
  timeRange: z
    .object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .optional(),
  minImportance: z.number().min(1).max(10).optional(),
  limit: z.number().min(1).max(1000).default(10),
  offset: z.number().min(0).default(0),
});

// Retrieval query schema
export const retrievalQuerySchema = z.object({
  agentId: z.string().uuid(),
  queryText: z.string().optional(),
  queryEmbedding: z.array(z.number()).optional(),
  topK: z.number().min(1).max(100).default(10),
  filters: z.record(z.any()).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  weights: z
    .object({
      recency: z.number().min(0).max(1),
      importance: z.number().min(0).max(1),
      relevance: z.number().min(0).max(1),
    })
    .optional(),
});

// Export types
export type MemoryInputSchema = z.infer<typeof memoryInputSchema>;
export type MemoryQuerySchema = z.infer<typeof memoryQuerySchema>;
export type RetrievalQuerySchema = z.infer<typeof retrievalQuerySchema>;
