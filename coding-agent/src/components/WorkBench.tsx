import { useState, useEffect, useRef } from 'react';
import { Terminal } from './Terminal';
import { getWebContainerInstance } from '../lib/webcontainer';
import { WebContainer } from '@webcontainer/api';
import { runAgentStep, AgentContext, executeToolCall } from '../lib/agent';
import Anthropic from '@anthropic-ai/sdk';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const WorkBench = () => {
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Anthropic message history
    const [anthropicMessages, setAnthropicMessages] = useState<Anthropic.MessageParam[]>([]);

    useEffect(() => {
        const boot = async () => {
            const instance = await getWebContainerInstance();
            setWebContainer(instance);
        };
        boot();
    }, []);

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const key = e.target.value;
        setApiKey(key);
        localStorage.setItem('anthropic_api_key', key);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length || !webContainer) return;

        const file = e.target.files[0];
        const content = await file.text();
        const path = file.name;

        try {
            await webContainer.fs.writeFile(path, content);
            const msg = `Uploaded file: ${path}`;
            console.log(msg);
            setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
            // Inform the agent that a file is available
            const systemNote: Anthropic.MessageParam = { role: 'user', content: `[System] User uploaded file '${path}'. It is available in the current directory.` };
            setAnthropicMessages(prev => [...prev, systemNote]);
        } catch (err: any) {
            console.error('Upload failed', err);
            setMessages(prev => [...prev, { role: 'assistant', content: `Failed to upload ${path}: ${err.message}` }]);
        }
    };

    // Simple Skill Injection
    const runSkill = (skillPrompt: string) => {
        if (!input && !skillPrompt) return;
        const msg = skillPrompt || input;

        // Treating skill prompt as a user message for now, but prepended with context
        handleSend(msg);
    };

    const handleSend = async (manualInput?: string) => {
        const textToSend = manualInput || input;
        if (!textToSend.trim() || !apiKey || !webContainer) return;

        const userMsg: Message = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const newHistory: Anthropic.MessageParam[] = [...anthropicMessages, { role: 'user', content: textToSend }];
        setAnthropicMessages(newHistory);

        try {
            const context: AgentContext = {
                webContainer,
                apiKey,
                onLog: (msg) => console.log('Terminal Output:', msg) // Could stream to UI log
            };

            let currentHistory = newHistory;
            
            // Initial call
            let response = await runAgentStep(currentHistory, context);
            
            // Loop for tool calls
            while (response.stop_reason === 'tool_use') {
                 const toolUseContent = response.content.find(c => c.type === 'tool_use');
                 if (toolUseContent && toolUseContent.type === 'tool_use') {
                    // Add assistant response with tool use to history
                    const assistantMsg: Anthropic.MessageParam = { role: 'assistant', content: response.content };
                    currentHistory = [...currentHistory, assistantMsg];
                    
                    setMessages(prev => [...prev, { role: 'assistant', content: `Executing tool: ${toolUseContent.name}...` }]);

                    // Execute tool
                    const toolResult = await executeToolCall(toolUseContent, context);
                    
                    // Add tool result to history
                    currentHistory = [...currentHistory, { role: 'user', content: [toolResult] }];
                    
                    // Get next response
                    response = await runAgentStep(currentHistory, context);
                 } else {
                     break;
                 }
            }

            // Final response (text)
            const textContent = response.content.find(c => c.type === 'text');
            if (textContent && textContent.type === 'text') {
                const assistantMsg: Message = { role: 'assistant', content: textContent.text };
                setMessages(prev => [...prev, assistantMsg]);
                setAnthropicMessages([...currentHistory, { role: 'assistant', content: response.content }]);
            }

        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    if (!webContainer) {
        return <div className="flex items-center justify-center h-screen text-white text-xl">Booting WebContainer...</div>;
    }

    return (
        <div className="flex h-screen w-screen bg-[#1e1e1e] text-white overflow-hidden font-sans">
            <div className="w-1/3 border-r border-[#333] flex flex-col bg-[#252526]">
                <div className="p-4 border-b border-[#333] font-bold flex justify-between items-center">
                    <span>Chat</span>
                    <input 
                        type="password" 
                        placeholder="Anthropic API Key" 
                        className="bg-[#3c3c3c] text-xs p-1 rounded w-32 focus:w-48 transition-all border border-[#333] focus:border-blue-500 outline-none"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                    />
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.length === 0 && <div className="text-gray-500 text-sm text-center mt-10">Welcome! Enter your API key and start coding.</div>}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600' : 'bg-[#3c3c3c]'}`}>
                                <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                            </div>
                        </div>
                    ))}
                    {loading && <div className="text-gray-500 text-xs animate-pulse">Thinking...</div>}
                </div>
                <div className="p-4 border-t border-[#333] bg-[#252526]">
                    <input 
                        type="text" 
                        className="w-full bg-[#3c3c3c] p-2 rounded text-white border border-[#333] focus:outline-none focus:border-blue-500 text-sm placeholder-gray-500" 
                        placeholder={apiKey ? "Ask me to create a file or run code..." : "Please enter API Key above first"}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading || !apiKey}
                    />
                    <div className="flex justify-between mt-2 text-xs">
                        <div className="flex gap-2">
                            <button
                                className="text-gray-400 hover:text-white flex items-center gap-1"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span>📄 Upload File</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                        <div className="text-gray-500">
                            {/* Placeholder for Skills UI */}
                            <span>✨ Skills (Drop SKILL.md here soon)</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-2/3 flex flex-col bg-[#1e1e1e]">
                <div className="h-1/2 border-b border-[#333] relative">
                     {/* Editor Placeholder - Monaco would go here */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 select-none">
                        <span className="text-4xl mb-2">Editor</span>
                        <span className="text-sm">File viewing coming soon</span>
                    </div>
                </div>
                <div className="h-1/2 p-0 bg-black overflow-hidden relative">
                     {/* Terminal Label */}
                     <div className="absolute top-2 right-4 z-10 text-xs text-gray-500 font-mono pointer-events-none">Terminal</div>
                    <Terminal webContainer={webContainer} />
                </div>
            </div>
        </div>
    );
};
