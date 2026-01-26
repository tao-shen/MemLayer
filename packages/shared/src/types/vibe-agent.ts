// Vibe Agent Types

// ============================================
// Workflow Types
// ============================================

export interface WorkflowNode {
  id: string;
  type: 'task' | 'decision' | 'tool' | 'condition' | 'loop';
  name: string;
  description: string;
  action?: string;
  condition?: string;
  tool?: string;
  parameters?: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: 'sequential' | 'conditional' | 'parallel' | 'loop';
  condition?: string;
  weight?: number;
}

export interface WorkflowMetadata {
  sourceData: string[];
  confidence: number;
  extractionMethod: string;
  lastUpdated: Date;
  usageCount: number;
  successRate: number;
}

export interface WorkflowStatistics {
  averageExecutionTime: number;
  successRate: number;
  commonFailures: string[];
}

export interface Workflow {
  id: string;
  agentId: string;
  name: string;
  description: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: WorkflowMetadata;
  statistics: WorkflowStatistics;
}

// ============================================
// Behavior Style Types
// ============================================

export interface CommunicationStyle {
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  verbosity: 'concise' | 'moderate' | 'detailed';
  structure: {
    useLists: boolean;
    useTables: boolean;
    useCodeBlocks: boolean;
    useExamples: boolean;
  };
  vocabulary: {
    commonTerms: string[];
    technicalTerms: string[];
    avoidTerms: string[];
  };
  emojiUsage: {
    frequency: 'never' | 'rare' | 'occasional' | 'frequent';
    preferredTypes: string[];
  };
}

export interface DecisionMakingStyle {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  confirmationNeeded: boolean;
  contextRequirement: 'minimal' | 'moderate' | 'extensive';
  errorHandling: 'defensive' | 'graceful' | 'transparent';
  priorityFactors: string[];
}

export interface InteractionPattern {
  proactivity: 'reactive' | 'balanced' | 'proactive';
  questionStyle: 'open' | 'closed' | 'mixed';
  clarificationFrequency: 'low' | 'medium' | 'high';
  feedbackResponse: {
    positive: 'acknowledge' | 'elaborate' | 'suggest';
    negative: 'apologize' | 'explain' | 'adapt';
  };
  personalization: 'none' | 'light' | 'heavy';
}

export interface DomainCharacteristics {
  expertiseLevel: 'beginner' | 'intermediate' | 'expert';
  bestPractices: string[];
  innovationTendency: 'low' | 'medium' | 'high';
}

export interface BehaviorStyleMetadata {
  sourceData: string[];
  confidence: number;
  extractionMethod: string;
  lastUpdated: Date;
  sampleCount: number;
}

export interface BehaviorStyle {
  id: string;
  agentId: string;
  version: number;
  communication: CommunicationStyle;
  decisionMaking: DecisionMakingStyle;
  interaction: InteractionPattern;
  domain: DomainCharacteristics;
  metadata: BehaviorStyleMetadata;
  embedding?: number[];
}

// ============================================
// Extracted Memory Types
// ============================================

export type MemoryType = 'factual' | 'procedural' | 'episodic' | 'semantic';

export interface MemorySource {
  dataId: string;
  excerpt: string;
  context: string;
  timestamp: Date;
}

export interface MemoryUsage {
  accessCount: number;
  lastAccessed: Date;
  effectiveness: number;
}

export interface ExtractedMemoryMetadata {
  confidence: number;
  extractionMethod: string;
  verified: boolean;
  expiresAt?: Date;
}

export interface ExtractedMemory {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  summary: string;
  importance: number;
  entities: string[];
  relationships: string[];
  tags: string[];
  source: MemorySource;
  usage: MemoryUsage;
  metadata: ExtractedMemoryMetadata;
  embedding: number[];
}

// ============================================
// Raw Data Types
// ============================================

export type RawDataType = 
  | 'conversation' 
  | 'code' 
  | 'document' 
  | 'log' 
  | 'api_call' 
  | 'feedback';

export interface RawDataContext {
  previousMessages?: string[];
  environment?: Record<string, any>;
  userProfile?: Record<string, any>;
}

export interface RawDataMetadata {
  timestamp: Date;
  source: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

export interface RawData {
  id: string;
  type: RawDataType;
  content: string | object;
  metadata: RawDataMetadata;
  context?: RawDataContext;
}

// ============================================
// Extraction Job Types
// ============================================

export type ExtractionJobStatus = 
  | 'queued' 
  | 'processing' 
  | 'completed' 
  | 'failed';

export interface ExtractionProgress {
  workflow: number;
  behavior: number;
  memory: number;
}

export interface ExtractionOptions {
  extractWorkflow?: boolean;
  extractBehavior?: boolean;
  extractMemory?: boolean;
}

export interface ExtractionResults {
  workflow?: Workflow;
  behavior?: BehaviorStyle;
  memories?: ExtractedMemory[];
}

export interface ExtractionJob {
  id: string;
  agentId?: string;
  status: ExtractionJobStatus;
  progress: ExtractionProgress;
  results?: ExtractionResults;
  errors?: string[];
  options: ExtractionOptions;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================
// Execution Context Types
// ============================================

export interface ExecutionContext {
  agentId: string;
  userId: string;
  sessionId?: string;
  input: any;
  environment?: Record<string, any>;
  availableTools?: string[];
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTrace: WorkflowNode[];
  executionTime: number;
}

// ============================================
// Retrieval Context Types
// ============================================

export interface RetrievalContext {
  agentId: string;
  sessionId?: string;
  query: string;
  maxResults?: number;
  filters?: {
    type?: MemoryType[];
    minImportance?: number;
    tags?: string[];
  };
}
