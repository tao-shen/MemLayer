import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { AggregatedTacit, TacitType, SortField } from '../types';

interface ListViewProps {
  tacits: AggregatedTacit[];
  onTacitClick?: (tacit: AggregatedTacit) => void;
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  height?: number;
}

const TACIT_TYPE_COLORS: Record<TacitType, string> = {
  stm: 'bg-blue-100 text-blue-800',
  episodic: 'bg-green-100 text-green-800',
  semantic: 'bg-amber-100 text-amber-800',
  reflection: 'bg-purple-100 text-purple-800',
};

const TACIT_TYPE_ICONS: Record<TacitType, string> = {
  stm: '⚡',
  episodic: '📅',
  semantic: '📚',
  reflection: '💡',
};

export const ListView: React.FC<ListViewProps> = ({
  tacits,
  onTacitClick,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  height = 600,
}) => {
  // Sort tacit knowledge
  const sortedTacits = useMemo(() => {
    const sorted = [...tacits];
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
  }, [tacits, sortBy, sortOrder]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const tacit = sortedTacits[index];
    
    return (
      <div
        style={style}
        className="px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
        onClick={() => onTacitClick?.(tacit)}
      >
        <div className="py-3 flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 text-2xl">
            {TACIT_TYPE_ICONS[tacit.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TACIT_TYPE_COLORS[tacit.type]}`}>
                {tacit.type.toUpperCase()}
              </span>
              {tacit.importance && tacit.importance >= 7 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  ⭐ High Priority
                </span>
              )}
              {tacit.verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>

            <p className="text-sm text-gray-900 line-clamp-2">
              {tacit.content}
            </p>

            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              <span>
                {new Date(tacit.timestamp).toLocaleString()}
              </span>
              {tacit.importance !== undefined && (
                <span>Importance: {tacit.importance}/10</span>
              )}
              {tacit.accessCount !== undefined && (
                <span>Accessed: {tacit.accessCount}x</span>
              )}
              {tacit.category && (
                <span>Category: {tacit.category}</span>
              )}
            </div>
          </div>

          {/* Importance indicator */}
          {tacit.importance !== undefined && (
            <div className="flex-shrink-0">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    tacit.importance >= 7
                      ? 'bg-red-500'
                      : tacit.importance >= 4
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${tacit.importance * 10}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (sortedTacits.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No tacit knowledge found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <List
        height={height}
        itemCount={sortedTacits.length}
        itemSize={120}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};
