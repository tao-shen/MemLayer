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

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nngpveejjssh.eu-central-1.clawcloudrun.com';

class OpenCodeService {
  private client: any = null;

  async connect(config: OpenCodeConfig = {}): Promise<void> {
    const baseUrl = config.hostname ? `http://${config.hostname}:${config.port || 80}` : BASE_URL;

    try {
      this.client = createOpencodeClient({
        baseUrl,
        directory: config.directory,
      });
      console.log('[OpenCode] Connected to', baseUrl);
    } catch (error) {
      console.error('[OpenCode] Failed to connect:', error);
      throw new Error('Failed to connect to OpenCode server');
    }
  }

  // Native fetch implementation for streaming
  async executeSkillStream(
    skillId: string,
    systemPrompt: string,
    userInput: string,
    callbacks: StreamCallbacks,
    sessionId?: string
  ): Promise<string | null> {
    let currentSessionId: string | null = sessionId ?? null;

    // Create session if needed
    if (!currentSessionId) {
      try {
        const resp = await fetch(`${BASE_URL}/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: window.location.origin,
          },
          body: JSON.stringify({ title: `Skill: ${skillId}` }),
        });
        const data = await resp.json();
        currentSessionId = data.id || null;
        if (!currentSessionId) {
          callbacks.onError('Failed to create session');
          return null;
        }
        console.log('[OpenCode] Created session:', currentSessionId);
      } catch (error: any) {
        callbacks.onError(`Failed to create session: ${error.message}`);
        return null;
      }
    }

    try {
      // Send system prompt
      if (systemPrompt) {
        await fetch(`${BASE_URL}/session/${currentSessionId}/prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: window.location.origin,
          },
          body: JSON.stringify({ parts: [{ type: 'text', text: systemPrompt }] }),
        });
      }

      // Send user input
      await fetch(`${BASE_URL}/session/${currentSessionId}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ parts: [{ type: 'text', text: userInput }] }),
      });

      // Poll for messages
      await this.pollMessages(currentSessionId, callbacks);

      return currentSessionId;
    } catch (error: any) {
      console.error('[OpenCode] Execution error:', error);
      callbacks.onError(error.message);
      return currentSessionId;
    }
  }

  private async pollMessages(sessionId: string, callbacks: StreamCallbacks): Promise<void> {
    let lastMessageCount = 0;
    let lastContent = '';
    let pollCount = 0;
    const maxPolls = 300;
    let isComplete = false;

    const poll = async () => {
      if (isComplete || pollCount >= maxPolls) {
        if (!isComplete) {
          callbacks.onComplete();
        }
        return;
      }

      pollCount++;

      try {
        // Get session status
        const sessionResp = await fetch(`${BASE_URL}/session/${sessionId}`, {
          headers: { Origin: window.location.origin },
        });
        const session = await sessionResp.json();

        // Get messages
        const msgsResp = await fetch(`${BASE_URL}/session/${sessionId}/message`, {
          headers: { Origin: window.location.origin },
        });
        const messages = await msgsResp.json();

        const assistantMessages = messages.filter((m: any) => m.info?.role === 'assistant');

        if (assistantMessages.length > lastMessageCount) {
          const latestMessage = assistantMessages[assistantMessages.length - 1];
          const fullContent = latestMessage.info?.parts?.[0]?.text || '';

          if (fullContent.length > lastContent.length) {
            const delta = fullContent.substring(lastContent.length);
            callbacks.onChunk(delta);
            lastContent = fullContent;
          }

          lastMessageCount = assistantMessages.length;
        }

        if (
          session.status === 'completed' ||
          session.status === 'error' ||
          session.status === 'idle'
        ) {
          isComplete = true;
          callbacks.onComplete();
          return;
        }

        setTimeout(poll, 1000);
      } catch (error: any) {
        console.error('[OpenCode] Poll error:', error);
        setTimeout(poll, 2000);
      }
    };

    poll();
  }

  // Fallback non-streaming method using SDK
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
      if (systemPrompt) {
        await this.client.session.prompt({
          sessionId: currentSessionId,
          body: { parts: [{ type: 'text', text: systemPrompt }] },
        });
      }

      await this.client.session.prompt({
        sessionId: currentSessionId,
        body: { parts: [{ type: 'text', text: userInput }] },
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));
      const msgsResp = await fetch(`${BASE_URL}/session/${currentSessionId}/message`, {
        headers: { Origin: window.location.origin },
      });
      const messages = await msgsResp.json();

      const lastAssistant = messages.filter((m: any) => m.info?.role === 'assistant').pop();

      const output = lastAssistant?.info?.parts?.[0]?.text || 'No output';

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
