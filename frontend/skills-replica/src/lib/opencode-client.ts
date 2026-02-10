import { createOpencodeClient } from '@opencode-ai/sdk/client';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENCODE_SERVER_URL =
  import.meta.env.VITE_OPENCODE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://nngpveejjssh.eu-central-1.clawcloudrun.com';

// ---------------------------------------------------------------------------
// Types – mirrors the OpenCode SDK part types
// ---------------------------------------------------------------------------

export interface TextPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'text';
  text: string;
}

export interface ToolPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'tool';
  tool: string;
  callID: string;
  state: 'pending' | 'running' | 'completed' | 'error';
  metadata?: Record<string, unknown>;
}

export interface ReasoningPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'reasoning';
  text: string;
}

export interface StepStartPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'step-start';
  snapshot?: string;
}

export interface StepFinishPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'step-finish';
  reason: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
}

export interface FilePart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'file';
  mime: string;
  filename?: string;
  url: string;
}

export interface SnapshotPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'snapshot';
  snapshot: string;
}

export interface PatchPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: 'patch';
  hash: string;
  files: string[];
}

export type Part =
  | TextPart
  | ToolPart
  | ReasoningPart
  | StepStartPart
  | StepFinishPart
  | FilePart
  | SnapshotPart
  | PatchPart;

export interface ModelConfig {
  providerID: string;
  modelID: string;
}

export interface SessionInfo {
  id: string;
  title: string;
  time: { created: number; updated: number };
}

export interface TodoItem {
  id: string;
  content: string;
  status: string;
  priority: string;
}

// ---------------------------------------------------------------------------
// Stream callbacks
// ---------------------------------------------------------------------------

