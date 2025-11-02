// Core Types
export type MemoryType = 'stm' | 'episodic' | 'semantic' | 'reflection';
export type RAGMode = 'off' | 'standard' | 'agentic';
export type MessageRole = 'user' | 'assistant' | 'system';

// Session Types
export interface Session {
  id: string;
  agentId: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  lastMessage?: string;
  messageCount: number;
  config: SessionConfig;
}

export interface SessionConfig {
  agentType: string;
  ragMode: RAGMode;
  memoryTypes: MemoryType[];
  autoReflection: boolean;
  blockchainEnabled: boolean;
}

// Message Types
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  ragResults?: RAGResult[];
  memoryIds?: string[];
}

export interface RAGResult {
  id: string;
  content: string;
  score: number;
  source: string;
  metadata: Record<string, any>;
}

// Memory Types
export interface Memory {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  importance: number;
  accessCount: number;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: Record<string, any>;
  entities?: Entity[];
  relationships?: Relationship[];
  onChain: boolean;
  assetAddress?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  memoryIds: string[];
  importance: number;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  weight: number;
  properties: Record<string, any>;
}

// Visualization Types
export interface MemoryFilters {
  types: MemoryType[];
  dateRange: [Date, Date] | null;
  importanceRange: [number, number];
  searchQuery: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'entity' | 'memory' | 'concept';
  properties: Record<string, any>;
  importance: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface Statistics {
  memoryStats: {
    total: number;
    byType: Record<MemoryType, number>;
    byImportance: Array<{ range: string; count: number }>;
  };
  trendData: Array<{
    timestamp: Date;
    count: number;
    byType: Record<MemoryType, number>;
  }>;
  topMemories: Array<{
    memory: Memory;
    accessCount: number;
  }>;
  topEntities: Array<{
    entity: Entity;
    connectionCount: number;
  }>;
}

// Blockchain Types
export interface MemoryAsset {
  id: string;
  memoryId: string;
  assetAddress: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image?: string;
    attributes: Array<{ trait_type: string; value: any }>;
  };
  arweaveUri: string;
  mintedAt: Date;
  transactionSignature: string;
}

export interface MintingProgress {
  memoryId: string;
  status: 'encrypting' | 'uploading' | 'minting' | 'confirming' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
