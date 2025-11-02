import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { AggregatedMemory, MemoryType, SortField } from '../types';

interface ListViewProps {
  memories: AggregatedMemory[];
  onMemoryClick?: (memory: AggregatedMemory) => void;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  height?: number;
}

const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  stm: 'bg-blue-100 text-blue-800',
  episodic: 'bg-green-100 text-green-800',
  semantic: 'bg-amber-100 text-amber-800',
  reflection: 'bg-purple-100 text-purple-800',
};

const MEMORY_TYPE_ICONS: Record<MemoryType, string> = {
  stm: '⚡',
  episodic: '📅',
  semantic: '📚',
  reflection: '💡',
};

export const ListView: React.FC<ListViewProps> = ({
  memories,
  onMemoryClick,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  height = 600,
}) => {
  // Sort memories
  const sortedMemories = useMemo(() => {
    const sorted = [...memories];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case 'importance':
          aVal = a.importance || 0;
          bVal = b.importance || 0;
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'accessCount':
          aVal = a.accessCount || 0;
          bVal = b.accessCount || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [memories, sortBy, sortOrder]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const memory = sortedMemories[index];
    
    return (
      <div
        style={style}
        className="px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        onClick={() => onMemoryClick?.(memory)}
      >
        <div className="py-3 flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 text-2xl">
            {MEMORY_TYPE_ICONS[memory.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MEMORY_TYPE_COLORS[memory.type]}`}>
                {memory.type.toUpperCase()}
              </span>
              {memory.importance && memory.importance >= 7 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  ⭐ High Priority
                </span>
              )}
              {memory.verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>

            <p className="text-sm text-gray-900 line-clamp-2">
              {memory.content}
            </p>

            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              <span>
                {new Date(memory.timestamp).toLocaleString()}
              </span>
              {memory.importance !== undefined && (
                <span>Importance: {memory.importance}/10</span>
              )}
              {memory.accessCount !== undefined && (
                <span>Accessed: {memory.accessCount}x</span>
              )}
              {memory.category && (
                <span>Category: {memory.category}</span>
              )}
            </div>
          </div>

          {/* Importance indicator */}
          {memory.importance !== undefined && (
            <div className="flex-shrink-0">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    memory.importance >= 7
                      ? 'bg-red-500'
                      : memory.importance >= 4
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${memory.importance * 10}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (sortedMemories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No memories found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <List
        height={height}
        itemCount={sortedMemories.length}
        itemSize={120}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};
