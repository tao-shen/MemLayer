import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import MemoryCard from './MemoryCard';
import { FilterPanel } from './FilterPanel';
import type { Memory } from '../types';
import { useVisualizationStore } from '../stores/visualizationStore';

interface MemoryListProps {
  className?: string;
}

type SortOption = 'time' | 'importance' | 'access';

const MemoryList: React.FC<MemoryListProps> = ({ className = '' }) => {
  const { memories, filters, selectMemory, updateFilters } = useVisualizationStore();
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [showFilters, setShowFilters] = useState(true);

  // Sort and filter memories
  const sortedMemories = useMemo(() => {
    let filtered = [...memories];

    // Sort
    switch (sortBy) {
      case 'time':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'importance':
        filtered.sort((a, b) => b.importance - a.importance);
        break;
      case 'access':
        filtered.sort((a, b) => b.accessCount - a.accessCount);
        break;
    }

    return filtered;
  }, [memories, sortBy]);

  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    updateFilters(newFilters);
  };

  const handleResetFilters = () => {
    updateFilters({
      types: ['stm', 'episodic', 'semantic', 'reflection'],
      dateRange: null,
      importanceRange: [0, 10],
      searchQuery: '',
    });
  };

  const handleMemoryClick = (memory: Memory) => {
    selectMemory(memory);
  };

  if (memories.length === 0) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No memories</h3>
          <p className="mt-1 text-sm text-gray-500">
            No memories found matching your filters.
          </p>
        </div>
      </div>
    );
  }

  const listRef = useRef<HTMLDivElement>(null);
  const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (listRef.current) {
        const { width, height } = listRef.current.getBoundingClientRect();
        setListDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const memory = sortedMemories[index];
    return (
      <div style={style} className="px-4 py-2">
        <MemoryCard
          memory={memory}
          onClick={() => handleMemoryClick(memory)}
          searchQuery={filters.searchQuery}
        />
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Memory List</h3>
          <span className="text-sm text-gray-500">
            {sortedMemories.length} {sortedMemories.length === 1 ? 'memory' : 'memories'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="time">Latest</option>
            <option value="importance">Importance</option>
            <option value="access">Most Accessed</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="border-b border-gray-200">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </div>
      )}

      {/* Virtual list */}
      <div ref={listRef} className="flex-1">
        {listDimensions.height > 0 && (
          <List
            height={listDimensions.height}
            itemCount={sortedMemories.length}
            itemSize={180}
            width={listDimensions.width}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
};

export default MemoryList;
