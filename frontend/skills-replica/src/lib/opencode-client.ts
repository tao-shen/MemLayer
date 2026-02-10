import { createOpencodeClient } from '@opencode-ai/sdk/client';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENCODE_SERVER_URL =
  import.meta.env.VITE_OPENCODE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://tao-shen-opencode.hf.space';

const OPENCODE_USERNAME = import.meta.env.VITE_OPENCODE_USERNAME as
  | string
  | undefined;
const OPENCODE_PASSWORD = import.meta.env.VITE_OPENCODE_PASSWORD as
  | string
  | undefined;

function getBasicAuthHeader(): string | undefined {
  // Do NOT hardcode credentials in the repo. Pass via env vars.
  if (!OPENCODE_USERNAME || !OPENCODE_PASSWORD) return undefined;
  try {
    return `Basic ${btoa(`${OPENCODE_USERNAME}:${OPENCODE_PASSWORD}`)}`;
  } catch {
    return undefined;
  }
}

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

export interface QuestionEvent {
  id: string;
  title?: string;
  message?: string;
  options?: { label: string; value: string }[];
  type?: string;
  sessionID?: string;
}

export interface StreamCallbacks {
  onPartUpdated: (part: Part, delta?: string) => void;
  onMessageUpdated: (message: Record<string, unknown>) => void;
  onSessionStatus: (status: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
  onPermission?: (permission: Record<string, unknown>) => void;
  onTodos?: (todos: TodoItem[]) => void;
  onQuestion?: (question: QuestionEvent) => void;
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
    const auth = getBasicAuthHeader();
    this.client = createOpencodeClient({
      baseUrl: url,
      headers: auth ? { Authorization: auth } : undefined,
    });

    // Verify connectivity with a health check (SDK v1 has no global.health())
    try {
      const resp = await fetch(`${url}/global/health`, {
        headers: auth ? { Authorization: auth } : undefined,
      });
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

  /**
   * Fetch full session details (including messages) from the server.
   * Returns the raw session object from `/session/{id}`.
   */
  async getSession(id: string): Promise<Record<string, unknown>> {
    this.ensureClient();
    const result = await this.client.session.get({ path: { id } });
    return (result?.data ?? result) as Record<string, unknown>;
  }

  /**
   * Fetch message list for a session.
   * Primary path: `/session/{id}/message`, fallback: `/session/{id}`.
   * Normalized return is always an array of raw message objects.
   */
  async getSessionMessages(id: string): Promise<Record<string, unknown>[]> {
    this.ensureClient();

    // Preferred API for history
    try {
      const result = await this.client.session.messages({ path: { id } });
      const data = (result?.data ?? result) as unknown;
      const directList: unknown[] | null = Array.isArray(data) ? data : null;
      const nestedList: unknown[] | null =
        !directList && data && typeof data === 'object'
          ? ((() => {
              const candidate =
                (data as { messages?: unknown; items?: unknown; data?: unknown }).messages ??
                (data as { messages?: unknown; items?: unknown; data?: unknown }).items ??
                (data as { messages?: unknown; items?: unknown; data?: unknown }).data;
              return Array.isArray(candidate) ? candidate : null;
            })())
          : null;

      const normalized: unknown[] = directList ?? nestedList ?? [];

      if (normalized.length > 0) {
        return normalized as Record<string, unknown>[];
      }
      console.warn(`[OpenCode] getSessionMessages(${id}) returned empty list from /session/{id}/message`);
    } catch (err) {
      console.warn(`[OpenCode] getSessionMessages(${id}) failed on /session/{id}/message:`, err);
    }

    // Backward-compatible fallback
    const session = await this.getSession(id);
    const fallbackMessages = session.messages;
    return Array.isArray(fallbackMessages)
      ? (fallbackMessages as Record<string, unknown>[])
      : [];
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

  // ── Manual SSE reader (bypasses SDK for streaming reliability) ──────────

  private async *readSSE(
    url: string,
    signal: AbortSignal
  ): AsyncGenerator<{ event?: string; data: unknown }, void, unknown> {
    const auth = getBasicAuthHeader();
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    };
    if (auth) headers['Authorization'] = auth;

    console.log(`[OpenCode][SSE] Connecting to ${url} ...`);
    const t0 = performance.now();

    const response = await fetch(url, { headers, signal });
    console.log(
      `[OpenCode][SSE] Connected – status ${response.status} (${(performance.now() - t0).toFixed(0)}ms)`
    );

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('SSE response has no body');
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    let chunkIndex = 0;

    // Helper: yield control to the browser so React can render between events.
    // Without this, a large chunk (e.g. 14 KB / 80 events) would be processed
    // synchronously, React would batch all setState calls, and the UI would
    // only update AFTER the entire chunk is consumed.
    const yieldToUI = () => new Promise<void>((r) => setTimeout(r, 0));

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[OpenCode][SSE] Stream ended (done=true)');
          break;
        }

        chunkIndex++;
        const now = performance.now();
        console.log(
          `[OpenCode][SSE] chunk #${chunkIndex} received at +${(now - t0).toFixed(0)}ms, length=${value.length}`
        );

        buffer += value;
        // SSE events are separated by double newline
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        let eventsSinceYield = 0;

        for (const raw of parts) {
          if (!raw.trim()) continue;

          const lines = raw.split('\n');
          let eventName: string | undefined;
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trimStart());
            }
            // ignore id:, retry:, comments
          }

