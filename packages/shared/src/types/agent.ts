// Agent configuration
export interface AgentConfig {
  agentId: string;
  userId: string;
  name: string;
  stmWindowSize: number;
  embeddingModel: string;
  reflectionThreshold: number;
  filterRules: FilterRule[];
  forgettingPolicy: ForgettingPolicy;
  createdAt: Date;
}

// Filter rule
export interface FilterRule {
  type: 'importance' | 'content' | 'metadata';
  condition: string;
  action: 'accept' | 'reject';
}

// Forgetting policy
export interface ForgettingPolicy {
  enabled: boolean;
  strategy: 'time-based' | 'access-based' | 'importance-based';
  threshold: number;
  archiveBeforeDelete: boolean;
}

// Session
export interface Session {
  id: string;
  agentId: string;
  startedAt: Date;
  endedAt?: Date;
  metadata: Record<string, any>;
}

// Memory statistics
export interface MemoryStats {
  totalMemories: number;
  byType: Record<string, number>;
  storageSize: number;
  oldestMemory: Date;
  newestMemory: Date;
  averageImportance: number;
}
