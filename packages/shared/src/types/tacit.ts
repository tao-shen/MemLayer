// Base tacit knowledge interface
export interface BaseTacit {
  id: string;
  agentId: string;
  content: string;
  embedding?: number[];
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

// Short-term tacit knowledge
export interface ShortTermTacit extends BaseTacit {
  sessionId: string;
  position: number;
  expiresAt: Date;
}

// Episodic tacit knowledge
export type EventType = 'observation' | 'action' | 'interaction';

export interface EpisodicTacitRecord extends BaseTacit {
  eventType: EventType;
  importance: number; // 1-10
  accessCount: number;
  lastAccessedAt: Date;
}

// Semantic tacit knowledge
export interface SemanticTacitRecord extends BaseTacit {
  source: string;
  category?: string;
  verified: boolean;
}

// Reflection record
export interface ReflectionRecord {
  id: string;
  agentId: string;
  insights: string[];
  sourceTacitIds: string[];
  importance: number;
  embedding?: number[];
  timestamp: Date;
}

// Tacit knowledge types
export type TacitType = 'short-term' | 'episodic' | 'semantic' | 'procedural' | 'reflection';

// Tacit knowledge input for creation
export interface TacitInput {
  agentId: string;
  sessionId?: string;
  content: string;
  type: TacitType;
  metadata?: Record<string, any>;
  importance?: number;
  eventType?: EventType;
}

// Tacit knowledge query parameters
export interface TacitQuery {
  agentId: string;
  type?: TacitType;
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

// Episodic tacit knowledge result
export interface EpisodicTacit {
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
