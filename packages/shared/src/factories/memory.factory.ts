import {
  BaseMemory,
  EpisodicMemoryRecord,
  SemanticMemoryRecord,
  ShortTermMemory,
  ReflectionRecord,
  MemoryInput,
} from '../types/memory';
import { v4 as uuidv4 } from 'uuid';

export function createBaseMemory(input: Partial<BaseMemory>): BaseMemory {
  const now = new Date();
  return {
    id: input.id || uuidv4(),
    agentId: input.agentId || '',
    content: input.content || '',
    embedding: input.embedding,
    timestamp: input.timestamp || now,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    metadata: input.metadata || {},
  };
}

export function createEpisodicMemory(
  input: MemoryInput & { importance?: number }
): EpisodicMemoryRecord {
  const base = createBaseMemory(input);
  return {
    ...base,
    eventType: input.eventType || 'observation',
    importance: input.importance || 5,
    accessCount: 0,
    lastAccessedAt: new Date(),
  };
}

export function createSemanticMemory(
  input: MemoryInput & { source?: string; category?: string }
): SemanticMemoryRecord {
  const base = createBaseMemory(input);
  return {
    ...base,
    source: input.source || 'unknown',
    category: input.category,
    verified: false,
  };
}

export function createShortTermMemory(
  input: MemoryInput & { position: number; ttl?: number }
): ShortTermMemory {
  const base = createBaseMemory(input);
  const ttl = input.ttl || 3600; // 1 hour default
  return {
    ...base,
    sessionId: input.sessionId || '',
    position: input.position,
    expiresAt: new Date(Date.now() + ttl * 1000),
  };
}

export function createReflection(input: {
  agentId: string;
  insights: string[];
  sourceMemoryIds: string[];
  importance?: number;
  embedding?: number[];
}): ReflectionRecord {
  return {
    id: uuidv4(),
    agentId: input.agentId,
    insights: input.insights,
    sourceMemoryIds: input.sourceMemoryIds,
    importance: input.importance || 8,
    embedding: input.embedding,
    timestamp: new Date(),
  };
}
