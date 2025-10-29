import { z } from 'zod';

// Reflection context schema
export const reflectionContextSchema = z.object({
  timeRange: z
    .object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
    .optional(),
  importanceThreshold: z.number().min(1).max(10).optional(),
  maxMemories: z.number().min(1).max(1000).optional(),
});

// Reflection trigger schema
export const reflectionTriggerSchema = z.object({
  type: z.enum(['threshold', 'manual', 'scheduled']),
  threshold: z.number().min(0).optional(),
  schedule: z.string().optional(),
});

// Export types
export type ReflectionContextSchema = z.infer<typeof reflectionContextSchema>;
export type ReflectionTriggerSchema = z.infer<typeof reflectionTriggerSchema>;