export interface StreamCallbacks {
  onPartUpdated: (part: Part, delta?: string) => void;
  onMessageUpdated: (message: Record<string, unknown>) => void;
  onSessionStatus: (status: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
  onPermission?: (permission: Record<string, unknown>) => void;
  onTodos?: (todos: TodoItem[]) => void;
}

// ---------------------------------------------------------------------------
// OpenCode Client
// ---------------------------------------------------------------------------

class OpenCodeClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private abortController: AbortController | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = OPENCODE_SERVER_URL) {
    this.baseUrl = baseUrl;
  }

  get connected(): boolean {
    return this.client !== null;
  }

  // ── Connect ─────────────────────────────────────────────────────────────

  async connect(baseUrl?: string): Promise<{ version: string }> {
    const url = baseUrl || this.baseUrl;
    this.client = createOpencodeClient({ baseUrl: url });

    // Verify with a health check
    const health = await this.client.global.health();
    const version = health?.data?.version ?? health?.version ?? 'unknown';
    console.log('[OpenCode] Connected to', url, '– version', version);
    return { version };
  }

  // ── Sessions ────────────────────────────────────────────────────────────

  async createSession(title: string): Promise<SessionInfo> {
    this.ensureClient();
    const resp = await this.client.session.create({ body: { title } });
    const session = resp?.data ?? resp;
    return {
      id: session.id,
      title: session.title ?? title,
      time: session.time ?? { created: Date.now(), updated: Date.now() },
    };
  }

  async listSessions(): Promise<SessionInfo[]> {
    this.ensureClient();
    const resp = await this.client.session.list();
    const list = resp?.data ?? resp ?? [];
    return (Array.isArray(list) ? list : []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      title: (s.title as string) ?? '',
      time: (s.time as { created: number; updated: number }) ?? { created: 0, updated: 0 },
    }));
  }

  async deleteSession(id: string): Promise<void> {
    this.ensureClient();
    await this.client.session.delete({ path: { id } });
  }

  async abortSession(id: string): Promise<void> {
    this.ensureClient();
    await this.client.session.abort({ path: { id } });
  }

  // ── Providers / Models ──────────────────────────────────────────────────

  async getProviders(): Promise<unknown> {
    this.ensureClient();
    const resp = await this.client.config.providers();
    return resp?.data ?? resp;
  }

  // ── Send message with streaming ─────────────────────────────────────────

  async sendMessage(
    sessionId: string,
    text: string,
    callbacks: StreamCallbacks,
    options?: {
      model?: ModelConfig;
      system?: string;
    }
  ): Promise<void> {
    this.ensureClient();

    // Clean up any prior stream
    this.cleanup();
    this.abortController = new AbortController();
    const ac = this.abortController;

    let isCompleted = false;
    let hasReceivedParts = false;

    // 1. Subscribe to the global event stream BEFORE sending the prompt
    const subscription = await this.client.event.subscribe();
    // The SDK may expose `subscription.stream` (async iterable) or be iterable directly
    const eventStream = subscription?.stream ?? subscription;

    const processEvents = async () => {
      try {
        for await (const event of eventStream) {
          if (ac.signal.aborted) break;

          const eventType: string = event.type ?? event?.payload?.type;
          const props: Record<string, unknown> =
            event.properties ?? event?.payload?.properties ?? event?.payload ?? {};

          // Filter: only process events for our session
          const evtSid =
            (props.sessionID as string) ??
            ((props.info as Record<string, unknown>)?.sessionID as string) ??
            ((props.part as Record<string, unknown>)?.sessionID as string);

          if (evtSid && evtSid !== sessionId) continue;

          switch (eventType) {
            // ── Part updates ────────────────────────────────────────────
            case 'message.part.updated': {
              const part = props.part as Part | undefined;
              if (!part) break;
              hasReceivedParts = true;
              callbacks.onPartUpdated(part, props.delta as string | undefined);
              break;
            }

            // ── Message lifecycle ───────────────────────────────────────
            case 'message.updated': {
              const info = (props.info ?? props) as Record<string, unknown>;
              callbacks.onMessageUpdated(info);
              if (info.role === 'assistant' && info.finish === 'stop') {
                isCompleted = true;
                ac.abort();
                try { subscription?.controller?.abort(); } catch { /* ignore */ }
                callbacks.onComplete();
                return;
              }
              break;
            }

            // ── Session status ──────────────────────────────────────────
            case 'session.status': {
              const statusObj = props.status as Record<string, unknown> | string | undefined;
              const status = typeof statusObj === 'string' ? statusObj : (statusObj?.type as string) ?? '';
              callbacks.onSessionStatus(status);
              if (status === 'idle' && hasReceivedParts) {
                isCompleted = true;
                ac.abort();
                try { subscription?.controller?.abort(); } catch { /* ignore */ }
                callbacks.onComplete();
                return;
              }
              break;
            }

            // ── Permission requests ─────────────────────────────────────
            case 'permission.updated': {
              callbacks.onPermission?.(props);
              break;
            }

            // ── Todos ───────────────────────────────────────────────────
            case 'todo.updated': {
              callbacks.onTodos?.(props.todos as TodoItem[]);
              break;
            }
          }
        }

        // Stream ended naturally
        if (!isCompleted) {
          if (hasReceivedParts) {
            callbacks.onComplete();
          } else {
            callbacks.onError('Event stream ended without receiving any parts');
          }
        }
      } catch (err: unknown) {
        const e = err as Error;
        if (e.name === 'AbortError' || ac.signal.aborted) return;
        console.error('[OpenCode] Event processing error:', e);
        callbacks.onError(e.message ?? 'Unknown stream error');
      }
    };

    // Start processing events in the background
    processEvents();

    // Small delay to ensure the event listener is active
    await new Promise((r) => setTimeout(r, 200));

    // 2. Send the prompt
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: Record<string, any> = {
        parts: [{ type: 'text', text }],
      };
      if (options?.model) {
        body.model = { providerID: options.model.providerID, modelID: options.model.modelID };
      }
      if (options?.system) {
        body.system = options.system;
      }

      await this.client.session.prompt({
        path: { id: sessionId },
        body,
      });
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name !== 'AbortError' && !ac.signal.aborted) {
        console.error('[OpenCode] Prompt send error:', e);
        callbacks.onError(`Failed to send message: ${e.message}`);
      }
    }

    // 3. Safety timeout (5 minutes)
    setTimeout(() => {
      if (!ac.signal.aborted && !isCompleted) {
        ac.abort();
        try { subscription?.controller?.abort(); } catch { /* ignore */ }
        if (hasReceivedParts) {
          callbacks.onComplete();
        } else {
          callbacks.onError('Timeout: no response received after 5 minutes');
        }
      }
    }, 300_000);
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────

  cleanup(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private ensureClient(): void {
    if (!this.client) {
      throw new Error('OpenCode client is not connected. Call connect() first.');
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const opencode = new OpenCodeClient();
