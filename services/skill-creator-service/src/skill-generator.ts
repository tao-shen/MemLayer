import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult } from './content-analyzer';

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  config: {
    capabilities: string[];
    systemPrompt: string;
    parameters: Record<string, any>;
    tools?: string[];
  };
  sourceFiles: string[];
  analysisContext: AnalysisResult;
  installCommand: string;
  popularity: number;
  status: 'draft' | 'active' | 'archived';
  isPublic: boolean;
}

export interface SkillPreferences {
  name?: string;
  category?: string;
  capabilities?: string[];
}

export class SkillGenerator {
  generateSkill(
    userId: string,
    analysis: AnalysisResult,
    sourceFileIds: string[],
    preferences?: SkillPreferences
  ): Skill {
    const categoryIcons: Record<string, { icon: string; color: string }> = {
      Knowledge: { icon: '🦁', color: 'bg-blue-100 border-blue-200 text-blue-700' },
      Tools: { icon: '🛠️', color: 'bg-purple-100 border-purple-200 text-purple-700' },
      Productivity: { icon: '🎧', color: 'bg-pink-100 border-pink-200 text-pink-700' },
      Development: { icon: '⚡', color: 'bg-yellow-100 border-yellow-200 text-yellow-700' },
      Analysis: { icon: '📊', color: 'bg-green-100 border-green-200 text-green-700' },
      Custom: { icon: '✨', color: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
    };

    const category = preferences?.category || analysis.suggestedCategory;
    const { icon, color } = categoryIcons[category] || categoryIcons.Custom;

    const skill: Skill = {
      id: uuidv4(),
      userId,
      name: preferences?.name || analysis.suggestedName,
      description: analysis.suggestedDescription,
      category,
      icon,
      color,
      config: {
        capabilities: preferences?.capabilities || analysis.suggestedCapabilities,
        systemPrompt: analysis.systemPrompt,
        parameters: {},
        tools: [],
      },
      sourceFiles: sourceFileIds,
      analysisContext: analysis,
      installCommand: `skill install ${analysis.suggestedName.toLowerCase().replace(/\s+/g, '-')}`,
      popularity: 0,
      status: 'draft',
      isPublic: false,
    };

    return skill;
  }
}
