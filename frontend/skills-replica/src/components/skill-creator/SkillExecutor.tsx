import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Settings,
  Square,
  Circle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Brain,
  FileText,
  GitBranch,
  Camera,
  ListTodo,
  Trash2,
  Plus,
  MessageSquare,
} from 'lucide-react';
import type { Skill } from '../../types/skill-creator';
import {
  opencode,
  fetchSkillMd,
  type Part,
  type TextPart,
  type ToolPart,
  type ReasoningPart,
  type StepFinishPart,
  type FilePart,
  type PatchPart,
  type ModelConfig,
  type ProviderModel,
  type TodoItem,
  type SessionInfo,
} from '../../lib/opencode-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserEntry {
  type: 'user';
  text: string;
  time: number;
}

interface AssistantEntry {
  type: 'assistant';
  messageId: string;
  parts: Part[];
  isComplete: boolean;
  cost?: number;
  tokens?: { input: number; output: number; reasoning: number };
}

type ChatEntry = UserEntry | AssistantEntry;

interface SkillExecutorProps {
  skill: Skill;
  onClose: () => void;
}

function mapRawPartToPart(
  raw: Record<string, unknown>,
  sessionId: string,
  messageId: string
): Part {
  return {
    id: (raw.id as string) ?? `part-${Date.now()}-${Math.random()}`,
    sessionID: sessionId,
    messageID: messageId,
    type: (raw.type as string) ?? 'text',
    ...(raw.type === 'text' ? { text: (raw.text as string) ?? '' } : {}),
    ...(raw.type === 'reasoning' ? { reasoning: (raw.reasoning as string) ?? '' } : {}),
    ...(raw.type === 'tool-invocation'
      ? {
          toolName: (raw.toolName as string) ?? '',
          args: raw.args,
          result: raw.result,
          state: (raw.state as string) ?? 'completed',
        }
      : {}),
  } as Part;
}

function mapSessionMessagesToEntries(messages: Record<string, unknown>[], sessionId: string): ChatEntry[] {
  const loaded: ChatEntry[] = [];
  for (const msg of messages) {
    const role = msg.role as string;
    if (role === 'user') {
      const parts = msg.parts as Record<string, unknown>[] | undefined;
      const text =
        parts
          ?.filter((p) => p.type === 'text')
          .map((p) => (p as { text?: string }).text ?? '')
          .join('\n') || '';
      if (text) {
        loaded.push({
          type: 'user',
          text,
          time: (msg.time as { created?: number })?.created ?? Date.now(),
        });
      }
    } else if (role === 'assistant') {
      const messageId = (msg.id as string) ?? `msg-${Date.now()}`;
      const rawParts = msg.parts as Record<string, unknown>[] | undefined;
      const chatParts: Part[] = (rawParts ?? []).map((p) => mapRawPartToPart(p, sessionId, messageId));
      loaded.push({
        type: 'assistant',
        messageId,
        parts: chatParts,
        isComplete: true,
        cost: msg.cost as number | undefined,
        tokens: msg.tokens as AssistantEntry['tokens'] | undefined,
      });
    }
  }
  return loaded;
}

// ---------------------------------------------------------------------------
// Sub-components for rendering parts
// ---------------------------------------------------------------------------

function ToolStateIcon({ state }: { state: string }) {
  switch (state) {
    case 'completed':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'running':
      return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
  }
}

