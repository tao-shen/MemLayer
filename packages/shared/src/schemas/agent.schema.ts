import { z } from 'zod';

// Filter rule schema
export const filterRuleSchema = z.object({
  type: z.enum(['importance', 'content', 'metadata']),
  condition: z.string(),
  action: z.enum(['accept', 'reject']),
});

// Forgetting policy schema
export const forgettingPolicySchema = z.object({
  enabled: z.boolean(),
  strategy: z.enum(['time-based', 'access-based', 'importance-based']),
  threshold: z.number().min(0),
  archiveBeforeDelete: z.boolean(),
});

// Agent config schema
export const agentConfigSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  stmWindowSize: z.number().min(1).max(100).default(10),
  embeddingModel: z.string().default('text-embedding-3-small'),
  reflectionThreshold: z.number().min(0).default(50),
  filterRules: z.array(filterRuleSchema).default([]),
  forgettingPolicy: forgettingPolicySchema.default({
    enabled: false,
    strategy: 'time-based',
    threshold: 90,
    archiveBeforeDelete: true,
  }),
});

// Agent update schema
export const agentUpdateSchema = agentConfigSchema.partial();

// Session create schema
export const sessionCreateSchema = z.object({
  agentId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
});

// Export types
export type AgentConfigSchema = z.infer<typeof agentConfigSchema>;
export type AgentUpdateSchema = z.infer<typeof agentUpdateSchema>;
export type SessionCreateSchema = z.infer<typeof sessionCreateSchema>;
