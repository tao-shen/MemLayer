import React from 'react';
import { AggregatedTacit, TacitType } from '../types';

interface TacitDetailPanelProps {
  tacit: AggregatedTacit;
  onClose: () => void;
  onNavigateToTacit?: (tacitId: string) => void;
}

const TACIT_TYPE_COLORS: Record<TacitType, string> = {
  stm: 'bg-blue-100 text-blue-800 border-blue-200',
  episodic: 'bg-green-100 text-green-800 border-green-200',
  semantic: 'bg-amber-100 text-amber-800 border-amber-200',
  reflection: 'bg-purple-100 text-purple-800 border-purple-200',
};

const TACIT_TYPE_ICONS: Record<TacitType, string> = {
  stm: '⚡',
  episodic: '📅',
  semantic: '📚',
  reflection: '💡',
};

export const TacitDetailPanel: React.FC<TacitDetailPanelProps> = ({
  tacit,
  onClose,
  onNavigateToTacit,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tacit Knowledge Details</h2>
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
          <span className="text-3xl">{TACIT_TYPE_ICONS[tacit.type]}</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${TACIT_TYPE_COLORS[tacit.type]}`}>
            {tacit.type.toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Content</h3>
          <p className="text-gray-900 whitespace-pre-wrap">{tacit.content}</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-500">ID</h3>
            <p className="text-sm text-gray-900 font-mono">{tacit.id}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
            <p className="text-sm text-gray-900">
              {new Date(tacit.timestamp).toLocaleString()}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
            <p className="text-sm text-gray-900">
              {new Date(tacit.createdAt).toLocaleString()}
            </p>
          </div>

          {tacit.importance !== undefined && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Importance</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
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
                <span className="text-sm font-semibold text-gray-900">
                  {tacit.importance}/10
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Type-specific fields */}
        {tacit.type === 'stm' && tacit.sessionId && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Session ID</h3>
            <p className="text-sm text-gray-900 font-mono">{tacit.sessionId}</p>
          </div>
        )}

        {tacit.type === 'episodic' && (
          <>
            {tacit.eventType && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Event Type</h3>
                <p className="text-sm text-gray-900 capitalize">{tacit.eventType}</p>
              </div>
            )}
            {tacit.accessCount !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Access Count</h3>
                <p className="text-sm text-gray-900">{tacit.accessCount} times</p>
              </div>
            )}
          </>
        )}

        {tacit.type === 'semantic' && (
          <>
            {tacit.source && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Source</h3>
                <p className="text-sm text-gray-900">{tacit.source}</p>
              </div>
            )}
            {tacit.category && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="text-sm text-gray-900">{tacit.category}</p>
              </div>
            )}
            {tacit.verified !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Verification Status</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  tacit.verified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tacit.verified ? '✓ Verified' : 'Not Verified'}
                </span>
              </div>
            )}
          </>
        )}

        {tacit.type === 'reflection' && (
          <>
            {tacit.insights && tacit.insights.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Insights</h3>
                <ul className="space-y-2">
                  {tacit.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-900 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tacit.sourceTacitIds && tacit.sourceTacitIds.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Source Tacit Knowledge ({tacit.sourceTacitIds.length})
                </h3>
                <div className="space-y-2">
                  {tacit.sourceTacitIds.map((sourceId) => (
                    <button
                      key={sourceId}
                      onClick={() => onNavigateToTacit?.(sourceId)}
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
        {tacit.metadata && Object.keys(tacit.metadata).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Metadata</h3>
            <div className="bg-gray-50 rounded p-3">
              <pre className="text-xs text-gray-900 overflow-x-auto">
                {JSON.stringify(tacit.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
