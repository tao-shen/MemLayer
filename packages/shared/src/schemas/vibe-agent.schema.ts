import { z } from 'zod';

// ============================================
// Workflow Schemas
// ============================================

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['task', 'decision', 'tool', 'condition', 'loop']),
  name: z.string(),
  description: z.string(),
  action: z.string().optional(),
  condition: z.string().optional(),
  tool: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(['sequential', 'conditional', 'parallel', 'loop']),
  condition: z.string().optional(),
  weight: z.number().optional(),
});

export const workflowMetadataSchema = z.object({
  sourceData: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  extractionMethod: z.string(),
  lastUpdated: z.date(),
  usageCount: z.number().min(0),
  successRate: z.number().min(0).max(1),
});

export const workflowStatisticsSchema = z.object({
  averageExecutionTime: z.number().min(0),
  successRate: z.number().min(0).max(1),
  commonFailures: z.array(z.string()),
});

export const workflowSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  version: z.number().int().min(1),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  metadata: workflowMetadataSchema,
  statistics: workflowStatisticsSchema,
});

// ============================================
// Behavior Style Schemas
// ============================================

export const communicationStyleSchema = z.object({
  tone: z.enum(['formal', 'casual', 'friendly', 'professional']),
  verbosity: z.enum(['concise', 'moderate', 'detailed']),
  structure: z.object({
    useLists: z.boolean(),
    useTables: z.boolean(),
    useCodeBlocks: z.boolean(),
    useExamples: z.boolean(),
  }),
  vocabulary: z.object({
    commonTerms: z.array(z.string()),
    technicalTerms: z.array(z.string()),
    avoidTerms: z.array(z.string()),
  }),
  emojiUsage: z.object({
    frequency: z.enum(['never', 'rare', 'occasional', 'frequent']),
    preferredTypes: z.array(z.string()),
  }),
});

export const decisionMakingStyleSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  confirmationNeeded: z.boolean(),
  contextRequirement: z.enum(['minimal', 'moderate', 'extensive']),
  errorHandling: z.enum(['defensive', 'graceful', 'transparent']),
  priorityFactors: z.array(z.string()),
});

export const interactionPatternSchema = z.object({
  proactivity: z.enum(['reactive', 'balanced', 'proactive']),
  questionStyle: z.enum(['open', 'closed', 'mixed']),
  clarificationFrequency: z.enum(['low', 'medium', 'high']),
  feedbackResponse: z.object({
    positive: z.enum(['acknowledge', 'elaborate', 'suggest']),
    negative: z.enum(['apologize', 'explain', 'adapt']),
  }),
  personalization: z.enum(['none', 'light', 'heavy']),
});

export const domainCharacteristicsSchema = z.object({
  expertiseLevel: z.enum(['beginner', 'intermediate', 'expert']),
  bestPractices: z.array(z.string()),
  innovationTendency: z.enum(['low', 'medium', 'high']),
});

export const behaviorStyleMetadataSchema = z.object({
  sourceData: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  extractionMethod: z.string(),
  lastUpdated: z.date(),
  sampleCount: z.number().min(0),
});

export const behaviorStyleSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  version: z.number().int().min(1),
  communication: communicationStyleSchema,
  decisionMaking: decisionMakingStyleSchema,
  interaction: interactionPatternSchema,
  domain: domainCharacteristicsSchema,
  metadata: behaviorStyleMetadataSchema,
  embedding: z.array(z.number()).optional(),
});

// ============================================
// Raw Data Schemas
// ============================================

export const rawDataTypeSchema = z.enum([
  'conversation',
  'code',
  'document',
  'log',
  'api_call',
  'feedback',
]);

export const rawDataContextSchema = z.object({
  previousMessages: z.array(z.string()).optional(),
  environment: z.record(z.any()).optional(),
  userProfile: z.record(z.any()).optional(),
});

export const rawDataMetadataSchema = z.object({
  timestamp: z.date(),
  source: z.string(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export const rawDataSchema = z.object({
  id: z.string().uuid().optional(),
  type: rawDataTypeSchema,
  content: z.union([z.string(), z.record(z.any())]),
  metadata: rawDataMetadataSchema,
  context: rawDataContextSchema.optional(),
});

// ============================================
// Extraction Job Schemas
// ============================================

export const extractionJobStatusSchema = z.enum([
  'queued',
  'processing',
  'completed',
  'failed',
]);

export const extractionProgressSchema = z.object({
  workflow: z.number().min(0).max(100),
  behavior: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
});

export const extractionOptionsSchema = z.object({
  extractWorkflow: z.boolean().optional(),
  extractBehavior: z.boolean().optional(),
  extractMemory: z.boolean().optional(),
});

export const extractionJobCreateSchema = z.object({
  agentId: z.string().uuid().optional(),
  data: z.array(rawDataSchema),
  options: extractionOptionsSchema.optional(),
});

export const extractionJobUpdateSchema = z.object({
  status: extractionJobStatusSchema.optional(),
  progress: extractionProgressSchema.optional(),
  results: z.any().optional(),
  errors: z.array(z.string()).optional(),
});

// ============================================
// Agent Creation Schema
// ============================================

export const vibeAgentCreateSchema = z.object({
  name: z.string().min(1).max(255),
  jobId: z.string().uuid(),
  config: z.record(z.any()).optional(),
});

// ============================================
// Agent Update Schema
// ============================================

export const vibeAgentUpdateSchema = z.object({
  data: z.array(rawDataSchema).optional(),
  updateMode: z.enum(['merge', 'replace', 'incremental']).optional(),
});

// Export types
export type WorkflowNodeSchema = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdgeSchema = z.infer<typeof workflowEdgeSchema>;
export type WorkflowSchema = z.infer<typeof workflowSchema>;
export type BehaviorStyleSchema = z.infer<typeof behaviorStyleSchema>;
export type RawDataSchema = z.infer<typeof rawDataSchema>;
export type ExtractionJobCreateSchema = z.infer<typeof extractionJobCreateSchema>;
export type VibeAgentCreateSchema = z.infer<typeof vibeAgentCreateSchema>;
export type VibeAgentUpdateSchema = z.infer<typeof vibeAgentUpdateSchema>;
