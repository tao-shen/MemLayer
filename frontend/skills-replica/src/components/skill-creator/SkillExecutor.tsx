import { useState } from 'react';
import { X, Send, Loader2, Clock, Sparkles } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import type { Skill, ExecutionHistory } from '../../types/skill-creator';

interface SkillExecutorProps {
  skill: Skill;
  onClose: () => void;
}

export function SkillExecutor({ skill, onClose }: SkillExecutorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ExecutionHistory[]>([]);

  const handleExecute = async () => {
    if (!input.trim()) return;

    setIsExecuting(true);
    setError(null);
    setOutput(null);

    const startTime = Date.now();

    try {
      const result = await apiClient.executeSkill(skill.id, input);
      
      const duration = Date.now() - startTime;

      if (result.status === 'success') {
        setOutput(result.output);
        
        // Add to history
        setHistory([
          {
            id: result.id,
            input,
            output: result.output,
            timestamp: new Date(),
            duration,
          },
          ...history,
        ]);
      } else {
        setError(result.error || 'Execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl">
              {skill.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{skill.name}</h2>
              <p className="text-sm text-gray-500">{skill.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter your question or task..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Cmd/Ctrl + Enter to execute
            </p>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting || !input.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Execute Skill
              </>
            )}
          </button>

          {/* Output Section */}
          {(output || error) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output
              </label>
              {error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                    {output}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">Execution History</h3>
              </div>
              <div className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp.toLocaleTimeString('en-US')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.duration}ms
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">Input:</span> {item.input}
                      </p>
                      <p className="text-gray-800">
                        <span className="font-medium">Output:</span>{' '}
                        {item.output.slice(0, 100)}
                        {item.output.length > 100 && '...'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