          if (dataLines.length === 0) continue;

          let data: unknown;
          const rawData = dataLines.join('\n');
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }

          console.log(
            `[OpenCode][SSE] EVENT at +${(performance.now() - t0).toFixed(0)}ms – event=${eventName ?? '(none)'}, ` +
            `type=${(data as Record<string, unknown>)?.type ?? '?'}`
          );

          yield { event: eventName, data };
          eventsSinceYield++;

          // Every 8 events, yield to the browser so React can flush pending
          // state updates and repaint.  Time-based thresholds don't work here
          // because 40+ events can be processed in < 5ms — too fast for the
          // 16ms frame budget to ever trigger.  Count-based yields ensure the
          // UI updates progressively even within a single large chunk.
          if (eventsSinceYield >= 8) {
            await yieldToUI();
            eventsSinceYield = 0;
          }
        }
      }
    } finally {
      try { reader.cancel(); } catch { /* noop */ }
    }
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

    const t0 = performance.now();
    const ts = () => `+${(performance.now() - t0).toFixed(0)}ms`;

    let isCompleted = false;
    let hasReceivedParts = false;

    // Track which message IDs are user vs assistant so we can filter echoes
    const userMessageIds = new Set<string>();

    // 1. Open manual SSE stream BEFORE sending the prompt.
    //    Try /event first (was working before), fall back to /global/event.
    const sseUrl = `${this.baseUrl}/event`;
    console.log(`[OpenCode] sendMessage() start, session=${sessionId}`);

    const processEvents = async () => {
      try {
        for await (const raw of this.readSSE(sseUrl, ac.signal)) {
          if (ac.signal.aborted) break;

          const event = raw.data as Record<string, unknown> | undefined;
          if (!event || typeof event !== 'object') {
            console.log(`[OpenCode] ${ts()} skip non-object event`);
            continue;
          }

          // Determine event type: could be in SSE event: line, or in data.type
          const eventType: string | undefined =
            (event.type as string | undefined) ?? raw.event;

          if (!eventType) {
            console.log(`[OpenCode] ${ts()} skip event without type, keys:`, Object.keys(event));
            continue;
          }

          const props: Record<string, unknown> =
            (event.properties as Record<string, unknown>) ?? {};

          // Filter: only process events for our session
          const evtSid =
            (props.sessionID as string) ??
            ((props.info as Record<string, unknown>)?.sessionID as string) ??
            ((props.part as Record<string, unknown>)?.sessionID as string);

          if (evtSid && evtSid !== sessionId) continue;

          console.log(`[OpenCode] ${ts()} process: ${eventType}${evtSid ? ' (our session)' : ''}`);

          switch (eventType) {
            // ── Message lifecycle ───────────────────────────────────────
            case 'message.updated': {
              const info = (props.info ?? props) as Record<string, unknown>;
              const msgId = info.id as string | undefined;
              const role = info.role as string | undefined;

              if (msgId && role === 'user') {
                userMessageIds.add(msgId);
              }

              if (role === 'assistant') {
                console.log(`[OpenCode] ${ts()} → onMessageUpdated (finish=${info.finish})`);
                callbacks.onMessageUpdated(info);
              }

              if (role === 'assistant' && info.finish === 'stop') {
                console.log(`[OpenCode] ${ts()} ✓ assistant finished (stop)`);
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

              if (userMessageIds.has(part.messageID)) break;

              hasReceivedParts = true;
              const delta = props.delta as string | undefined;
              const textPreview =
                part.type === 'text'
                  ? (part as TextPart).text?.slice(0, 60)
                  : part.type;
              console.log(
                `[OpenCode] ${ts()} → onPartUpdated: type=${part.type}, id=${part.id}, ` +
                `delta=${delta ? delta.length + ' chars' : 'none'}, preview="${textPreview}"`
              );
              callbacks.onPartUpdated(part, delta);
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
              console.log(`[OpenCode] ${ts()} session.status → "${status}"`);
              callbacks.onSessionStatus(status);
              if (status === 'idle' && hasReceivedParts) {
                console.log(`[OpenCode] ${ts()} ✓ session idle after parts received`);
                isCompleted = true;
                ac.abort();
                callbacks.onComplete();
                return;
              }
              break;
            }

            case 'session.idle': {
              console.log(`[OpenCode] ${ts()} session.idle`);
              callbacks.onSessionStatus('idle');
              if (hasReceivedParts) {
                isCompleted = true;
                ac.abort();
                callbacks.onComplete();
                return;
              }
              break;
            }

            case 'permission.updated': {
              console.log(`[OpenCode] ${ts()} permission.updated`);
              callbacks.onPermission?.(props);
              break;
            }

            case 'todo.updated': {
              callbacks.onTodos?.(props.todos as TodoItem[]);
              break;
            }

            case 'question.asked': {
              console.log(`[OpenCode] ${ts()} question.asked – keys:`, Object.keys(props));
              const questionId = (props.id as string) ?? (event.id as string) ?? `q-${Date.now()}`;
              const question: QuestionEvent = {
                id: questionId,
                title: (props.title as string) ?? undefined,
                message: (props.message as string) ?? (props.text as string) ?? undefined,
                options: (props.options as QuestionEvent['options']) ?? undefined,
                type: (props.type as string) ?? 'question',
                sessionID: evtSid,
              };
              console.log(`[OpenCode] ${ts()} → onQuestion:`, JSON.stringify(question));
              callbacks.onQuestion?.(question);
              break;
            }

            case 'session.error': {
              const errInfo = props.error as Record<string, unknown> | undefined;
              const errMsg = (errInfo?.message as string) ?? 'Unknown session error';
              console.error(`[OpenCode] ${ts()} session.error: ${errMsg}`);
              callbacks.onError(errMsg);
              isCompleted = true;
              ac.abort();
              return;
            }

            default:
              console.log(`[OpenCode] ${ts()} unhandled event: ${eventType}`);
          }
        }

        // Stream ended naturally
        if (!isCompleted) {
          if (hasReceivedParts) {
            console.log(`[OpenCode] ${ts()} stream ended → onComplete`);
            callbacks.onComplete();
          } else {
            console.warn(`[OpenCode] ${ts()} stream ended without any parts`);
            callbacks.onError('Event stream ended without receiving any response');
          }
        }
      } catch (err: unknown) {
        const e = err as Error;
        if (e.name === 'AbortError' || ac.signal.aborted) {
          console.log(`[OpenCode] ${ts()} SSE aborted (expected)`);
          return;
        }
        console.error(`[OpenCode] ${ts()} Event processing error:`, e);
        callbacks.onError(e.message ?? 'Unknown stream error');
      }
    };

    // Start processing events in the background
    const eventPromise = processEvents();

    // Small delay to ensure the SSE connection is established
    await new Promise((r) => setTimeout(r, 300));

    // 2. Send the prompt via session.promptAsync() — returns immediately,
    //    the response streams back through the SSE events above.
    console.log(`[OpenCode] ${ts()} sending promptAsync...`);
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
      console.log(`[OpenCode] ${ts()} promptAsync returned`);
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name !== 'AbortError' && !ac.signal.aborted) {
        console.error(`[OpenCode] ${ts()} Prompt send error:`, e);
        callbacks.onError(`Failed to send message: ${e.message}`);
      }
    }

    // 3. Safety timeout (5 minutes)
    const timeoutId = setTimeout(() => {
      if (!ac.signal.aborted && !isCompleted) {
        console.warn(`[OpenCode] ${ts()} TIMEOUT after 5 minutes`);
        ac.abort();
        if (hasReceivedParts) {
          callbacks.onComplete();
        } else {
          callbacks.onError('Timeout: no response received after 5 minutes');
        }
      }
    }, 300_000);

    // Wait for event processing to finish, then clear timeout
    eventPromise.finally(() => clearTimeout(timeoutId));
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
