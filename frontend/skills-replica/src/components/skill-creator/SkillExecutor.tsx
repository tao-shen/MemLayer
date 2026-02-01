import { useState, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, FileCode, Terminal as TerminalIcon } from 'lucide-react';
import type { Skill } from '../../types/skill-creator';
import { opencodeService } from '../../lib/opencode-client';

interface SkillExecutorProps {
  skill: Skill;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function SkillExecutor({ skill, onClose }: SkillExecutorProps) {
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'terminal' | 'files'>('chat');

  useEffect(() => {
    console.log('[SkillExecutor] Skill loaded:', skill.name);
    console.log(
      '[SkillExecutor] System prompt:',
      skill.config.systemPrompt?.substring(0, 100) + '...'
    );
  }, [skill]);

  const handleExecute = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev: Message[]) => [...prev, userMsg]);
    setInput('');
    setIsExecuting(true);
    setActiveTab('chat');

    try {
      console.log('[SkillExecutor] Executing skill:', skill.id);

      const result = await opencodeService.executeSkill(
        skill.id,
        skill.config.systemPrompt || '',
        userMsg.content
      );

      if (result.success) {
        const assistantMsg: Message = {
          role: 'assistant',
          content: result.output || '(No output returned)',
        };
        setMessages((prev: Message[]) => [...prev, assistantMsg]);
        console.log('[SkillExecutor] Skill executed successfully');
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (error: any) {
      console.error('[SkillExecutor] Error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsExecuting(false);
    }
  };

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
                    className={`max-w-[90%] p-3 rounded-lg text-sm shadow-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}
                  >
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                  </div>
                </div>
              ))}
              {isExecuting && (
                <div className="text-foreground-secondary text-xs flex items-center gap-2 p-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Agent is working...
                </div>
              )}
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

            <div className="flex-1 relative overflow-hidden flex items-center justify-center text-foreground-secondary text-sm">
              <div className="text-center p-8">
                <p>Terminal output is not available in simple mode.</p>
                <p className="text-xs mt-2 opacity-70">Backend execution via OpenCode</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
