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

class OpenCodeService {
  private client: any = null;

  async connect(config: OpenCodeConfig = {}): Promise<void> {
    const baseUrl = config.hostname
      ? `http://${config.hostname}:${config.port || 80}`
      : import.meta.env.VITE_API_BASE_URL || 'https://opencode.tao-shen.com';

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

  // New streaming execution method
  async executeSkillStream(
    skillId: string,
    systemPrompt: string,
    userInput: string,
    callbacks: StreamCallbacks,
    sessionId?: string
  ): Promise<string | null> {
    if (!this.client) {
      await this.connect();
    }

    let currentSessionId: string | null = sessionId ?? null;

    if (!currentSessionId) {
      try {
        const createResp = await this.client.session.create({
          body: { title: `Skill: ${skillId}` },
        });
        currentSessionId = createResp.id || createResp.data?.id || null;
        if (!currentSessionId) {
          callbacks.onError('Failed to create session: no session ID returned');
          return null;
        }
        console.log('[OpenCode] Created session:', currentSessionId);
      } catch (error: any) {
        callbacks.onError(`Failed to create session: ${error.message}`);
        return null;
      }
    }

    try {
      // Send system prompt as context (non-streaming)
      if (systemPrompt) {
        await this.client.session.prompt({
          sessionId: currentSessionId,
          body: { parts: [{ type: 'text', text: systemPrompt }] },
        });
      }

      // Send user input
      await this.client.session.prompt({
        sessionId: currentSessionId,
        body: { parts: [{ type: 'text', text: userInput }] },
      });

      // Use SSE to stream messages
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://opencode.tao-shen.com';
      const eventSource = new EventSource(`${baseUrl}/session/${currentSessionId}/events`);

      let fullOutput = '';

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[OpenCode] SSE event:', data);

          // Handle different event types
          if (data.type === 'message' && data.data?.info?.parts) {
            const text = data.data.info.parts[0]?.text || '';
            if (text) {
              fullOutput += text;
              callbacks.onChunk(text);
            }
          } else if (data.type === 'complete') {
            eventSource.close();
            callbacks.onComplete();
          } else if (data.type === 'error') {
            eventSource.close();
            callbacks.onError(data.error || 'Unknown error');
          }
        } catch (e) {
          // Not JSON, treat as plain text
          fullOutput += event.data;
          callbacks.onChunk(event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[OpenCode] SSE error:', error);
        eventSource.close();
        // Don't call onError here, as the stream might have completed successfully
        // Only call onComplete if we haven't already
        if (fullOutput) {
          callbacks.onComplete();
        } else {
          callbacks.onError('Connection error');
        }
      };

      // Also poll for messages as fallback
      this.pollMessages(currentSessionId, callbacks, () => {
        eventSource.close();
      });

      return currentSessionId;
    } catch (error: any) {
      console.error('[OpenCode] Execution error:', error);
      callbacks.onError(error.message);
      return currentSessionId;
    }
  }

  // Poll messages as fallback
  private async pollMessages(
    sessionId: string,
    callbacks: StreamCallbacks,
    onStop: () => void,
    lastMessageId?: string
  ): Promise<void> {
    let currentLastMessageId = lastMessageId;

    const poll = async () => {
      try {
        const messagesParams: any = { sessionId };
        if (currentLastMessageId) {
          messagesParams.after = currentLastMessageId;
        }
        const msgsResp = await this.client.session.messages(messagesParams);
        const messages = msgsResp.data || [];

        for (const msg of messages) {
          if (msg.info?.role === 'assistant' && msg.info?.parts) {
            const text = msg.info.parts[0]?.text || '';
            if (text) {
              callbacks.onChunk(text);
            }
          }
          lastMessageId = msg.id;
        }

        // Check if session is complete
        const sessionResp = await this.client.session.get({ sessionId });
        const session = sessionResp.data || sessionResp;

        if (session.status === 'completed' || session.status === 'error') {
          onStop();
          callbacks.onComplete();
          return;
        }

        // Continue polling
        setTimeout(poll, 1000);
      } catch (error) {
        console.error('[OpenCode] Poll error:', error);
        setTimeout(poll, 2000);
      }
    };

    poll();
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
