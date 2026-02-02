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

export interface ModelConfig {
  providerID: string;
  modelID: string;
  agent?: string;
}

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://nngpveejjssh.eu-central-1.clawcloudrun.com';

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
    sessionId?: string,
    modelConfig?: ModelConfig
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
      const combinedText = systemPrompt ? `${systemPrompt}\n\n---\n\n${userInput}` : userInput;

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
          Accept: 'text/event-stream',
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

            // Debug: log all events to understand the structure
            console.log('[OpenCode] Raw event:', JSON.stringify(event).substring(0, 200));

            // Extract event type and properties
            let eventType = event.type;
            let eventProps = event.properties || {};

            // Handle wrapped events (some servers send { payload: {...} })
            if (!eventType && event.payload) {
              eventType = event.payload.type;
              eventProps = event.payload.properties || event.payload;
            }

            // Check if this event is for our session
            // Different events have sessionID in different places:
            // - message.part.updated: eventProps.part.sessionID
            // - message.updated: eventProps.info.sessionID
            // - session.status: eventProps.sessionID
            const eventSessionId =
              eventProps.sessionID ||
              eventProps.info?.sessionID ||
              eventProps.part?.sessionID || // For message.part.updated
              event.sessionID ||
              eventProps.sessionId;

            console.log(
              '[OpenCode] Event type:',
              eventType,
              'Session:',
              eventSessionId,
              'Target:',
              currentSessionId
            );

            if (eventSessionId && eventSessionId !== currentSessionId) {
              console.log('[OpenCode] Skipping event for different session');
              continue;
            }

            // Handle message.part.updated - this is the key to showing complete process!
            if (eventType === 'message.part.updated') {
              const part = eventProps.part;
              if (!part) {
                console.log('[OpenCode] No part in message.part.updated event');
                continue;
              }

              // Get the message info to check if it's an assistant message
              const messageInfo = eventProps.info;
              const messageRole = messageInfo?.role;

              // Only show assistant messages (skip user message echo)
              if (messageRole && messageRole !== 'assistant') {
                console.log('[OpenCode] Skipping non-assistant part (role:', messageRole, ')');
                continue;
              }

              hasReceivedParts = true;

              // Generate unique key for this part
              const partKey = `${part.id || ''}-${part.type || ''}-${part.callID || ''}`;
              if (seenParts.has(partKey)) {
                console.log('[OpenCode] Duplicate part, skipping:', partKey);
                continue;
              }
              seenParts.add(partKey);

              // Extract content based on part type
              let content = '';

              if (part.type === 'text') {
                content = part.text || part.content || '';
              } else if (part.type === 'tool') {
                const toolName = part.name || 'tool';
                const toolState = part.state || 'pending';
                const toolInput = part.input ? JSON.stringify(part.input, null, 2) : '';
                const toolOutput = part.output || '';
                const toolError = part.error || '';
                const toolTitle = part.title || '';

                content = `\n[Tool: ${toolName}]\n`;
                content += `State: ${toolState}\n`;

                if (toolTitle) {
                  content += `Title: ${toolTitle}\n`;
                }

                if (toolInput) {
                  content += `Input:\n${toolInput}\n`;
                }

                if (toolState === 'running') {
                  content += `[Executing...]\n`;
                } else if (toolState === 'completed') {
                  content += `[Completed]\n`;
                  if (toolOutput) {
                    content += `Output:\n${toolOutput}\n`;
                  }
                } else if (toolState === 'error') {
                  content += `[Error]\n`;
                  if (toolError) {
                    content += `${toolError}\n`;
                  }
                } else if (toolState === 'pending') {
                  content += `[Pending...]\n`;
                }

                if (part.metadata && Object.keys(part.metadata).length > 0) {
                  content += `Metadata: ${JSON.stringify(part.metadata, null, 2)}\n`;
                }
              } else if (part.type === 'reasoning') {
                const reasoningText = part.text || part.content || '';
                content = `\n[Thinking]\n${reasoningText}\n`;
              } else if (part.type === 'step-start') {
                content = `\n[Step Started]\n`;
              } else if (part.type === 'step-finish') {
                content = `\n[Step Finished]\n`;
                if (part.cost !== undefined) {
                  content += `Cost: ${part.cost}\n`;
                }
                if (part.tokens) {
                  content += `Tokens - Input: ${part.tokens.input}, Output: ${part.tokens.output}, Reasoning: ${part.tokens.reasoning}\n`;
                  if (part.tokens.cache) {
                    content += `Cache - Read: ${part.tokens.cache.read}, Write: ${part.tokens.cache.write}\n`;
                  }
                }
              } else if (part.type === 'file') {
                const filename = part.filename || 'unknown';
                const fileUrl = part.url || '';
                const fileType = part.mime || '';

                content = `\n[File Operation]\n`;
                content += `File: ${filename}\n`;
                content += `Type: ${fileType}\n`;
                if (fileUrl) {
                  content += `URL: ${fileUrl}\n`;
                }
              } else if (part.type === 'snapshot') {
                content = `\n[Snapshot Created]\n`;
                if (part.snapshot) {
                  content += `Snapshot ID: ${part.snapshot.substring(0, 8)}...\n`;
                }
              } else if (part.type === 'patch') {
                content = `\n[Code Patch]\n`;
                if (part.hash) {
                  content += `Hash: ${part.hash}\n`;
                }
                if (part.files && part.files.length > 0) {
                  content += `Files modified: ${part.files.join(', ')}\n`;
                }
              }

              if (content) {
                console.log(`[OpenCode] ✅ Part received: ${part.type} (${content.length} chars)`);
                callbacks.onChunk(content);
              } else {
                console.log(`[OpenCode] ⚠️ Empty content for part type: ${part.type}`);
              }
            }

            // Handle message.updated - completion signal
            else if (eventType === 'message.updated') {
              const messageInfo = eventProps.info || eventProps;
              const role = messageInfo?.role;
              const finish = messageInfo?.finish;

              console.log('[OpenCode] message.updated - role:', role, 'finish:', finish);

              // Only complete when assistant message has finish=stop
              if (role === 'assistant' && finish === 'stop') {
                console.log('[OpenCode] ✓ Message completed (finish=stop)');
                isCompleted = true;
                abortController.abort();
                callbacks.onComplete();
                return;
              }
            }

            // Handle session status changes
            else if (eventType === 'session.status') {
              const status = eventProps.status?.type;
              console.log('[OpenCode] Session status:', status);
              if (status === 'idle' && hasReceivedParts) {
                console.log('[OpenCode] ✓ Session idle, completing');
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

            let eventType = event.type;
            let eventProps = event.properties || {};
            if (!eventType && event.payload) {
              eventType = event.payload.type;
              eventProps = event.payload.properties || event.payload;
            }

            const eventSessionId = eventProps.sessionID || event.sessionID;

            if (eventSessionId === currentSessionId && eventType === 'message.updated') {
              const finish = eventProps.info?.finish;
              if (finish === 'stop') {
                console.log('[OpenCode] ✓ Completion detected in remaining buffer');
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

      // Wait a bit for stream to be ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Now send the message
      console.log('[OpenCode] Sending message to session...');
      console.log('[OpenCode] Message content length:', combinedText.length);

      // Use provided model config or default
      const model = modelConfig || {
        providerID: 'anthropic',
        modelID: 'claude-3-5-sonnet-20241022',
      };

      console.log('[OpenCode] Using model:', model.providerID, '/', model.modelID);

      const messageBody: any = {
        model: {
          providerID: model.providerID,
          modelID: model.modelID,
        },
        parts: [{ type: 'text', text: combinedText }],
      };

      // Add agent if specified
      if (model.agent || modelConfig?.agent) {
        messageBody.agent = model.agent || modelConfig?.agent;
        console.log('[OpenCode] Using agent:', messageBody.agent);
      }

      const messageResp = await fetch(`${BASE_URL}/session/${currentSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify(messageBody),
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
