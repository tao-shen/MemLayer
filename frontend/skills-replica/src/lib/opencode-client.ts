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
      // Combine system prompt and user input into a single message
      const combinedText = systemPrompt
        ? `${systemPrompt}\n\n---\n\n${userInput}`
        : userInput;

      console.log('[OpenCode] Sending message to /session/.../message endpoint...');

      // Send message (no model parameter needed - matches opencode-web implementation)
      const messageResp = await fetch(`${BASE_URL}/session/${currentSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          parts: [{ type: 'text', text: combinedText }],
        }),
      });

      if (!messageResp.ok) {
        const errorText = await messageResp.text();
        console.error('[OpenCode] Failed to send message:', errorText);
        callbacks.onError(`Failed to send message: ${errorText.substring(0, 200)}`);
        return currentSessionId;
      }

      console.log('[OpenCode] Message sent successfully, starting to poll...');

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
    let lastContent = '';
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max (same as opencode-web)
    let isComplete = false;

    console.log('[OpenCode] Starting message polling...');

    const poll = async () => {
      if (isComplete || pollCount >= maxPolls) {
        if (!isComplete) {
          console.log('[OpenCode] Polling timeout, completing...');
          callbacks.onComplete();
        }
        return;
      }

      pollCount++;

      try {
        // Get session data (matches opencode-web implementation)
        const sessionResp = await fetch(`${BASE_URL}/session/${sessionId}`, {
          headers: { Origin: window.location.origin },
        });

        if (!sessionResp.ok) {
          console.error('[OpenCode] Failed to fetch session');
          setTimeout(poll, 2000);
          return;
        }

        const sessionData = await sessionResp.json();

        console.log(`[OpenCode] Poll #${pollCount}: checking messages...`);

        // Extract messages from session data (matches opencode-web)
        if (sessionData.messages && Array.isArray(sessionData.messages)) {
          const assistantMessages = sessionData.messages.filter(
            (m: any) => m.role === 'assistant'
          );

          if (assistantMessages.length > 0) {
            const lastMsg = assistantMessages[assistantMessages.length - 1];

            // Extract content from parts array
            let content = '';
            if (lastMsg.parts && Array.isArray(lastMsg.parts)) {
              content = lastMsg.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text || part.content || '')
                .join('\n');
            } else if (lastMsg.content) {
              content = lastMsg.content;
            }

            // Check if content has grown (streaming updates)
            if (content.length > lastContent.length) {
              const delta = content.substring(lastContent.length);
              console.log(`[OpenCode] New content delta: ${delta.length} chars`);
              callbacks.onChunk(delta);
              lastContent = content;
            }

            // If we have content and it hasn't changed for a while, consider it complete
            if (content.length > 0 && content.length === lastContent.length && pollCount > 2) {
              console.log('[OpenCode] Content stable, completing poll');
              isComplete = true;
              callbacks.onComplete();
              return;
            }
          } else {
            console.log('[OpenCode] No assistant messages yet');
          }
        }

        // Continue polling
        setTimeout(poll, 1000);
      } catch (error: any) {
        console.error('[OpenCode] Poll error:', error);
        // Retry with longer delay on error
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
