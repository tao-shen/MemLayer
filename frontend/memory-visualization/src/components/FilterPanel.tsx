import React, { useState, useEffect } from 'react';
import { MemoryFilters, MemoryType } from '../types';

interface FilterPanelProps {
  filters: MemoryFilters;
  onChange: (filters: MemoryFilters) => void;
  onReset?: () => void;
}

const MEMORY_TYPES: MemoryType[] = ['stm', 'episodic', 'semantic', 'reflection'];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<MemoryFilters>(filters);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleTypeToggle = (type: MemoryType) => {
    const currentTypes = localFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    
    const updated = {
      ...localFilters,
      types: newTypes.length > 0 ? newTypes : undefined,
    };
    setLocalFilters(updated);
    onChange(updated);
  };

  const handleSearchChange = (value: string) => {
    const updated = {
      ...localFilters,
      searchQuery: value || undefined,
    };
    setLocalFilters(updated);

    // Debounce search
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    const timeout = setTimeout(() => {
      onChange(updated);
    }, 300);
    setSearchDebounce(timeout);
  };

  const handleTimeRangeChange = (field: 'start' | 'end', value: string) => {
    if (!value) {
      const updated = { ...localFilters, timeRange: undefined };
      setLocalFilters(updated);
      onChange(updated);
      return;
    }

    const date = new Date(value);
    const updated = {
      ...localFilters,
      timeRange: {
        start: field === 'start' ? date : localFilters.timeRange?.start || new Date(),
        end: field === 'end' ? date : localFilters.timeRange?.end || new Date(),
      },
    };
    setLocalFilters(updated);
    onChange(updated);
  };

  const handleImportanceChange = (field: 'min' | 'max', value: number) => {
    const updated = {
      ...localFilters,
      importanceRange: {
        min: field === 'min' ? value : localFilters.importanceRange?.min || 0,
        max: field === 'max' ? value : localFilters.importanceRange?.max || 10,
      },
    };
    setLocalFilters(updated);
    onChange(updated);
  };

  const handleReset = () => {
    const resetFilters: MemoryFilters = {
      types: undefined,
      timeRange: undefined,
      importanceRange: undefined,
      searchQuery: undefined,
      sessionId: undefined,
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
    onReset?.();
  };

  const hasActiveFilters =
    (localFilters.types && localFilters.types.length > 0) ||
    localFilters.timeRange ||
    localFilters.importanceRange ||
    localFilters.searchQuery ||
    localFilters.sessionId;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          value={localFilters.searchQuery || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search memory content..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Memory Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Memory Types
        </label>
        <div className="space-y-2">
          {MEMORY_TYPES.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.types?.includes(type) || false}
                onChange={() => handleTypeToggle(type)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Range
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="datetime-local"
              value={
                localFilters.timeRange?.start
                  ? new Date(localFilters.timeRange.start).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) => handleTimeRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={
                localFilters.timeRange?.end
                  ? new Date(localFilters.timeRange.end).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) => handleTimeRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Importance Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Importance Range
        </label>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">Minimum</label>
              <span className="text-xs font-medium text-gray-900">
                {localFilters.importanceRange?.min || 0}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={localFilters.importanceRange?.min || 0}
              onChange={(e) => handleImportanceChange('min', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500">Maximum</label>
              <span className="text-xs font-medium text-gray-900">
                {localFilters.importanceRange?.max || 10}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={localFilters.importanceRange?.max || 10}
              onChange={(e) => handleImportanceChange('max', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {localFilters.types && localFilters.types.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Types: {localFilters.types.length}
              </span>
            )}
            {localFilters.timeRange && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Time Range
              </span>
            )}
            {localFilters.importanceRange && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Importance: {localFilters.importanceRange.min}-{localFilters.importanceRange.max}
              </span>
            )}
            {localFilters.searchQuery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Search
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