function ToolPartView({ part }: { part: ToolPart }) {
  const [expanded, setExpanded] = useState(false);
  const meta = part.metadata ?? {};
  const title = (meta.title as string) ?? '';
  const input = meta.input ? JSON.stringify(meta.input, null, 2) : '';
  const output = (meta.output as string) ?? '';
  const error = (meta.error as string) ?? '';

  return (
    <div className="my-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700/30 transition-colors"
      >
        <ToolStateIcon state={part.state} />
        <Wrench className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-sm font-medium text-zinc-200 truncate">
          {part.tool}
        </span>
        {title && (
          <span className="text-xs text-zinc-400 truncate ml-1">{title}</span>
        )}
        <span className="ml-auto text-xs text-zinc-500 capitalize">{part.state}</span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-zinc-700/40">
          {input && (
            <div className="mt-2">
              <p className="text-xs text-zinc-500 mb-1">Input</p>
              <pre className="text-xs text-zinc-300 bg-zinc-900/60 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto">
                {input}
              </pre>
            </div>
          )}
          {output && (
            <div>
              <p className="text-xs text-zinc-500 mb-1">Output</p>
              <pre className="text-xs text-zinc-300 bg-zinc-900/60 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto">
                {output}
              </pre>
            </div>
          )}
          {error && (
            <div>
              <p className="text-xs text-red-400 mb-1">Error</p>
              <pre className="text-xs text-red-300 bg-red-900/20 rounded p-2 overflow-x-auto">
                {error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReasoningPartView({ part }: { part: ReasoningPart }) {
  const [expanded, setExpanded] = useState(false);
  if (!part.text) return null;
  return (
    <div className="my-2 rounded-lg border border-purple-800/40 bg-purple-900/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-800/10 transition-colors"
      >
        <Brain className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-sm text-purple-300">Thinking...</span>
        <span className="ml-auto text-xs text-purple-500">
          {part.text.length} chars
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-purple-500 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-purple-800/30">
          <pre className="mt-2 text-xs text-purple-200/80 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {part.text}
          </pre>
        </div>
      )}
    </div>
  );
}

function TextPartView({ part }: { part: TextPart }) {
  if (!part.text) return null;
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-pre:bg-zinc-900/80 prose-pre:border prose-pre:border-zinc-700/50
      prose-code:text-emerald-300 prose-code:bg-zinc-800/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
      prose-a:text-blue-400 prose-headings:text-zinc-100"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
    </div>
  );
}

function FilePartView({ part }: { part: FilePart }) {
  return (
    <div className="my-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 text-sm">
      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      <span className="text-zinc-200">{part.filename ?? 'File'}</span>
      <span className="text-xs text-zinc-500">{part.mime}</span>
    </div>
  );
}

function PatchPartView({ part }: { part: PatchPart }) {
  return (
    <div className="my-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-800/40 bg-amber-900/10 text-sm">
      <GitBranch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="text-amber-200">Patch applied</span>
      {part.files?.length > 0 && (
        <span className="text-xs text-amber-400/70">
          {part.files.join(', ')}
        </span>
      )}
    </div>
  );
}

function StepFinishView({ part }: { part: StepFinishPart }) {
  return (
    <div className="my-1 flex items-center gap-3 px-3 py-1 text-xs text-zinc-500">
      <div className="h-px flex-1 bg-zinc-700/50" />
      <span>
        Step done
        {part.tokens && (
          <> · {part.tokens.input + part.tokens.output} tokens</>
        )}
        {typeof part.cost === 'number' && part.cost > 0 && (
          <> · ${part.cost.toFixed(4)}</>
        )}
      </span>
      <div className="h-px flex-1 bg-zinc-700/50" />
    </div>
  );
}

function SnapshotView() {
  return (
    <div className="my-1 flex items-center gap-2 px-3 py-1 text-xs text-zinc-500">
      <Camera className="w-3 h-3" />
      <span>Snapshot created</span>
    </div>
  );
}

// Render one part based on its type
function PartRenderer({ part }: { part: Part }) {
  switch (part.type) {
    case 'text':
      return <TextPartView part={part as TextPart} />;
    case 'tool':
      return <ToolPartView part={part as ToolPart} />;
    case 'reasoning':
      return <ReasoningPartView part={part as ReasoningPart} />;
    case 'step-start':
      return null; // We show step-finish instead
    case 'step-finish':
      return <StepFinishView part={part as StepFinishPart} />;
    case 'file':
      return <FilePartView part={part as FilePart} />;
    case 'patch':
      return <PatchPartView part={part as PatchPart} />;
    case 'snapshot':
      return <SnapshotView />;
    default:
      return null;
  }
}

// Render the assistant's response as an ordered list of parts
function AssistantMessageView({ entry }: { entry: AssistantEntry }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] w-full">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium text-zinc-400">Agent</span>
          {!entry.isComplete && (
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          )}
        </div>
        <div className="pl-7">
          {entry.parts.map((part, i) => (
            <PartRenderer key={part.id || `part-${i}`} part={part} />
          ))}
          {!entry.isComplete && entry.parts.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Thinking...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// User message bubble
function UserMessageView({ entry }: { entry: UserEntry }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-blue-600 text-white text-sm whitespace-pre-wrap">
        {entry.text}
      </div>
    </div>
  );
}

// Todos sidebar display
function TodosView({ todos }: { todos: TodoItem[] }) {
  if (!todos.length) return null;
  return (
    <div className="px-3 py-2 border-b border-zinc-700/50">
      <div className="flex items-center gap-2 mb-2">
        <ListTodo className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Tasks</span>
      </div>
      <div className="space-y-1">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-2 text-xs">
            {todo.status === 'completed' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : todo.status === 'in_progress' ? (
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />
            ) : (
              <Circle className="w-3 h-3 text-zinc-500 shrink-0" />
            )}
            <span className={todo.status === 'completed' ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
              {todo.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session sidebar
// ---------------------------------------------------------------------------

function SessionSidebar({
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
}: {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-56 border-r border-zinc-700/50 flex flex-col bg-zinc-900/60 shrink-0">
      <div className="p-3 border-b border-zinc-700/50 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Sessions</span>
        <button
          onClick={onNew}
          className="p-1 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="New session"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <p className="p-3 text-xs text-zinc-500">No sessions yet</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
              s.id === currentSessionId
                ? 'bg-zinc-700/40 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
            onClick={() => onSelect(s.id)}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs truncate flex-1">{s.title || 'Untitled'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-600/50 transition-all"
              title="Delete session"
            >
              <Trash2 className="w-3 h-3 text-zinc-500 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SkillExecutor({ skill, onClose }: SkillExecutorProps) {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [serverVersion, setServerVersion] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Session state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(true);

  // Chat state
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Model state – fetched from the server
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Skill loading state
  const [skillInstructions, setSkillInstructions] = useState<string | null>(null);
  const [skillLoadStatus, setSkillLoadStatus] = useState<'loading' | 'loaded' | 'error' | 'idle'>('idle');
  const [showSkillBanner, setShowSkillBanner] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Connect on mount ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { version } = await opencode.connect();
        if (cancelled) return;
        setConnected(true);
        setServerVersion(version);

        // Load existing sessions
        try {
          const list = await opencode.listSessions();
          if (!cancelled) setSessions(list);
        } catch {
          // Not critical if listing fails
        }

        // Fetch available models from the server
        try {
          const { models: serverModels, defaultModel } =
            await opencode.getModels();
          if (!cancelled && serverModels.length > 0) {
            setModels(serverModels);
            setSelectedModel(defaultModel ?? {
              providerID: serverModels[0].providerID,
              modelID: serverModels[0].modelID,
            });
          }
        } catch {
          // Not critical – user just can't pick models
        }

        // Fetch SKILL.md for this skill (if available)
        const mdUrl = skill.skillMdUrl;
        if (mdUrl) {
          if (!cancelled) setSkillLoadStatus('loading');
          try {
            const parsed = await fetchSkillMd(mdUrl);
            if (!cancelled) {
              setSkillInstructions(parsed.instructions);
              setSkillLoadStatus('loaded');
            }
          } catch (err) {
            console.warn('[SkillExecutor] Failed to fetch SKILL.md:', err);
            if (!cancelled) {
              // Fall back to config.systemPrompt or description
              const fallback = skill.config.systemPrompt || skill.description;
              setSkillInstructions(fallback || null);
              setSkillLoadStatus(fallback ? 'loaded' : 'error');
            }
          }
        } else {
          // No SKILL.md URL — use config.systemPrompt or description
          const fallback = skill.config.systemPrompt || skill.description;
          if (!cancelled) {
            setSkillInstructions(fallback || null);
            setSkillLoadStatus(fallback ? 'loaded' : 'idle');
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setConnectionError((err as Error).message);
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();
    return () => {
      cancelled = true;
      opencode.cleanup();
    };
  }, [skill]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  // ── Close model picker on outside click ─────────────────────────────────

  useEffect(() => {
    if (!showModelPicker) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.model-picker')) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelPicker]);

  // ── Create a new session ────────────────────────────────────────────────

  const createNewSession = useCallback(async () => {
    try {
      const session = await opencode.createSession(skill.name);
      setSessions((prev) => [session, ...prev]);
      setCurrentSessionId(session.id);
      setEntries([]);
      setTodos([]);
      return session.id;
    } catch (err: unknown) {
      setConnectionError(`Failed to create session: ${(err as Error).message}`);
      return null;
    }
  }, [skill.name]);

  // ── Switch session ──────────────────────────────────────────────────────

  const switchSession = useCallback(async (id: string) => {
    if (isRunning) return;
    setCurrentSessionId(id);
    setEntries([]);
    setTodos([]);

    // Load message history from the server
    try {
      const session = await opencode.getSession(id);
      const messages = session.messages as Record<string, unknown>[] | undefined;
      if (!messages || !Array.isArray(messages) || messages.length === 0) return;
      const loaded = mapSessionMessagesToEntries(messages, id);
      if (loaded.length > 0) {
        setEntries(loaded);
      }
    } catch (err) {
      console.warn('[SkillExecutor] Failed to load session messages:', err);
    }
  }, [isRunning]);

  // ── Delete session ──────────────────────────────────────────────────────

  const deleteSession = useCallback(async (id: string) => {
    try {
      await opencode.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setEntries([]);
        setTodos([]);
      }
    } catch {
      // ignore
    }
  }, [currentSessionId]);

  // ── Send message ────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isRunning || !connected) return;

    setInput('');
    setIsRunning(true);
    setConnectionError(null);

    // Ensure we have a session
    let sid = currentSessionId;
    if (!sid) {
      sid = await createNewSession();
      if (!sid) {
        setIsRunning(false);
        return;
      }
    }

    // Add user entry
    const userEntry: UserEntry = { type: 'user', text, time: Date.now() };
    setEntries((prev) => [...prev, userEntry]);

    // Stream callbacks — with timestamp logging to diagnose real-time issues
    const cbT0 = performance.now();
    const cbTs = () => `+${(performance.now() - cbT0).toFixed(0)}ms`;
    let partUpdateCount = 0;

    const callbacks = {
      onPartUpdated: (part: Part, delta?: string) => {
        partUpdateCount++;
        const textSnippet =
          part.type === 'text'
            ? `"${(part as TextPart).text?.slice(0, 80)}…"`
            : part.type;
        console.log(
          `[SkillExec] ${cbTs()} onPartUpdated #${partUpdateCount}: type=${part.type}, ` +
          `delta=${delta ? delta.length + 'ch' : 'none'}, id=${part.id}, preview=${textSnippet}`
        );

        setEntries((prev) => {
          // Find existing assistant entry for this messageID
          const idx = prev.findIndex(
            (e) => e.type === 'assistant' && e.messageId === part.messageID
          );

          if (idx >= 0) {
            // Update existing entry
            const entry = prev[idx] as AssistantEntry;
            const partIdx = entry.parts.findIndex((p) => p.id === part.id);

            let newParts: Part[];
            if (partIdx >= 0) {
              // Update existing part
              newParts = [...entry.parts];
              if (part.type === 'text') {
                if (delta) {
                  // Server sent an incremental delta – append it
                  newParts[partIdx] = {
                    ...newParts[partIdx],
                    text: ((newParts[partIdx] as TextPart).text || '') + delta,
                  } as TextPart;
                } else {
                  // Server sent the full accumulated text – use it directly
                  newParts[partIdx] = { ...part };
                }
              } else {
                newParts[partIdx] = { ...newParts[partIdx], ...part };
              }
            } else {
              // Add new part
              newParts = [...entry.parts, { ...part }];
            }

            const newEntries = [...prev];
            newEntries[idx] = { ...entry, parts: newParts };
            return newEntries;
          } else {
            // Create new assistant entry
            console.log(`[SkillExec] ${cbTs()} creating new assistant entry for messageId=${part.messageID}`);
            const newEntry: AssistantEntry = {
              type: 'assistant',
              messageId: part.messageID,
              parts: [{ ...part }],
              isComplete: false,
            };
            return [...prev, newEntry];
          }
        });
      },

      onMessageUpdated: (message: Record<string, unknown>) => {
        console.log(
          `[SkillExec] ${cbTs()} onMessageUpdated: role=${message.role}, finish=${message.finish}, id=${message.id}`
        );
        if (message.role === 'assistant') {
          setEntries((prev) =>
            prev.map((e) => {
              if (e.type !== 'assistant') return e;
              const aEntry = e as AssistantEntry;
              if (aEntry.messageId === message.id) {
                return {
                  ...aEntry,
                  isComplete: message.finish === 'stop',
                  cost: (message.cost as number) ?? aEntry.cost,
                  tokens: (message.tokens as AssistantEntry['tokens']) ?? aEntry.tokens,
                };
              }
              return e;
            })
          );
        }
      },

      onSessionStatus: (status: string) => {
        console.log(`[SkillExec] ${cbTs()} onSessionStatus: "${status}"`);
        setSessionStatus(status);
      },

      onComplete: () => {
        console.log(`[SkillExec] ${cbTs()} onComplete (total part updates: ${partUpdateCount})`);
        setIsRunning(false);
        setSessionStatus('idle');
        // Mark all incomplete assistant entries as complete
        setEntries((prev) =>
          prev.map((e) =>
            e.type === 'assistant' && !e.isComplete ? { ...e, isComplete: true } : e
          )
        );
      },

      onError: (error: string) => {
        console.error(`[SkillExec] ${cbTs()} onError: ${error}`);
        setIsRunning(false);
        setConnectionError(error);
        // Add error as a text part in the current assistant message
        setEntries((prev) => {
          const last = prev[prev.length - 1];
          if (last?.type === 'assistant' && !last.isComplete) {
            const errorPart: TextPart = {
              id: `error-${Date.now()}`,
              sessionID: sid!,
              messageID: last.messageId,
              type: 'text',
              text: `\n\n**Error:** ${error}`,
            };
            return [
              ...prev.slice(0, -1),
              { ...last, parts: [...last.parts, errorPart], isComplete: true },
            ];
          }
          // Add standalone error entry
          return [
            ...prev,
            {
              type: 'assistant' as const,
              messageId: `error-${Date.now()}`,
              parts: [{
                id: `error-${Date.now()}`,
                sessionID: sid!,
                messageID: `error-${Date.now()}`,
                type: 'text' as const,
                text: `**Error:** ${error}`,
              }],
              isComplete: true,
            },
          ];
        });
      },

      onTodos: (newTodos: TodoItem[]) => {
        setTodos(newTodos);
      },
    };

    // Poll fallback: when SSE is proxy-buffered, pull snapshots periodically so
    // the UI still progresses between bursty chunks.
    let polling = true;
    let pollingInFlight = false;
    const pollFromSessionSnapshot = async () => {
      if (!polling || pollingInFlight) return;
      pollingInFlight = true;
      try {
        const snapshot = await opencode.getSession(sid!);
        const messages = snapshot.messages as Record<string, unknown>[] | undefined;
        if (!messages || !Array.isArray(messages) || messages.length === 0) return;

        const assistantMsgs = messages.filter((m) => m.role === 'assistant');
        const latest = assistantMsgs[assistantMsgs.length - 1];
        if (!latest) return;

        const messageId = (latest.id as string) ?? '';
        if (!messageId) return;
        const rawParts = latest.parts as Record<string, unknown>[] | undefined;
        const snapshotParts = (rawParts ?? []).map((p) => mapRawPartToPart(p, sid!, messageId));

        setEntries((prev) => {
          const idx = prev.findIndex((e) => e.type === 'assistant' && e.messageId === messageId);
          if (idx >= 0) {
            const current = prev[idx] as AssistantEntry;
            const currentTextSize = current.parts
              .filter((p) => p.type === 'text')
              .map((p) => (p as TextPart).text || '')
              .join('').length;
            const snapshotTextSize = snapshotParts
              .filter((p) => p.type === 'text')
              .map((p) => (p as TextPart).text || '')
              .join('').length;

            if (snapshotParts.length <= current.parts.length && snapshotTextSize <= currentTextSize) {
              return prev;
            }

            const next = [...prev];
            next[idx] = { ...current, parts: snapshotParts };
            return next;
          }

          const nextAssistant: AssistantEntry = {
            type: 'assistant',
            messageId,
            parts: snapshotParts,
            isComplete: false,
            cost: latest.cost as number | undefined,
            tokens: latest.tokens as AssistantEntry['tokens'] | undefined,
          };
          return [...prev, nextAssistant];
        });
      } catch {
        // snapshot polling is best-effort
      } finally {
        pollingInFlight = false;
      }
    };

    const pollTimer = window.setInterval(() => {
      void pollFromSessionSnapshot();
    }, 1200);

    try {
      await opencode.sendMessage(sid, text, callbacks, {
        model: selectedModel ?? undefined,
        system: skillInstructions || skill.config.systemPrompt || undefined,
      });
    } finally {
      polling = false;
      window.clearInterval(pollTimer);
    }
  }, [input, isRunning, connected, currentSessionId, createNewSession, selectedModel, skillInstructions, skill.config.systemPrompt]);

  // ── Abort ───────────────────────────────────────────────────────────────

  const handleAbort = useCallback(async () => {
    opencode.cleanup();
    if (currentSessionId) {
      try {
        await opencode.abortSession(currentSessionId);
      } catch {
        // ignore
      }
    }
    setIsRunning(false);
    setEntries((prev) =>
      prev.map((e) =>
        e.type === 'assistant' && !e.isComplete ? { ...e, isComplete: true } : e
      )
    );
  }, [currentSessionId]);

  // ── Keyboard ────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  // Connection screen
  if (connecting) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-zinc-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center border border-zinc-700/50">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Connecting to OpenCode</h3>
          <p className="text-sm text-zinc-400">Establishing connection to server...</p>
        </div>
      </div>
    );
  }

  if (connectionError && !connected) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-zinc-700/50">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Connection Failed</h3>
          <p className="text-sm text-red-300 mb-4">{connectionError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setConnecting(true);
                setConnectionError(null);
                opencode.connect()
                  .then(({ version }) => {
                    setConnected(true);
                    setServerVersion(version);
                  })
                  .catch((err) => setConnectionError((err as Error).message))
                  .finally(() => setConnecting(false));
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 text-zinc-200 text-sm rounded-lg hover:bg-zinc-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-7xl h-[90vh] mx-4 overflow-hidden flex flex-col border border-zinc-700/50 shadow-2xl">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50 bg-zinc-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xl shadow-sm">
              {skill.icon}
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{skill.name}</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Connected
                </span>
                {serverVersion && (
                  <span className="text-zinc-500">v{serverVersion}</span>
                )}
                {sessionStatus && sessionStatus !== 'idle' && (
                  <span className="text-blue-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {sessionStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sessions toggle (mobile) */}
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Toggle sessions"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Model picker */}
            <div className="relative model-picker">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border border-zinc-600 rounded-lg hover:bg-zinc-700/50 text-zinc-300 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {selectedModel
                    ? models.find(
                        (m) =>
                          m.providerID === selectedModel.providerID &&
                          m.modelID === selectedModel.modelID
                      )?.name ?? selectedModel.modelID
                    : 'Select model'}
                </span>
              </button>
              {showModelPicker && (
                <div className="absolute right-0 mt-2 w-72 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-zinc-700 bg-zinc-700/30">
                    <p className="text-xs font-medium text-zinc-400">Select Model</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {models.length === 0 && (
                      <p className="px-3 py-2 text-xs text-zinc-500">
                        No models available
                      </p>
                    )}
                    {/* Group by provider */}
                    {Array.from(new Set(models.map((m) => m.providerID))).map(
                      (pid) => (
                        <div key={pid}>
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/40">
                            {models.find((m) => m.providerID === pid)
                              ?.providerName ?? pid}
                          </div>
                          {models
                            .filter((m) => m.providerID === pid)
                            .map((model) => {
                              const isSelected =
                                selectedModel?.providerID ===
                                  model.providerID &&
                                selectedModel?.modelID === model.modelID;
                              return (
                                <button
                                  key={`${model.providerID}/${model.modelID}`}
                                  onClick={() => {
                                    setSelectedModel({
                                      providerID: model.providerID,
                                      modelID: model.modelID,
                                    });
                                    setShowModelPicker(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700/50 transition-colors flex items-center gap-2 ${
                                    isSelected
                                      ? 'bg-blue-600/20 text-blue-300 font-medium'
                                      : 'text-zinc-300'
                                  }`}
                                >
                                  <span className="truncate flex-1">
                                    {model.name}
                                  </span>
                                  {model.reasoning && (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-purple-800/40 text-purple-300">
                                      reasoning
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Session sidebar */}
          {showSessions && (
            <SessionSidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelect={switchSession}
              onNew={async () => { await createNewSession(); }}
              onDelete={deleteSession}
            />
          )}

          {/* Main chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Todos bar */}
            <TodosView todos={todos} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Skill loaded banner */}
              {showSkillBanner && skillLoadStatus !== 'idle' && (
                <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
                  skillLoadStatus === 'loaded'
                    ? 'bg-emerald-900/20 border-emerald-800/40 text-emerald-300'
                    : skillLoadStatus === 'loading'
                      ? 'bg-blue-900/20 border-blue-800/40 text-blue-300'
                      : 'bg-amber-900/20 border-amber-800/40 text-amber-300'
                }`}>
                  {skillLoadStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                  ) : skillLoadStatus === 'loaded' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">
                      {skillLoadStatus === 'loading'
                        ? `Loading ${skill.name} skill...`
                        : skillLoadStatus === 'loaded'
                          ? `${skill.name} skill loaded`
                          : `Could not load ${skill.name} SKILL.md`}
                    </span>
                    {skillLoadStatus === 'loaded' && skillInstructions && (
                      <p className="text-xs opacity-70 mt-1 line-clamp-2">
                        {skillInstructions.slice(0, 200)}
                        {skillInstructions.length > 200 && '...'}
                      </p>
                    )}
                  </div>
                  {skillLoadStatus !== 'loading' && (
                    <button
                      onClick={() => setShowSkillBanner(false)}
                      className="p-0.5 rounded hover:bg-white/10 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {connectionError && connected && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {connectionError}
                </div>
              )}

              {entries.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-200 mb-1">
                    Ready to run {skill.name}
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-md">
                    {skillLoadStatus === 'loaded'
                      ? 'Skill instructions loaded. Type a message to start working with this skill.'
                      : 'Type a message to start the agent. It will use OpenCode on the server to execute tasks with full tool access.'}
                  </p>
                </div>
              )}

              {entries.map((entry, i) =>
                entry.type === 'user' ? (
                  <UserMessageView key={`user-${i}`} entry={entry} />
                ) : (
                  <AssistantMessageView key={entry.messageId} entry={entry} />
                )
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ─────────────────────────────────────────── */}
            <div className="px-4 py-3 border-t border-zinc-700/50 bg-zinc-800/30 shrink-0">
              <div className="relative max-w-4xl mx-auto">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What should the agent do?"
                  rows={2}
                  disabled={isRunning || !connected}
                  className="w-full pl-4 pr-24 py-3 bg-zinc-800 border border-zinc-600 rounded-xl
                    text-sm text-zinc-100 placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                    resize-none disabled:opacity-50 transition-colors"
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {isRunning ? (
                    <button
                      onClick={handleAbort}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                      title="Stop agent"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || !connected}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500
                        disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
                      title="Send (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center mt-1.5 px-1 max-w-4xl mx-auto">
                <span className="text-[10px] text-zinc-500">
                  Enter to send · Shift+Enter for new line
                </span>
                {isRunning && (
                  <span className="text-[10px] text-blue-400 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Agent is working...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
