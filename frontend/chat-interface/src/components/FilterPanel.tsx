import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { MemoryFilters, MemoryType } from '@/types';

interface FilterPanelProps {
  filters: MemoryFilters;
  onFiltersChange: (filters: Partial<MemoryFilters>) => void;
  onReset: () => void;
}

const MEMORY_TYPES: Array<{ value: MemoryType; label: string; color: string }> = [
  { value: 'stm', label: 'Short-term', color: 'bg-blue-500' },
  { value: 'episodic', label: 'Episodic', color: 'bg-green-500' },
  { value: 'semantic', label: 'Semantic', color: 'bg-orange-500' },
  { value: 'reflection', label: 'Reflection', color: 'bg-purple-500' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    onFiltersChange({ searchQuery: query });
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleTypeToggle = (type: MemoryType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ types: newTypes });
  };

  const handleImportanceChange = (index: number, value: number) => {
    const newRange: [number, number] = [...filters.importanceRange];
    newRange[index] = value;
    onFiltersChange({ importanceRange: newRange });
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : null;
    const newRange: [Date, Date] | null = filters.dateRange
      ? [...filters.dateRange]
      : [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()];

    if (type === 'start' && date) {
      newRange[0] = date;
    } else if (type === 'end' && date) {
      newRange[1] = date;
    }

    onFiltersChange({ dateRange: newRange });
  };

  const hasActiveFilters =
    filters.types.length < 4 ||
    filters.importanceRange[0] > 0 ||
    filters.importanceRange[1] < 10 ||
    filters.dateRange !== null ||
    filters.searchQuery !== '';

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Search Bar */}
      <div className="p-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search memories..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ searchQuery: '' });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle Button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-3">
          {/* Memory Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Memory Types
            </label>
            <div className="flex flex-wrap gap-2">
              {MEMORY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeToggle(type.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${
                      filters.types.includes(type.value)
                        ? `${type.color} text-white shadow-sm`
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Importance Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Importance Range: {filters.importanceRange[0]} - {filters.importanceRange[1]}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="10"
                value={filters.importanceRange[0]}
                onChange={(e) => handleImportanceChange(0, Number(e.target.value))}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="10"
                value={filters.importanceRange[1]}
                onChange={(e) => handleImportanceChange(1, Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={
                    filters.dateRange?.[0]
                      ? filters.dateRange[0].toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={
                    filters.dateRange?.[1]
                      ? filters.dateRange[1].toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
