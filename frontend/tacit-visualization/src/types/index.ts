// Frontend types matching backend types

export type TacitType = 'stm' | 'episodic' | 'semantic' | 'reflection';
export type EventType = 'interaction' | 'observation' | 'decision' | 'outcome';
export type EdgeType = 'reflection' | 'similarity' | 'temporal' | 'semantic';
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';
export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'circular';
export type SortField = 'timestamp' | 'importance' | 'type' | 'accessCount';
export type ViewType = 'timeline' | 'graph' | 'list' | 'statistics';

export interface AggregatedTacit {
  id: string;
  agentId: string;
  type: TacitType;
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
  sourceTacitIds?: string[];
}

export interface TacitFilters {
  types?: TacitType[];
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
  tacits: AggregatedTacit[];
  relationships?: TacitRelationship[];
  similarities?: SimilarityEdge[];
  metadata: {
    totalCount: number;
    filteredCount: number;
    appliedFilters: TacitFilters;
  };
}

export interface TimelineData {
  tacits: TimelineTacit[];
  timeRange: {
    start: Date;
    end: Date;
  };
  milestones: Milestone[];
}

export interface TimelineTacit extends AggregatedTacit {
  x: number;
  y: number;
}

export interface Milestone {
  timestamp: Date;
  label: string;
  tacitIds: string[];
}

export interface TacitGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: LayoutInfo;
}

export interface GraphNode {
  id: string;
  tacit: AggregatedTacit;
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
    tacitId: string;
    accessCount: number;
  }>;
  averageAccessCount: number;
}

export interface StatisticsSummary {
  totalTacits: number;
  byType: TypeDistribution;
  averageImportance: number;
  oldestTacit: Date | null;
  newestTacit: Date | null;
}

export interface TacitRelationship {
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

export interface TacitUpdate {
  type: 'created' | 'updated' | 'deleted';
  tacit: AggregatedTacit;
  timestamp: Date;
}

// Legacy aliases for backward compatibility
export type MemoryType = TacitType;
export interface AggregatedMemory extends AggregatedTacit {}
export interface MemoryFilters extends TacitFilters {}
export interface MemoryRelationship extends TacitRelationship {}
export interface MemoryUpdate extends TacitUpdate {}
export interface MemoryGraph extends TacitGraph {}
export interface TimelineMemory extends TimelineTacit {}
