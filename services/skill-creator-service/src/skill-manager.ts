import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { OpenCodeRunner } from './opencode-runner';
import type { Skill } from './skill-generator';

const prisma = new PrismaClient();

export interface SkillFilter {
  category?: string;
  status?: string;
  searchQuery?: string;
}

export class SkillManagerService {
  private openai: OpenAI;
  private opencode: OpenCodeRunner;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.opencode = new OpenCodeRunner();
  }

  async saveSkill(skill: Skill): Promise<Skill> {
    const saved = await prisma.skill.create({
      data: {
        id: skill.id,
        userId: skill.userId,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        icon: skill.icon,
        color: skill.color,
        config: skill.config as any,
        sourceFiles: skill.sourceFiles,
        analysisContext: skill.analysisContext as any,
        installCommand: skill.installCommand,
        popularity: skill.popularity,
        status: skill.status,
        isPublic: skill.isPublic,
      },
    });

    return this.mapToSkill(saved);
  }

  async getUserSkills(userId: string, filter?: SkillFilter): Promise<Skill[]> {
    const where: any = { userId };

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.searchQuery) {
      where.OR = [
        { name: { contains: filter.searchQuery, mode: 'insensitive' } },
        { description: { contains: filter.searchQuery, mode: 'insensitive' } },
      ];
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return skills.map(this.mapToSkill);
  }

  async getSkill(skillId: string): Promise<Skill | null> {
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    return skill ? this.mapToSkill(skill) : null;
  }

  async updateSkill(skillId: string, updates: Partial<Skill>): Promise<Skill> {
    const updated = await prisma.skill.update({
      where: { id: skillId },
      data: {
        name: updates.name,
        description: updates.description,
        category: updates.category,
        icon: updates.icon,
        color: updates.color,
        config: updates.config as any,
        status: updates.status,
        isPublic: updates.isPublic,
      },
    });

    return this.mapToSkill(updated);
  }

  async deleteSkill(skillId: string): Promise<void> {
    await prisma.skill.delete({
      where: { id: skillId },
    });
  }

  async executeSkill(skillId: string, userId: string, input: string): Promise<any> {
    const skill = await this.getSkill(skillId);

    if (!skill) {
      throw new Error('Skill not found');
    }

    const startTime = Date.now();

    try {
      let output = '';
      let tokensUsed = 0;

      // Try OpenCode first if available (configured via env in Runner)
      try {
        console.log(`[Execute] Attempting execution via OpenCode for skill ${skill.name}`);
        output = await this.opencode.run(skill.config.systemPrompt, input);
        // Estimate tokens or get from response if possible
        tokensUsed = output.length / 4; // Rough estimate
      } catch (opencodeError) {
        console.warn('[Execute] OpenCode execution failed, falling back to OpenAI:', opencodeError);

        // Fallback to OpenAI
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: skill.config.systemPrompt,
            },
            {
              role: 'user',
              content: input,
            },
          ],
          temperature: 0.7,
        });

        output = response.choices[0].message.content || '';
        tokensUsed = response.usage?.total_tokens || 0;
      }

      const duration = Date.now() - startTime;

      // Save execution record
      const execution = await prisma.skillExecution.create({
        data: {
          skillId,
          userId,
          input,
          output,
          status: 'success',
          duration,
          tokensUsed,
        },
      });

      // Update last used timestamp
      await prisma.skill.update({
        where: { id: skillId },
        data: { lastUsedAt: new Date() },
      });

      return {
        id: execution.id,
        skillId,
        input,
        output,
        status: 'success',
        executedAt: execution.executedAt,
        duration,
        tokensUsed,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Execution failed';

      // Save failed execution
      const execution = await prisma.skillExecution.create({
        data: {
          skillId,
          userId,
          input,
          status: 'error',
          error: errorMessage,
          duration,
        },
      });

      return {
        id: execution.id,
        skillId,
        input,
        output: '',
        status: 'error',
        error: errorMessage,
        executedAt: execution.executedAt,
        duration,
      };
    }
  }

  async getExecutionHistory(skillId: string): Promise<any[]> {
    const executions = await prisma.skillExecution.findMany({
      where: { skillId },
      orderBy: { executedAt: 'desc' },
      take: 50,
    });

    return executions.map((e: any) => ({
      id: e.id,
      skillId: e.skillId,
      input: e.input,
      output: e.output,
      status: e.status,
      error: e.error,
      executedAt: e.executedAt,
      duration: e.duration,
      tokensUsed: e.tokensUsed,
    }));
  }

  private mapToSkill(dbSkill: any): Skill {
    return {
      id: dbSkill.id,
      userId: dbSkill.userId,
      name: dbSkill.name,
      description: dbSkill.description || '',
      category: dbSkill.category,
      icon: dbSkill.icon || '✨',
      color: dbSkill.color || 'bg-gray-100',
      config: dbSkill.config,
      sourceFiles: dbSkill.sourceFiles || [],
      analysisContext: dbSkill.analysisContext,
      installCommand: dbSkill.installCommand || '',
      popularity: dbSkill.popularity || 0,
      status: dbSkill.status,
      isPublic: dbSkill.isPublic,
    };
  }
}
