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
  private sseAbortController: AbortController | null = null;

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

  private parseSseBlock(block: string): { data: unknown; id?: string } | null {
    if (!block) return null;

    const lines = block.split('\n');
    const dataLines: string[] = [];
    let eventId: string | undefined;

    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^\s/, ''));
      } else if (line.startsWith('id:')) {
        const candidate = line.slice(3).trim();
        if (candidate) {
          eventId = candidate;
        }
      }
    }

    if (dataLines.length === 0) {
      return null;
    }

    const payloadText = dataLines.join('\n').trim();
    if (!payloadText) {
      return null;
    }

    try {
      const data = JSON.parse(payloadText);
      return { data, id: eventId };
    } catch {
      return null;
    }
  }

  // SSE-based streaming implementation following openchamber's approach
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

      console.log('[OpenCode] Connecting to global event stream...');

      // Clean up any existing connection
      if (this.sseAbortController) {
        this.sseAbortController.abort();
      }

      this.sseAbortController = new AbortController();
      const abortController = this.sseAbortController;

      // Connect to global event stream using manual SSE parsing
      const globalEndpoint = `${BASE_URL.replace(/\/+$/, '')}/global/event`;

      const response = await fetch(globalEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to connect to event stream: ${response.status}`);
      }

      console.log('[OpenCode] Connected to global event stream');

      // Track message parts and completion
      const seenParts = new Set<string>();
      let isCompleted = false;
      let hasReceivedParts = false;

      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        while (!abortController.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value || value.length === 0) continue;

          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            const parsed = this.parseSseBlock(block);
            if (!parsed?.data) continue;

            const event = parsed.data as any;

            // Check if this event is for our session
            const eventSessionId = event.properties?.sessionID ||
                                  event.properties?.info?.sessionID ||
                                  event.sessionID;

            if (eventSessionId !== currentSessionId) continue;

            // Handle message.part.updated - this is the key to showing complete process!
            if (event.type === 'message.part.updated') {
              const part = event.properties?.part;
              if (!part) continue;

              hasReceivedParts = true;

              // Generate unique key for this part
              const partKey = `${part.id || ''}-${part.type || ''}-${part.callID || ''}`;
              if (seenParts.has(partKey)) continue;
              seenParts.add(partKey);

              // Extract content based on part type
              let content = '';

              if (part.type === 'text') {
                content = part.text || part.content || '';
              } else if (part.type === 'tool') {
                // Show tool usage
                const toolName = part.name || 'tool';
                const toolInput = part.input ? JSON.stringify(part.input, null, 2) : '';
                content = `\n[Tool: ${toolName}]\n${toolInput}\n`;
              } else if (part.type === 'reasoning') {
                // Show reasoning
                const reasoningText = part.text || part.content || '';
                content = `\n[Thinking]\n${reasoningText}\n`;
              } else if (part.type === 'step-start') {
                content = `\n[Step Started]\n`;
              } else if (part.type === 'step-finish') {
                content = `\n[Step Finished]\n`;
              }

              if (content) {
                console.log(`[OpenCode] Part received: ${part.type} (${content.length} chars)`);
                callbacks.onChunk(content);
              }
            }

            // Handle message.updated - completion signal
            else if (event.type === 'message.updated') {
              const messageInfo = event.properties?.info || event.properties;
              const role = messageInfo?.role;
              const finish = messageInfo?.finish;

              // Only complete when assistant message has finish=stop
              if (role === 'assistant' && finish === 'stop') {
                console.log('[OpenCode] Message completed');
                isCompleted = true;
                abortController.abort();
                callbacks.onComplete();
                return;
              }
            }

            // Handle session status changes
            else if (event.type === 'session.status') {
              const status = event.properties?.status?.type;
              if (status === 'idle' && hasReceivedParts) {
                console.log('[OpenCode] Session idle, completing');
                isCompleted = true;
                abortController.abort();
                callbacks.onComplete();
                return;
              }
            }
          }
        }

        // Process remaining buffer
        const remaining = buffer.trim();
        if (remaining && !abortController.signal.aborted) {
          const parsed = this.parseSseBlock(remaining);
          if (parsed?.data) {
            const event = parsed.data as any;
            const eventSessionId = event.properties?.sessionID || event.sessionID;

            if (eventSessionId === currentSessionId && event.type === 'message.updated') {
              const finish = event.properties?.info?.finish;
              if (finish === 'stop') {
                isCompleted = true;
                callbacks.onComplete();
              }
            }
          }
        }

        if (!isCompleted) {
          console.log('[OpenCode] Stream ended without completion');
          if (hasReceivedParts) {
            callbacks.onComplete();
          } else {
            callbacks.onError('Stream ended without receiving any parts');
          }
        }
      };

      // Start processing stream in background
      processStream().catch((error) => {
        if (error.name === 'AbortError' || abortController.signal.aborted) {
          return;
        }
        console.error('[OpenCode] Stream processing error:', error);
        callbacks.onError(error.message);
      });

      // Now send the message
      console.log('[OpenCode] Sending message to session...');
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
        abortController.abort();
        callbacks.onError(`Failed to send message: ${errorText.substring(0, 200)}`);
        return currentSessionId;
      }

      console.log('[OpenCode] Message sent, waiting for streaming parts...');

      // Timeout fallback
      setTimeout(() => {
        if (!abortController.signal.aborted && !isCompleted) {
          console.log('[OpenCode] Timeout, completing');
          abortController.abort();
          if (hasReceivedParts) {
            callbacks.onComplete();
          } else {
            callbacks.onError('Timeout: No response received');
          }
        }
      }, 120000); // 2 minutes

      return currentSessionId;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return currentSessionId;
      }
      console.error('[OpenCode] Execution error:', error);
      callbacks.onError(error.message);
      return currentSessionId;
    }
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

  cleanup() {
    if (this.sseAbortController) {
      this.sseAbortController.abort();
      this.sseAbortController = null;
    }
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
