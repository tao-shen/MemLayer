// Core Types for Memory Visualization Service

export type MemoryType = 'stm' | 'episodic' | 'semantic' | 'reflection';
export type EventType = 'interaction' | 'observation' | 'decision' | 'outcome';
export type EdgeType = 'reflection' | 'similarity' | 'temporal' | 'semantic';
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';
export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'circular';
export type SortField = 'timestamp' | 'importance' | 'type' | 'accessCount';

// Aggregated Memory Data
export interface AggregatedMemory {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  timestamp: Date;
  createdAt: Date;
  importance?: number;
  metadata: Record<string, any>;
  
  // Type-specific fields
  sessionId?: string;  // STM
  eventType?: EventType;  // Episodic
  accessCount?: number;  // Episodic
  source?: string;  // Semantic
  category?: string;  // Semantic
  verified?: boolean;  // Semantic
  insights?: string[];  // Reflection
  sourceMemoryIds?: string[];  // Reflection
}

// Timeline Data
export interface TimelineData {
  memories: TimelineMemory[];
  timeRange: {
    start: Date;
    end: Date;
  };
  milestones: Milestone[];
}

export interface TimelineMemory extends AggregatedMemory {
  x: number;  // Timeline position
  y: number;  // Vertical position (to avoid overlap)
}

export interface Milestone {
  timestamp: Date;
  label: string;
  memoryIds: string[];
}

// Graph Data
export interface MemoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: LayoutInfo;
}

export interface GraphNode {
  id: string;
  memory: AggregatedMemory;
  x: number;
  y: number;
  size: number;  // Based on importance
  color: string;  // Based on type
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
}

export interface LayoutInfo {
  algorithm: LayoutAlgorithm;
  width: number;
  height: number;
}

// Statistics Data
export interface Statistics {
  typeDistribution: TypeDistribution;
  timeDistribution: TimeDistribution;
  importanceDistribution: ImportanceDistribution;
  accessFrequency: AccessFrequency;
  summary: StatisticsSummary;
}

export interface TypeDistribution {
  [key: string]: number;  // memory type -> count
}

export interface TimeDistribution {
  granularity: TimeGranularity;
  data: Array<{
    timestamp: Date;
    count: number;
    byType: TypeDistribution;
  }>;
}

export interface ImportanceDistribution {
  ranges: Array<{
    min: number;
    max: number;
    count: number;
  }>;
}

export interface AccessFrequency {
  topAccessed: Array<{
    memoryId: string;
    accessCount: number;
  }>;
  averageAccessCount: number;
}

export interface StatisticsSummary {
  totalMemories: number;
  byType: TypeDistribution;
  averageImportance: number;
  oldestMemory: Date | null;
  newestMemory: Date | null;
}

// Query Parameters
export interface VisualizationQuery {
  agentId: string;
  filters?: MemoryFilters;
  includeRelationships?: boolean;
  includeSimilarities?: boolean;
  similarityThreshold?: number;
}

export interface TimelineQuery {
  agentId: string;
  filters?: MemoryFilters;
  includeMilestones?: boolean;
}

export interface GraphQuery {
  agentId: string;
  filters?: MemoryFilters;
  layout?: LayoutAlgorithm;
  showSimilarityEdges?: boolean;
  similarityThreshold?: number;
}

export interface StatisticsOptions {
  timeGranularity?: TimeGranularity;
  includeAccessFrequency?: boolean;
}

export interface MemoryFilters {
  types?: MemoryType[];
  timeRange?: TimeRange;
  importanceRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  sessionId?: string;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

// Real-time Updates
export interface MemoryUpdate {
  type: 'created' | 'updated' | 'deleted';
  memory: AggregatedMemory;
  timestamp: Date;
}

export interface Subscription {
  unsubscribe: () => void;
}

export type UpdateCallback = (update: MemoryUpdate) => void;

// Memory Relationships
export interface MemoryRelationship {
  sourceId: string;
  targetId: string;
  type: EdgeType;
  metadata?: Record<string, any>;
}

export interface SimilarityEdge {
  sourceId: string;
  targetId: string;
  similarity: number;
}

// Visualization Data
export interface VisualizationData {
  memories: AggregatedMemory[];
  relationships?: MemoryRelationship[];
  similarities?: SimilarityEdge[];
  metadata: {
    totalCount: number;
    filteredCount: number;
    appliedFilters: MemoryFilters;
  };
}

// Graph Options
export interface GraphOptions {
  layout: LayoutAlgorithm;
  width: number;
  height: number;
  includeSimilarityEdges: boolean;
  similarityThreshold: number;
}

// Export Options
export interface ExportOptions {
  format: 'json' | 'csv' | 'png' | 'svg';
  includeMetadata?: boolean;
  filters?: MemoryFilters;
}

// Error Types
export class VisualizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'VisualizationError';
  }
}

export const VisualizationErrorCodes = {
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  INVALID_FILTERS: 'INVALID_FILTERS',
  DATA_AGGREGATION_FAILED: 'DATA_AGGREGATION_FAILED',
  GRAPH_BUILD_FAILED: 'GRAPH_BUILD_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
} as const;
