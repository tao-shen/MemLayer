// Frontend types matching backend types

export type MemoryType = 'stm' | 'episodic' | 'semantic' | 'reflection';
export type EventType = 'interaction' | 'observation' | 'decision' | 'outcome';
export type EdgeType = 'reflection' | 'similarity' | 'temporal' | 'semantic';
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';
export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'circular';
export type SortField = 'timestamp' | 'importance' | 'type' | 'accessCount';
export type ViewType = 'timeline' | 'graph' | 'list' | 'statistics';

export interface AggregatedMemory {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  timestamp: Date;
  createdAt: Date;
  importance?: number;
  metadata: Record<string, any>;
  sessionId?: string;
  eventType?: EventType;
  accessCount?: number;
  source?: string;
  category?: string;
  verified?: boolean;
  insights?: string[];
  sourceMemoryIds?: string[];
}

export interface MemoryFilters {
  types?: MemoryType[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  importanceRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  sessionId?: string;
}

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

export interface TimelineData {
  memories: TimelineMemory[];
  timeRange: {
    start: Date;
    end: Date;
  };
  milestones: Milestone[];
}

export interface TimelineMemory extends AggregatedMemory {
  x: number;
  y: number;
}

export interface Milestone {
  timestamp: Date;
  label: string;
  memoryIds: string[];
}

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
  size: number;
  color: string;
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

export interface Statistics {
  typeDistribution: TypeDistribution;
  timeDistribution: TimeDistribution;
  importanceDistribution: ImportanceDistribution;
  accessFrequency: AccessFrequency;
  summary: StatisticsSummary;
}

export interface TypeDistribution {
  [key: string]: number;
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

export interface MemoryUpdate {
  type: 'created' | 'updated' | 'deleted';
  memory: AggregatedMemory;
  timestamp: Date;
}
