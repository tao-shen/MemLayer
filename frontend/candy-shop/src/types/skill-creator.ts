// Skill Creator Types

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon: string;
  color: string;

  // Configuration
  config: {
    capabilities: string[];
    systemPrompt: string;
    parameters: Record<string, unknown>;
    tools?: string[];
  };

  // Metadata
  sourceFiles: string[];
  analysisContext: AnalysisResult;
  installCommand: string;
  popularity: number;
  repo?: string;
  skillMdUrl?: string;
  greeting?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;

  // Status
  status: 'draft' | 'active' | 'archived';
  isPublic: boolean;

  // Origin
  origin?: 'created' | 'store';
}

export type SkillCategory =
  | 'Knowledge'
  | 'Analysis'
  | 'Development'
  | 'Design'
  | 'Marketing'
  | 'Productivity'
  | 'Tools'
  | 'Research'
  | 'Mobile'
  | 'Writing'
  | 'Custom';

export interface AnalysisResult {
  // Extracted information
  workDomain: string[];
  technicalSkills: string[];
  experiencePatterns: string[];
  keyTopics: string[];
  
  // Suggested configuration
  suggestedName: string;
  suggestedDescription: string;
  suggestedCategory: SkillCategory;
  suggestedCapabilities: string[];
  
  // Context
  filesSummary: FileSummary[];
  confidence: number;
  
  // Generated prompt
  systemPrompt: string;
}

export interface FileSummary {
  fileName: string;
  fileType: string;
  contentType: 'code' | 'document' | 'data' | 'other';
  keyInsights: string[];
  relevance: number;
}

export interface UploadedFile {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  contentHash: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
}

export interface ExecutionResult {
  id: string;
  skillId: string;
  input: string;
  output: string;
  status: 'success' | 'error';
  error?: string;
  executedAt: Date;
  duration: number;
  tokensUsed?: number;
}

export interface UploadResult {
  success: boolean;
  fileIds: string[];
  errors?: string[];
}

export interface SkillFilter {
  category?: SkillCategory;
  status?: 'draft' | 'active' | 'archived';
  searchQuery?: string;
}

export interface SkillPreferences {
  name?: string;
  category?: SkillCategory;
  capabilities?: string[];
}

export interface ExecutionHistory {
  id: string;
  input: string;
  output: string;
  timestamp: Date;
  duration: number;
}

export type CreationStep = 'upload' | 'analyzing' | 'preview' | 'complete';

export interface AnalysisStatus {
  status: 'uploading' | 'extracting' | 'analyzing' | 'generating';
  progress: number;
  currentFile?: string;
  message: string;
}
