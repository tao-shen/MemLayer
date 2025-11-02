import React, { useState } from 'react';
import { mockMemories, mockRelationships, Memory } from './data/mockData';
import { TimelineView } from './components/TimelineView';
import { GraphView } from './components/GraphView';
import { ListView } from './components/ListView';
import { StatisticsView } from './components/StatisticsView';
import { MemoryDetailPanel } from './components/MemoryDetailPanel';

type ViewType = 'timeline' | 'graph' | 'list' | 'statistics';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('timeline');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // 过滤记忆
  const filteredMemories = filterType === 'all'
    ? mockMemories
    : mockMemories.filter(m => m.type === filterType);

  const viewTabs: { id: ViewType; label: string; icon: string }[] = [
    { id: 'timeline', label: '时间线', icon: '📅' },
    { id: 'graph', label: '关系图谱', icon: '🕸️' },
    { id: 'list', label: '列表视图', icon: '📋' },
    { id: 'statistics', label: '统计分析', icon: '📊' },
  ];

  const typeFilters = [
    { id: 'all', label: '全部', color: '#6B7280' },
    { id: 'stm', label: '短期记忆', color: '#3B82F6' },
    { id: 'episodic', label: '情景记忆', color: '#10B981' },
    { id: 'semantic', label: '语义记忆', color: '#F59E0B' },
    { id: 'reflection', label: '反思记忆', color: '#8B5CF6' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">记忆可视化 Demo</h1>
              <p className="text-sm text-gray-500 mt-1">
                Agent Memory Platform - 全类型记忆可视化展示
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">总记忆数:</span>
              <span className="text-2xl font-bold text-gray-900">{filteredMemories.length}</span>
            </div>
          </div>
        </div>

        {/* 视图切换标签 */}
        <div className="px-6 flex items-center justify-between border-t border-gray-200">
          <nav className="flex space-x-8">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${
                    currentView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* 类型过滤器 */}
          <div className="flex items-center gap-2 py-2">
            <span className="text-sm text-gray-500">过滤:</span>
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${
                    filterType === filter.id
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
                style={{
                  backgroundColor: filterType === filter.id ? filter.color : undefined,
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'timeline' && (
          <TimelineView
            memories={filteredMemories}
            onMemoryClick={setSelectedMemory}
          />
        )}
        {currentView === 'graph' && (
          <GraphView
            memories={filteredMemories}
            relationships={mockRelationships}
            onMemoryClick={setSelectedMemory}
          />
        )}
        {currentView === 'list' && (
          <ListView
            memories={filteredMemories}
            onMemoryClick={setSelectedMemory}
          />
        )}
        {currentView === 'statistics' && (
          <StatisticsView memories={filteredMemories} />
        )}
      </main>

      {/* 详情面板 */}
      <MemoryDetailPanel
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />

      {/* 底部信息栏 */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            当前视图: <span className="font-medium text-gray-900">{viewTabs.find(t => t.id === currentView)?.label}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>短期记忆 ({mockMemories.filter(m => m.type === 'stm').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>情景记忆 ({mockMemories.filter(m => m.type === 'episodic').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>语义记忆 ({mockMemories.filter(m => m.type === 'semantic').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>反思记忆 ({mockMemories.filter(m => m.type === 'reflection').length})</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
