import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send, Loader2, Sparkles, FileCode, Terminal as TerminalIcon, Settings } from 'lucide-react';
import type { Skill } from '../../types/skill-creator';
import { opencodeService, type ModelConfig } from '../../lib/opencode-client';

const AVAILABLE_MODELS: Array<{ label: string; config: ModelConfig }> = [
  {
    label: 'Claude 3.5 Sonnet (推荐)',
    config: { providerID: 'anthropic', modelID: 'claude-3-5-sonnet-20241022' },
  },
  {
    label: 'Claude 3.7 Sonnet (最新)',
    config: { providerID: 'anthropic', modelID: 'claude-3-7-sonnet-20250219' },
  },
  {
    label: 'Claude 3 Opus',
    config: { providerID: 'anthropic', modelID: 'claude-3-opus-20240229' },
  },
  {
    label: 'Claude 3 Haiku',
    config: { providerID: 'anthropic', modelID: 'claude-3-haiku-20240307' },
  },
];

interface SkillExecutorProps {
  skill: Skill;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function SkillExecutor({ skill, onClose }: SkillExecutorProps) {
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'terminal' | 'files'>('chat');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('[SkillExecutor] Skill loaded:', skill.name);
    console.log(
      '[SkillExecutor] System prompt:',
      skill.config.systemPrompt?.substring(0, 100) + '...'
    );
  }, [skill]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, terminalOutput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModelSelector && !(event.target as Element).closest('.model-selector-container')) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelSelector]);

  const handleExecute = useCallback(async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev: Message[]) => [...prev, userMsg]);
    setInput('');
    setIsExecuting(true);
    setActiveTab('chat');
    setTerminalOutput([]);

    const assistantIndex = messages.length + 1;

    try {
      console.log('[SkillExecutor] Executing skill:', skill.id);

      const streamCallbacks = {
        onChunk: (chunk: string) => {
          setMessages((prev: Message[]) => {
            const newMessages = [...prev];
            if (newMessages[assistantIndex] && newMessages[assistantIndex].role === 'assistant') {
              newMessages[assistantIndex].content += chunk;
            } else {
              newMessages.push({
                role: 'assistant',
                content: chunk,
                isStreaming: true,
              });
            }
            return newMessages;
          });
          setTerminalOutput((prev) => [...prev, chunk]);
        },
        onComplete: () => {
          setMessages((prev: Message[]) => {
            const newMessages = [...prev];
            if (newMessages[assistantIndex]) {
              newMessages[assistantIndex].isStreaming = false;
            }
            return newMessages;
          });
          setIsExecuting(false);
          console.log('[SkillExecutor] Skill executed successfully');
        },
        onError: (error: string) => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Error: ${error}`, isStreaming: false },
          ]);
          setTerminalOutput((prev) => [...prev, `Error: ${error}`]);
          setIsExecuting(false);
          console.error('[SkillExecutor] Error:', error);
        },
      };

      const newSessionId = await opencodeService.executeSkillStream(
        skill.id,
        skill.config.systemPrompt || '',
        userMsg.content,
        streamCallbacks,
        sessionIdRef.current || undefined,
        AVAILABLE_MODELS[selectedModelIndex].config
      );

      if (newSessionId) {
        sessionIdRef.current = newSessionId;
      }
    } catch (error: any) {
      console.error('[SkillExecutor] Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message}`, isStreaming: false },
      ]);
      setTerminalOutput((prev) => [...prev, `Error: ${error.message}`]);
      setIsExecuting(false);
    }
  }, [input, skill, messages.length, selectedModelIndex]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleExecute();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-background rounded-xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-active flex items-center justify-center text-2xl shadow-sm">
              {skill.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{skill.name}</h2>
              <p className="text-sm text-foreground-secondary flex items-center gap-2">
                <span className="text-success flex items-center gap-1">● Online Mode</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative model-selector-container">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{AVAILABLE_MODELS[selectedModelIndex].label}</span>
              </button>
              {showModelSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-border bg-secondary/50">
                    <p className="text-xs font-medium text-foreground-secondary">选择模型</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {AVAILABLE_MODELS.map((model, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedModelIndex(index);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${
                          selectedModelIndex === index
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground'
                        }`}
                      >
                        {model.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-foreground-secondary hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div
            className={`w-full md:w-1/2 flex flex-col border-r border-border transition-all ${activeTab !== 'chat' ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-secondary/50">
              {messages.length === 0 && (
                <div className="text-center mt-20 opacity-50">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 text-primary" />
                  <p className="text-foreground">Ready to run skill via OpenCode.</p>
                  <p className="text-sm mt-2 text-foreground-secondary">Type a message to start.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-lg text-sm shadow-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                    {m.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-background border-t border-border">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="What should the agent do?"
                  rows={3}
                  disabled={isExecuting}
                  className="w-full pl-4 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background-secondary focus:bg-background transition-colors text-foreground"
                />
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || !input.trim()}
                  className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-primary to-primary-active text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-foreground-secondary">Cmd + Enter to send</span>
                {isExecuting && (
                  <span className="text-xs text-foreground-secondary flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Agent is working...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`w-full md:w-1/2 flex flex-col bg-background-tertiary ${activeTab !== 'terminal' && activeTab !== 'files' ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-4 py-2 text-xs font-medium flex items-center gap-2 ${activeTab === 'terminal' ? 'text-foreground border-b-2 border-primary bg-background-secondary' : 'text-foreground-secondary hover:text-foreground'}`}
              >
                <TerminalIcon className="w-3 h-3" /> Terminal
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-4 py-2 text-xs font-medium flex items-center gap-2 ${activeTab === 'files' ? 'text-foreground border-b-2 border-primary bg-background-secondary' : 'text-foreground-secondary hover:text-foreground'}`}
              >
                <FileCode className="w-3 h-3" /> Files
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {activeTab === 'terminal' && (
                <div className="absolute inset-0 overflow-auto p-4 font-mono text-xs text-foreground">
                  {terminalOutput.length === 0 ? (
                    <div className="text-foreground-secondary text-center mt-20">
                      Terminal output will appear here...
                    </div>
                  ) : (
                    terminalOutput.map((line, i) => (
                      <div key={i} className="py-0.5 break-words">
                        <span className="text-primary">$</span> {line}
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeTab === 'files' && (
                <div className="absolute inset-0 flex items-center justify-center text-foreground-secondary text-sm">
                  <div className="text-center p-8">
                    <p>File view is not available in simple mode.</p>
                    <p className="text-xs mt-2 opacity-70">Backend execution via OpenCode</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
