import React from 'react';
import { AggregatedMemory, MemoryType } from '../types';

interface MemoryDetailPanelProps {
  memory: AggregatedMemory;
  onClose: () => void;
  onNavigateToMemory?: (memoryId: string) => void;
}

const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  stm: 'bg-blue-100 text-blue-800 border-blue-200',
  episodic: 'bg-green-100 text-green-800 border-green-200',
  semantic: 'bg-amber-100 text-amber-800 border-amber-200',
  reflection: 'bg-purple-100 text-purple-800 border-purple-200',
};

const MEMORY_TYPE_ICONS: Record<MemoryType, string> = {
  stm: '⚡',
  episodic: '📅',
  semantic: '📚',
  reflection: '💡',
};

export const MemoryDetailPanel: React.FC<MemoryDetailPanelProps> = ({
  memory,
  onClose,
  onNavigateToMemory,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Memory Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Type Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-3xl">{MEMORY_TYPE_ICONS[memory.type]}</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${MEMORY_TYPE_COLORS[memory.type]}`}>
            {memory.type.toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Content</h3>
          <p className="text-gray-900 whitespace-pre-wrap">{memory.content}</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-500">ID</h3>
            <p className="text-sm text-gray-900 font-mono">{memory.id}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
            <p className="text-sm text-gray-900">
              {new Date(memory.timestamp).toLocaleString()}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
            <p className="text-sm text-gray-900">
              {new Date(memory.createdAt).toLocaleString()}
            </p>
          </div>

          {memory.importance !== undefined && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Importance</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
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
                <span className="text-sm font-semibold text-gray-900">
                  {memory.importance}/10
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Type-specific fields */}
        {memory.type === 'stm' && memory.sessionId && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Session ID</h3>
            <p className="text-sm text-gray-900 font-mono">{memory.sessionId}</p>
          </div>
        )}

        {memory.type === 'episodic' && (
          <>
            {memory.eventType && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Event Type</h3>
                <p className="text-sm text-gray-900 capitalize">{memory.eventType}</p>
              </div>
            )}
            {memory.accessCount !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Access Count</h3>
                <p className="text-sm text-gray-900">{memory.accessCount} times</p>
              </div>
            )}
          </>
        )}

        {memory.type === 'semantic' && (
          <>
            {memory.source && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Source</h3>
                <p className="text-sm text-gray-900">{memory.source}</p>
              </div>
            )}
            {memory.category && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="text-sm text-gray-900">{memory.category}</p>
              </div>
            )}
            {memory.verified !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Verification Status</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  memory.verified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {memory.verified ? '✓ Verified' : 'Not Verified'}
                </span>
              </div>
            )}
          </>
        )}

        {memory.type === 'reflection' && (
          <>
            {memory.insights && memory.insights.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Insights</h3>
                <ul className="space-y-2">
                  {memory.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-900 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {memory.sourceMemoryIds && memory.sourceMemoryIds.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Source Memories ({memory.sourceMemoryIds.length})
                </h3>
                <div className="space-y-2">
                  {memory.sourceMemoryIds.map((sourceId) => (
                    <button
                      key={sourceId}
                      onClick={() => onNavigateToMemory?.(sourceId)}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-sm text-gray-900 font-mono transition-colors"
                    >
                      {sourceId.substring(0, 16)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Metadata */}
        {memory.metadata && Object.keys(memory.metadata).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Metadata</h3>
            <div className="bg-gray-50 rounded p-3">
              <pre className="text-xs text-gray-900 overflow-x-auto">
                {JSON.stringify(memory.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
