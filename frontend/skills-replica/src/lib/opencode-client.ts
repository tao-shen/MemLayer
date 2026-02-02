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

  // SSE-based streaming implementation (official OpenCode way)
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
      // Combine system prompt and user input
      const combinedText = systemPrompt
        ? `${systemPrompt}\n\n---\n\n${userInput}`
        : userInput;

      console.log('[OpenCode] Subscribing to event stream...');

      // Connect to SSE event stream FIRST
      const eventSource = new EventSource(`${BASE_URL}/event`);
      let accumulatedContent = '';

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[OpenCode] Event received:', data.type);

          // Handle message events
          if (data.type === 'message' && data.properties?.sessionID === currentSessionId) {
            const parts = data.properties?.info?.parts || [];
            const textParts = parts
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text || '')
              .join('\n');

            if (textParts && textParts.length > accumulatedContent.length) {
              const delta = textParts.substring(accumulatedContent.length);
              console.log(`[OpenCode] 📝 Streaming: ${delta.length} chars`);
              callbacks.onChunk(delta);
              accumulatedContent = textParts;
            }
          }

          // Handle completion
          if (data.type === 'session' && data.properties?.status === 'idle') {
            if (data.properties?.sessionID === currentSessionId) {
              console.log('[OpenCode] ✓ Session completed');
              eventSource.close();
              callbacks.onComplete();
            }
          }
        } catch (e) {
          console.error('[OpenCode] Event parse error:', e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[OpenCode] EventSource error:', error);
        eventSource.close();
      };

      // Now send the message
      console.log('[OpenCode] Sending message...');
      const messageResp = await fetch(`${BASE_URL}/session/${currentSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          model: {
            providerID: 'anthropic',
            modelID: 'claude-3-5-sonnet-20241022',
          },
          parts: [{ type: 'text', text: combinedText }],
        }),
      });

      if (!messageResp.ok) {
        const errorText = await messageResp.text();
        console.error('[OpenCode] Failed to send message:', errorText);
        eventSource.close();
        callbacks.onError(`Failed to send message: ${errorText.substring(0, 200)}`);
        return currentSessionId;
      }

      console.log('[OpenCode] Message sent, waiting for events...');

      // Timeout fallback
      setTimeout(() => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          console.log('[OpenCode] Timeout, closing event source');
          eventSource.close();
          if (accumulatedContent.length === 0) {
            callbacks.onError('No response received');
          } else {
            callbacks.onComplete();
          }
        }
      }, 120000); // 2 minutes

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
    let stableCount = 0;
    const maxPolls = 120; // 2 minutes max (60 seconds at 500ms intervals)
    const stableThreshold = 6; // Content stable for 3 seconds (6 * 500ms)
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
        // Get messages separately (not from session object)
        const messagesResp = await fetch(`${BASE_URL}/session/${sessionId}/message`, {
          headers: { Origin: window.location.origin },
        });

        if (!messagesResp.ok) {
          console.error('[OpenCode] Failed to fetch messages');
          setTimeout(poll, 1000);
          return;
        }

        const messages = await messagesResp.json();

        // Filter assistant messages
        if (Array.isArray(messages)) {
          const assistantMessages = messages.filter(
            (m: any) => m.info?.role === 'assistant'
          );

          if (assistantMessages.length > 0) {
            const lastMsg = assistantMessages[assistantMessages.length - 1];

            // Extract content from parts array
            let content = '';
            if (lastMsg.info?.parts && Array.isArray(lastMsg.info.parts)) {
              content = lastMsg.info.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text || '')
                .join('\n');
            }

            // Stream new content immediately
            if (content.length > lastContent.length) {
              const delta = content.substring(lastContent.length);
              console.log(`[OpenCode] 📝 New content: ${delta.length} chars (poll #${pollCount})`);
              callbacks.onChunk(delta);
              lastContent = content;
              stableCount = 0; // Reset counter
            } else if (content.length > 0) {
              stableCount++;
              if (stableCount >= stableThreshold) {
                console.log(`[OpenCode] ✓ Content stable for ${stableCount} polls, completing`);
                isComplete = true;
                callbacks.onComplete();
                return;
              }
            }
          } else if (pollCount <= 3) {
            console.log(`[OpenCode] ⏳ Waiting for response... (poll #${pollCount})`);
          }
        } else {
          console.log(`[OpenCode] ⚠️ Messages is not an array (poll #${pollCount})`);
        }

        // Continue polling
        setTimeout(poll, 500);
      } catch (error: any) {
        console.error('[OpenCode] Poll error:', error);
        setTimeout(poll, 1000);
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
