// Reflection context
export interface ReflectionContext {
  timeRange?: {
    start: Date;
    end: Date;
  };
  importanceThreshold?: number;
  maxTacits?: number;
}

// Reflection
export interface Reflection {
  id: string;
  agentId: string;
  insights: string[];
  sourceTacits: string[];
  importance: number;
  timestamp: Date;
}

// Reflection trigger
export interface ReflectionTrigger {
  type: 'threshold' | 'manual' | 'scheduled';
  threshold?: number;
  schedule?: string;
}
