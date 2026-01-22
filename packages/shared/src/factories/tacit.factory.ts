import {
  BaseTacit,
  EpisodicTacitRecord,
  SemanticTacitRecord,
  ShortTermTacit,
  ReflectionRecord,
  TacitInput,
} from '../types/tacit';
import { v4 as uuidv4 } from 'uuid';

export function createBaseTacit(input: Partial<BaseTacit>): BaseTacit {
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

export function createEpisodicTacit(
  input: TacitInput & { importance?: number }
): EpisodicTacitRecord {
  const base = createBaseTacit(input);
  return {
    ...base,
    eventType: input.eventType || 'observation',
    importance: input.importance || 5,
    accessCount: 0,
    lastAccessedAt: new Date(),
  };
}

export function createSemanticTacit(
  input: TacitInput & { source?: string; category?: string }
): SemanticTacitRecord {
  const base = createBaseTacit(input);
  return {
    ...base,
    source: input.source || 'unknown',
    category: input.category,
    verified: false,
  };
}

export function createShortTermTacit(
  input: TacitInput & { position: number; ttl?: number }
): ShortTermTacit {
  const base = createBaseTacit(input);
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
  sourceTacitIds: string[];
  importance?: number;
  embedding?: number[];
}): ReflectionRecord {
  return {
    id: uuidv4(),
    agentId: input.agentId,
    insights: input.insights,
    sourceTacitIds: input.sourceTacitIds,
    importance: input.importance || 8,
    embedding: input.embedding,
    timestamp: new Date(),
  };
}
