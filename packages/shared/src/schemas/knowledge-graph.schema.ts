import { z } from 'zod';

// Entity schema
export const entitySchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  properties: z.record(z.any()),
});

// Relation schema
export const relationSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string().min(1),
  properties: z.record(z.any()).optional(),
});

// Fact schema
export const factSchema = z.object({
  subject: z.string(),
  predicate: z.string(),
  object: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
});

// Knowledge query schema
export const knowledgeQuerySchema = z.object({
  pattern: factSchema.optional(),
  entityId: z.string().optional(),
  queryText: z.string().optional(),
  depth: z.number().min(1).max(5).default(1),
});

// Export types
export type EntitySchema = z.infer<typeof entitySchema>;
export type RelationSchema = z.infer<typeof relationSchema>;
export type FactSchema = z.infer<typeof factSchema>;
export type KnowledgeQuerySchema = z.infer<typeof knowledgeQuerySchema>;
