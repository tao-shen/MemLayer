import React from 'react';
import { Memory } from '../data/mockData';

interface MemoryDetailPanelProps {
  memory: Memory | null;
  onClose: () => void;
}

const typeColors = {
  stm: '#3B82F6',
  episodic: '#10B981',
  semantic: '#F59E0B',
  reflection: '#8B5CF6',
};

const typeNames = {
  stm: '短期记忆 (STM)',
  episodic: '情景记忆 (Episodic)',
  semantic: '语义记忆 (Semantic)',
  reflection: '反思记忆 (Reflection)',
};

export const MemoryDetailPanel: React.FC<MemoryDetailPanelProps> = ({ memory, onClose }) => {
  if (!memory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* 头部 */}
        <div
          className="p-6 text-white"
          style={{ backgroundColor: typeColors[memory.type] }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{typeNames[memory.type]}</h2>
              <p className="text-sm opacity-90">ID: {memory.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">基本信息</h3>
            <div className="space-y-2">
              <div className="flex">
                <span className="text-sm font-medium text-gray-500 w-24">内容:</span>
                <span className="text-sm text-gray-900 flex-1">{memory.content}</span>
              </div>
              <div className="flex">
                <span className="text-sm font-medium text-gray-500 w-24">时间:</span>
                <span className="text-sm text-gray-900">
                  {memory.timestamp.toLocaleString('zh-CN')}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-24">重要性:</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-sm ${
                          i < memory.importance ? 'bg-yellow-400' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-900">{memory.importance}/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* 类型特定信息 */}
          {memory.type === 'stm' && memory.sessionId && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">短期记忆信息</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">会话ID:</span>
                  <span className="ml-2 text-gray-900">{memory.sessionId}</span>
                </div>
              </div>
            </div>
          )}

          {memory.type === 'episodic' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">情景记忆信息</h3>
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                {memory.eventType && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">事件类型:</span>
                    <span className="ml-2 text-gray-900">{memory.eventType}</span>
                  </div>
                )}
                {memory.accessCount !== undefined && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">访问次数:</span>
                    <span className="ml-2 text-gray-900">{memory.accessCount} 次</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {memory.type === 'semantic' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">语义记忆信息</h3>
              <div className="bg-amber-50 p-4 rounded-lg space-y-2">
                {memory.source && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">来源:</span>
                    <span className="ml-2 text-gray-900">{memory.source}</span>
                  </div>
                )}
                {memory.category && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">分类:</span>
                    <span className="ml-2 text-gray-900">{memory.category}</span>
                  </div>
                )}
                {memory.verified !== undefined && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">验证状态:</span>
                    <span className={`ml-2 ${memory.verified ? 'text-green-600' : 'text-red-600'}`}>
                      {memory.verified ? '✓ 已验证' : '✗ 未验证'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {memory.type === 'reflection' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">反思记忆信息</h3>
              <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                {memory.insights && memory.insights.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">洞察:</div>
                    <ul className="space-y-1">
                      {memory.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-900 flex items-start">
                          <span className="text-purple-500 mr-2">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {memory.sourceMemoryIds && memory.sourceMemoryIds.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      源记忆 ({memory.sourceMemoryIds.length} 个):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {memory.sourceMemoryIds.map((id) => (
                        <span
                          key={id}
                          className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded"
                        >
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 元数据 */}
          {memory.metadata && Object.keys(memory.metadata).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">元数据</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(memory.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
