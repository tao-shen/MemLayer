import { createOpencodeClient } from '@opencode-ai/sdk/client';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENCODE_SERVER_URL =
  import.meta.env.VITE_OPENCODE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://tao-shen-opencode.hf.space';

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

export interface ProviderModel {
  providerID: string;
  modelID: string;
  name: string;
  providerName: string;
  reasoning: boolean;
  toolcall: boolean;
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

    // Create the SDK client
    this.client = createOpencodeClient({ baseUrl: url });

    // Verify connectivity with a health check (SDK v1 has no global.health())
    try {
      const resp = await fetch(`${url}/global/health`);
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data = await resp.json();
      const version = data?.version ?? 'unknown';
      console.log('[OpenCode] Connected to', url, '– version', version);
      return { version };
    } catch (err: unknown) {
      this.client = null;
      throw new Error(
        `Cannot reach OpenCode server at ${url}: ${(err as Error).message}`
      );
    }
  }

  // ── Sessions ────────────────────────────────────────────────────────────

  async createSession(title: string): Promise<SessionInfo> {
    this.ensureClient();
    const result = await this.client.session.create({ body: { title } });
    const session = result?.data ?? result;
    if (!session?.id) {
      throw new Error('Failed to create session: no ID returned');
    }
    return {
      id: session.id,
      title: session.title ?? title,
      time: session.time ?? { created: Date.now(), updated: Date.now() },
    };
  }

  async listSessions(): Promise<SessionInfo[]> {
    this.ensureClient();
    const result = await this.client.session.list();
    const list = result?.data ?? result ?? [];
    return (Array.isArray(list) ? list : []).map(
      (s: Record<string, unknown>) => ({
        id: s.id as string,
        title: (s.title as string) ?? '',
        time: (s.time as { created: number; updated: number }) ?? {
          created: 0,
          updated: 0,
        },
      })
    );
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

  async getModels(): Promise<{
    models: ProviderModel[];
    defaultModel: ModelConfig | null;
  }> {
    this.ensureClient();
    const result = await this.client.config.providers();
    const data = result?.data ?? result;

    const providers: Array<{
      id: string;
      name: string;
      models: Record<
        string,
        { id?: string; name?: string; capabilities?: Record<string, unknown> }
      >;
    }> = data?.providers ?? [];

    const defaultCfg = data?.default as Record<string, string> | undefined;

    const models: ProviderModel[] = [];
    for (const provider of providers) {
      if (!provider.models) continue;
      for (const [modelKey, model] of Object.entries(provider.models)) {
        models.push({
          providerID: provider.id,
          modelID: model.id ?? modelKey,
          name: model.name ?? modelKey,
          providerName: provider.name ?? provider.id,
          reasoning: !!(model.capabilities as Record<string, unknown>)
            ?.reasoning,
          toolcall: !!(model.capabilities as Record<string, unknown>)?.toolcall,
        });
      }
    }

    const defaultModel: ModelConfig | null =
      defaultCfg?.providerID && defaultCfg?.modelID
        ? { providerID: defaultCfg.providerID, modelID: defaultCfg.modelID }
        : models.length > 0
          ? { providerID: models[0].providerID, modelID: models[0].modelID }
          : null;

    return { models, defaultModel };
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

    // Track which message IDs are user vs assistant so we can filter echoes
    const userMessageIds = new Set<string>();
    const assistantMessageIds = new Set<string>();

    // 1. Subscribe to the global event stream BEFORE sending the prompt
    // Use global.event() — server exposes SSE at GET /global/event (not /event)
    const subscription = await this.client.global.event();
    const eventStream = subscription.stream;

    const processEvents = async () => {
      try {
        for await (const event of eventStream) {
          if (ac.signal.aborted) break;

          const eventType: string | undefined = event?.type;
          const props: Record<string, unknown> = event?.properties ?? {};

          if (!eventType) continue;

          // Filter: only process events for our session
          const evtSid =
            (props.sessionID as string) ??
            ((props.info as Record<string, unknown>)?.sessionID as string) ??
            ((props.part as Record<string, unknown>)?.sessionID as string);

          if (evtSid && evtSid !== sessionId) continue;

          switch (eventType) {
            // ── Message lifecycle ───────────────────────────────────────
            // IMPORTANT: process this BEFORE part updates so we know roles
            case 'message.updated': {
              const info = (props.info ?? props) as Record<string, unknown>;
              const msgId = info.id as string | undefined;
              const role = info.role as string | undefined;

              // Track message roles
              if (msgId && role === 'user') {
                userMessageIds.add(msgId);
              } else if (msgId && role === 'assistant') {
                assistantMessageIds.add(msgId);
              }

              // Only forward assistant messages to UI
              if (role === 'assistant') {
                callbacks.onMessageUpdated(info);
              }

              if (role === 'assistant' && info.finish === 'stop') {
                isCompleted = true;
                ac.abort();
                callbacks.onComplete();
                return;
              }
              break;
            }

            // ── Part updates ────────────────────────────────────────────
            case 'message.part.updated': {
              const part = props.part as Part | undefined;
              if (!part) break;

              // SKIP user message parts (the echo of what we sent)
              if (userMessageIds.has(part.messageID)) break;

              // If we haven't seen a message.updated for this messageID yet
              // but it's also not a user message, assume it's assistant
              hasReceivedParts = true;
              callbacks.onPartUpdated(
                part,
                props.delta as string | undefined
              );
              break;
            }

            // ── Session status ──────────────────────────────────────────
            case 'session.status': {
              const statusObj = props.status as
                | Record<string, unknown>
                | string
                | undefined;
              const status =
                typeof statusObj === 'string'
                  ? statusObj
                  : ((statusObj?.type as string) ?? '');
              callbacks.onSessionStatus(status);
              if (status === 'idle' && hasReceivedParts) {
                isCompleted = true;
                ac.abort();
                callbacks.onComplete();
                return;
              }
              break;
            }

            // ── Session idle ────────────────────────────────────────────
            case 'session.idle': {
              callbacks.onSessionStatus('idle');
              if (hasReceivedParts) {
                isCompleted = true;
                ac.abort();
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

            // ── Session errors ──────────────────────────────────────────
            case 'session.error': {
              const errInfo = props.error as
                | Record<string, unknown>
                | undefined;
              const errMsg =
                (errInfo?.message as string) ?? 'Unknown session error';
              callbacks.onError(errMsg);
              isCompleted = true;
              ac.abort();
              return;
            }
          }
        }

        // Stream ended naturally
        if (!isCompleted) {
          if (hasReceivedParts) {
            callbacks.onComplete();
          } else {
            callbacks.onError(
              'Event stream ended without receiving any response'
            );
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

    // 2. Send the prompt via session.promptAsync() — returns immediately,
    //    the response streams back through the SSE events above.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: Record<string, any> = {
        parts: [{ type: 'text', text }],
      };
      if (options?.model) {
        body.model = {
          providerID: options.model.providerID,
          modelID: options.model.modelID,
        };
      }
      if (options?.system) {
        body.system = options.system;
      }

      await this.client.session.promptAsync({
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
      throw new Error(
        'OpenCode client is not connected. Call connect() first.'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Skill SKILL.md fetcher
// ---------------------------------------------------------------------------

export interface ParsedSkillMd {
  name: string;
  description: string;
  instructions: string;
}

export async function fetchSkillMd(url: string): Promise<ParsedSkillMd> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch SKILL.md: ${resp.status}`);
  const raw = await resp.text();

  // Parse YAML front-matter (--- ... ---)
  let name = '';
  let description = '';
  let body = raw;

  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (fmMatch) {
    const fm = fmMatch[1];
    body = fmMatch[2].trim();
    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    const descMatch = fm.match(/^description:\s*(.+)$/m);
    if (nameMatch) name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
    if (descMatch) description = descMatch[1].trim().replace(/^["']|["']$/g, '');
  }

  return { name, description, instructions: body };
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const opencode = new OpenCodeClient();
