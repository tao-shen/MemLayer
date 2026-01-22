import React, { useState } from 'react';
import { Memory } from '../data/mockData';

interface ListViewProps {
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
}

const typeColors = {
  stm: '#3B82F6',
  episodic: '#10B981',
  semantic: '#F59E0B',
  reflection: '#8B5CF6',
};

const typeNames = {
  stm: '短期记忆',
  episodic: '情景记忆',
  semantic: '语义记忆',
  reflection: '反思记忆',
};

export const ListView: React.FC<ListViewProps> = ({ memories, onMemoryClick }) => {
  const [sortBy, setSortBy] = useState<'timestamp' | 'importance' | 'type'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedMemories = [...memories].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'timestamp':
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
        break;
      case 'importance':
        comparison = a.importance - b.importance;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 排序控制 */}
        <div className="bg-white rounded-lg shadow mb-4 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">排序:</span>
            <button
              onClick={() => handleSort('timestamp')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'timestamp'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              时间 {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('importance')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'importance'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              重要性 {sortBy === 'importance' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('type')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'type'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              类型 {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* 记忆列表 */}
        <div className="space-y-3">
          {sortedMemories.map((memory) => (
            <div
              key={memory.id}
              onClick={() => onMemoryClick(memory)}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4"
            >
              <div className="flex items-start gap-4">
                {/* 类型标识 */}
                <div
                  className="w-2 h-full rounded"
                  style={{ backgroundColor: typeColors[memory.type] }}
                />
                
                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: typeColors[memory.type] }}
                    >
                      {typeNames[memory.type]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {memory.timestamp.toLocaleString('zh-CN')}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-xs text-gray-500">重要性:</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-sm ${
                              i < memory.importance ? 'bg-yellow-400' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2">{memory.content}</p>
                  
                  {/* 额外信息 */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {memory.sessionId && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        会话: {memory.sessionId}
                      </span>
                    )}
                    {memory.eventType && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        事件: {memory.eventType}
                      </span>
                    )}
                    {memory.accessCount !== undefined && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        访问: {memory.accessCount}次
                      </span>
                    )}
                    {memory.category && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        分类: {memory.category}
                      </span>
                    )}
                    {memory.source && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        来源: {memory.source}
                      </span>
                    )}
                    {memory.insights && memory.insights.length > 0 && (
                      <span className="bg-purple-100 px-2 py-1 rounded text-purple-700">
                        {memory.insights.length} 个洞察
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
