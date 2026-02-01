import { createOpencodeClient } from '@opencode-ai/sdk/client';

export interface OpenCodeConfig {
  hostname?: string;
  port?: number;
  directory?: string;
}

export interface SkillExecutionResult {
  success: boolean;
  output: string;
  sessionId?: string;
  error?: string;
}

class OpenCodeService {
  private client: any = null;

  async connect(config: OpenCodeConfig = {}): Promise<void> {
    const hostname = config.hostname || 'opencode.tao-shen.com';
    const port = config.port || 4096;

    try {
      this.client = createOpencodeClient({
        baseUrl: `http://${hostname}:${port}`,
        directory: config.directory,
      });
      console.log('[OpenCode] Connected to', `http://${hostname}:${port}`);
    } catch (error) {
      console.error('[OpenCode] Failed to connect:', error);
      throw new Error('Failed to connect to OpenCode server');
    }
  }

  async executeSkill(
    skillId: string,
    systemPrompt: string,
    userInput: string,
    sessionId?: string
  ): Promise<SkillExecutionResult> {
    if (!this.client) {
      await this.connect();
    }

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      try {
        const createResp = await this.client.session.create({
          body: { title: `Skill: ${skillId}` },
        });
        currentSessionId = createResp.id || createResp.data?.id || '';
      } catch (error: any) {
        return { success: false, output: '', error: `Failed to create session: ${error.message}` };
      }
    }

    try {
      // Send system prompt as context
      if (systemPrompt) {
        await this.client.session.prompt({
          sessionId: currentSessionId,
          body: { parts: [{ type: 'text', text: systemPrompt }] },
        });
      }

      // Send user input
      const promptResp = await this.client.session.prompt({
        sessionId: currentSessionId,
        body: { parts: [{ type: 'text', text: userInput }] },
      });

      // Get messages to find assistant response
      const msgsResp = await this.client.session.messages({ sessionId: currentSessionId });
      const messages = msgsResp.data || [];

      const lastAssistant = messages.filter((m: any) => m.info?.role === 'assistant').pop();

      const output =
        lastAssistant?.info?.parts?.[0]?.text ||
        promptResp.data?.info?.parts?.[0]?.text ||
        'No output';

      return { success: true, output, sessionId: currentSessionId };
    } catch (error: any) {
      console.error('[OpenCode] Execution error:', error);
      return { success: false, output: '', sessionId: currentSessionId, error: error.message };
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

export const opencodeService = new OpenCodeService();

import { useState, useCallback } from 'react';

export function useOpenCode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSkill = useCallback(
    async (skillId: string, systemPrompt: string, userInput: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await opencodeService.executeSkill(skillId, systemPrompt, userInput);
        if (!result.success) setError(result.error || 'Execution failed');
        return result;
      } catch (err: any) {
        setError(err.message);
        return { success: false, output: '', error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isConnected: opencodeService.isConnected(), isLoading, error, executeSkill };
}
