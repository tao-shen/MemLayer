import { XMarkIcon, CubeIcon, FireIcon, EyeIcon } from '@heroicons/react/24/outline';
import type { Memory } from '@/types';
import { format } from 'date-fns';

interface MemoryDetailPanelProps {
  memory: Memory | null;
  onClose: () => void;
  onMintNFT?: (memoryId: string) => void;
}

const MEMORY_TYPE_COLORS = {
  stm: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  episodic: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  semantic: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  reflection: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export const MemoryDetailPanel: React.FC<MemoryDetailPanelProps> = ({
  memory,
  onClose,
  onMintNFT,
}) => {
  if (!memory) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Memory Details
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Type Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              MEMORY_TYPE_COLORS[memory.type]
            }`}
          >
            {memory.type.toUpperCase()}
          </span>
          {memory.onChain && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
              On-Chain
            </span>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </h3>
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {memory.content}
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <FireIcon className="w-4 h-4" />
              <span>Importance</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {memory.importance.toFixed(1)} / 10
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${(memory.importance / 10) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <EyeIcon className="w-4 h-4" />
              <span>Access Count</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {memory.accessCount}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Created</span>
            <span className="text-gray-900 dark:text-gray-100">
              {format(new Date(memory.createdAt), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Last Accessed</span>
            <span className="text-gray-900 dark:text-gray-100">
              {format(new Date(memory.lastAccessedAt), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        </div>

        {/* Entities */}
        {memory.entities && memory.entities.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Related Entities ({memory.entities.length})
            </h3>
            <div className="space-y-2">
              {memory.entities.map((entity) => (
                <div
                  key={entity.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {entity.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {entity.type}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entity.importance.toFixed(1)}
                    </div>
                  </div>
                  {entity.properties && Object.keys(entity.properties).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(entity.properties).slice(0, 3).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs text-gray-600 dark:text-gray-400"
                          >
                            <span className="font-medium">{key}:</span> {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationships */}
        {memory.relationships && memory.relationships.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relationships ({memory.relationships.length})
            </h3>
            <div className="space-y-2">
              {memory.relationships.map((rel) => (
                <div
                  key={rel.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{rel.type}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {rel.sourceId.substring(0, 8)} → {rel.targetId.substring(0, 8)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Weight: {rel.weight.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blockchain Info */}
        {memory.onChain && memory.assetAddress && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">
              Blockchain Asset
            </h3>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-indigo-700 dark:text-indigo-400 mb-1">
                  Asset Address
                </div>
                <div className="text-xs font-mono text-indigo-900 dark:text-indigo-300 break-all">
                  {memory.assetAddress}
                </div>
              </div>
              <a
                href={`https://explorer.solana.com/address/${memory.assetAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View on Explorer →
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {!memory.onChain && onMintNFT && (
            <button
              onClick={() => onMintNFT(memory.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <CubeIcon className="w-5 h-5" />
              Mint as NFT
            </button>
          )}
        </div>

        {/* Additional Metadata */}
        {memory.metadata && Object.keys(memory.metadata).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Metadata
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <pre className="text-xs text-gray-900 dark:text-gray-100 overflow-x-auto">
                {JSON.stringify(memory.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
