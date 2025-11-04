import React, { useState, useMemo } from 'react';
import D3TimelineChart from './D3TimelineChart';
import type { Memory } from '../types';
import { useVisualizationStore } from '../stores/visualizationStore';

interface MemoryTimelineProps {
  className?: string;
}

const MemoryTimeline: React.FC<MemoryTimelineProps> = ({ className = '' }) => {
  const { memories, filters, selectedMemory, selectMemory } = useVisualizationStore();
  const [timeRange, setTimeRange] = useState<'all' | 'day' | 'week' | 'month'>('all');

  // Filter memories based on time range
  const filteredMemories = useMemo(() => {
    let filtered = memories;

    if (timeRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeRange) {
        case 'day':
          cutoff.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(m => new Date(m.createdAt) >= cutoff);
    }

    return filtered;
  }, [memories, timeRange]);

  // Get highlighted memory IDs (selected + retrieved)
  const highlightedMemoryIds = useMemo(() => {
    const ids: string[] = [];
    if (selectedMemory) {
      ids.push(selectedMemory.id);
    }
    // Add retrieved memories if available
    return ids;
  }, [selectedMemory]);

  const handleMemoryClick = (memory: Memory) => {
    selectMemory(memory);
  };

  if (filteredMemories.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No memories</h3>
          <p className="mt-1 text-sm text-gray-500">
            No memories found for the selected time range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Time range filter */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Memory Timeline</h3>
        <div className="flex space-x-2">
          {(['all', 'day', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'all' ? 'All' : range === 'day' ? '24h' : range === 'week' ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline chart */}
      <div className="flex-1 p-4 overflow-hidden">
        <D3TimelineChart
          memories={filteredMemories}
          onMemoryClick={handleMemoryClick}
          highlightedMemoryIds={highlightedMemoryIds}
        />
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-6 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-semibold text-gray-900">{filteredMemories.length}</span>
          </div>
          <div>
            <span className="text-gray-500">STM:</span>
            <span className="ml-2 font-semibold text-blue-600">
              {filteredMemories.filter(m => m.type === 'stm').length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Episodic:</span>
            <span className="ml-2 font-semibold text-green-600">
              {filteredMemories.filter(m => m.type === 'episodic').length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Semantic:</span>
            <span className="ml-2 font-semibold text-orange-600">
              {filteredMemories.filter(m => m.type === 'semantic').length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Reflection:</span>
            <span className="ml-2 font-semibold text-purple-600">
              {filteredMemories.filter(m => m.type === 'reflection').length}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Click and drag to pan • Scroll to zoom
        </div>
      </div>
    </div>
  );
};

export default MemoryTimeline;
