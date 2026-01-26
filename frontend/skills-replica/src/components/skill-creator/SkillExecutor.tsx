import { useState, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, Upload, FileCode, Terminal as TerminalIcon } from 'lucide-react';
import type { Skill } from '../../types/skill-creator';
import { Terminal } from '../common/Terminal';
import { getWebContainerInstance } from '../../lib/webcontainer';
import { WebContainer } from '@webcontainer/api';
import { runAgentStep, type AgentContext, executeToolCall } from '../../lib/agent';
import Anthropic from '@anthropic-ai/sdk';

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

  // Agent State
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');
  const [anthropicMessages, setAnthropicMessages] = useState<Anthropic.MessageParam[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'chat' | 'terminal' | 'files'>('chat');
  const [files, setFiles] = useState<string[]>([]);

  // Boot WebContainer
  useEffect(() => {
    const boot = async () => {
      try {
        const instance = await getWebContainerInstance();
        setWebContainer(instance);
        refreshFiles(instance);
      } catch (e) {
        console.error("Failed to boot WebContainer", e);
      }
    };
    boot();
  }, []);

  // Initialize Chat with Skill Context
  useEffect(() => {
    // When skill opens, we can pre-seed the context or prompt if needed
    // For now, we just wait for user input
  }, [skill]);

  const refreshFiles = async (wc: WebContainer) => {
    try {
      const fileList = await wc.fs.readdir('.');
      setFiles(fileList);
    } catch (e) {
      console.error("Error listing files", e);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('anthropic_api_key', key);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !webContainer) return;

    setIsExecuting(true); // Show loading state during upload
    try {
      for (const file of e.target.files) {
        const content = await file.arrayBuffer(); // WebContainer writes binary as Uint8Array usually
        await webContainer.fs.writeFile(file.name, new Uint8Array(content));
        setMessages(prev => [...prev, { role: 'assistant', content: `Uploaded file: ${file.name}` }]);
      }
      await refreshFiles(webContainer);
    } catch (err: any) {
      setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: `Upload failed: ${err.message}` }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecute = async () => {
    if (!input.trim() || !apiKey || !webContainer) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev: Message[]) => [...prev, userMsg]);
    setInput('');
    setIsExecuting(true);
    setActiveTab('chat'); // Switch to chat to see progress

    // Construct history: System Prompt (from skill) + History + New Input
    // Note: System Prompt is handled in runAgentStep, but we can augment it with Skill info if we modify runAgentStep
    // For now, we'll append Skill Context to the first user message or just rely on generic agent

    // Removed unused skillContext variable

    // If it's the first message, prefix with skill context? 
    // Actually, let's just push the raw input, but maybe hint the agent about the skill in the system prompt.
    // implementation_plan said we'd use generic agent logic, so let's stick to that but maybe prepend context

    const effectiveInput = anthropicMessages.length === 0
      ? `[Skill Context: ${skill.name} - ${skill.description}]\n${input}`
      : input;

    const newHistory: Anthropic.MessageParam[] = [...anthropicMessages, { role: 'user', content: effectiveInput }];
    setAnthropicMessages(newHistory);

    try {
      const context: AgentContext = {
        webContainer,
        apiKey,
        onLog: (_msg: string) => { } // Logs go to terminal automatically via pipe
      };

      let currentHistory = newHistory;

      let response = await runAgentStep(currentHistory, context);

      while (response.stop_reason === 'tool_use') {
        const toolUseContent = response.content.find((c: any) => c.type === 'tool_use');
        if (toolUseContent && toolUseContent.type === 'tool_use') {
          const assistantMsg: Anthropic.MessageParam = { role: 'assistant', content: response.content };
          currentHistory = [...currentHistory, assistantMsg];

          setMessages((prev: Message[]) => [...prev, { role: 'assistant', content: `Executing: ${toolUseContent.name}...` }]);
          setActiveTab('terminal'); // Auto-switch to terminal for tool output? Optional.

          const toolResult = await executeToolCall(toolUseContent, context);

          // Refresh files if filesystem changed
          if (['write_to_file', 'run_command'].includes(toolUseContent.name)) {
            refreshFiles(webContainer);
          }

          currentHistory = [...currentHistory, { role: 'user', content: [toolResult] }];
          response = await runAgentStep(currentHistory, context);
        } else {
          break;
        }
      }

      const textContent = response.content.find((c: any) => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        const assistantMsg: Message = { role: 'assistant', content: textContent.text };
        setMessages((prev: Message[]) => [...prev, assistantMsg]);
        setAnthropicMessages([...currentHistory, { role: 'assistant', content: response.content }]);
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
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
      <div className="bg-white rounded-xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl shadow-sm">
              {skill.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{skill.name}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                {webContainer ? <span className="text-green-600 flex items-center gap-1">● Environment Ready</span> : <span className="text-amber-600 flex items-center gap-1">● Booting Environment...</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="password"
              placeholder="Anthropic API Key"
              className="bg-white text-xs p-2 rounded border border-gray-300 focus:border-pink-500 outline-none w-48 shadow-sm"
              value={apiKey}
              onChange={handleApiKeyChange}
            />
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content - Split Config */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Chat & Input */}
          <div className={`w-1/2 flex flex-col border-r border-gray-200 transition-all ${activeTab !== 'chat' ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="text-center mt-20 opacity-50">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 text-pink-400" />
                  <p>Enter your API Key and start the task.</p>
                  <p className="text-sm mt-2">You can upload files or just ask questions.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-3 rounded-lg text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                  </div>
                </div>
              ))}
              {isExecuting && <div className="text-gray-500 text-xs flex items-center gap-2 p-2"><Loader2 className="w-3 h-3 animate-spin" /> Agent is working...</div>}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="What should the agent do?"
                  rows={3}
                  disabled={!webContainer || !apiKey || isExecuting}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none bg-gray-50 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || !input.trim() || !apiKey}
                  className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-pink-600 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                  <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                </label>
                <span className="text-xs text-gray-400">Cmd + Enter to send</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Terminal & Files */}
          <div className={`w-1/2 flex flex-col bg-[#0f0f10] ${activeTab !== 'terminal' && activeTab !== 'files' ? 'hidden md:flex' : 'flex'}`}>
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-4 py-2 text-xs font-medium flex items-center gap-2 ${activeTab === 'terminal' ? 'text-white border-b-2 border-pink-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <TerminalIcon className="w-3 h-3" /> Terminal
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-4 py-2 text-xs font-medium flex items-center gap-2 ${activeTab === 'files' ? 'text-white border-b-2 border-pink-500 bg-gray-900' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <FileCode className="w-3 h-3" /> Files ({files.length})
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <div className={`absolute inset-0 ${activeTab === 'terminal' || activeTab === 'chat' ? 'block' : 'hidden'}`}>
                {webContainer ? <Terminal webContainer={webContainer} /> : <div className="text-gray-600 p-4 text-sm font-mono">Terminal Waiting...</div>}
                    </div>
              <div className={`absolute inset-0 p-4 overflow-y-auto ${activeTab === 'files' ? 'block' : 'hidden'}`}>
                {files.length === 0 ? (
                  <div className="text-gray-600 text-sm italic">No files in virtual system.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {files.map(f => (
                      <div key={f} className="p-2 bg-gray-900 rounded border border-gray-800 text-gray-300 text-xs font-mono flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        {f}
                                  </div>
                                ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
