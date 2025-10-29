// Base memory interface
export interface BaseMemory {
  id: string;
  agentId: string;
  content: string;
  embedding?: number[];
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

// Short-term memory
export interface ShortTermMemory extends BaseMemory {
  sessionId: string;
  position: number;
  expiresAt: Date;
}

// Episodic memory
export type EventType = 'observation' | 'action' | 'interaction';

export interface EpisodicMemoryRecord extends BaseMemory {
  eventType: EventType;
  importance: number; // 1-10
  accessCount: number;
  lastAccessedAt: Date;
}

// Semantic memory
export interface SemanticMemoryRecord extends BaseMemory {
  source: string;
  category?: string;
  verified: boolean;
}

// Reflection record
export interface ReflectionRecord {
  id: string;
  agentId: string;
  insights: string[];
  sourceMemoryIds: string[];
  importance: number;
  embedding?: number[];
  timestamp: Date;
}

// Memory types
export type MemoryType = 'short-term' | 'episodic' | 'semantic' | 'procedural' | 'reflection';

// Memory input for creation
export interface MemoryInput {
  agentId: string;
  sessionId?: string;
  content: string;
  type: MemoryType;
  metadata?: Record<string, any>;
  importance?: number;
  eventType?: EventType;
}

// Memory query parameters
export interface MemoryQuery {
  agentId: string;
  type?: MemoryType;
  sessionId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  minImportance?: number;
  limit?: number;
  offset?: number;
}

// Episodic event
export interface EpisodicEvent {
  agentId: string;
  content: string;
  eventType: EventType;
  timestamp?: Date;
  context?: Record<string, any>;
}

// Episodic query
export interface EpisodicQuery {
  agentId: string;
  queryText?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  minImportance?: number;
  topK?: number;
  weights?: {
    recency: number;
    importance: number;
    relevance: number;
  };
}

// Episodic memory result
export interface EpisodicMemory {
  id: string;
  content: string;
  importance: number;
  timestamp: Date;
  recencyScore: number;
  relevanceScore: number;
  compositeScore: number;
}

// Retrieval query
export interface RetrievalQuery {
  agentId: string;
  queryText?: string;
  queryEmbedding?: number[];
  topK?: number;
  filters?: Record<string, any>;
  similarityThreshold?: number;
  weights?: {
    recency: number;
    importance: number;
    relevance: number;
  };
}

// Search result
export interface SearchResult {
  id: string;
  content: string;
  score: number;
  recencyScore?: number;
  importanceScore?: number;
  relevanceScore?: number;
  compositeScore?: number;
  metadata: Record<string, any>;
  timestamp: Date;
}
