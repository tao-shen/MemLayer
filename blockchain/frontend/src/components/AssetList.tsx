import React, { FC, useState } from 'react';
import { useMemoryAssets, MemoryAsset, AssetFilter } from '../hooks/useMemoryAssets';

export interface AssetListProps {
  onAssetClick?: (asset: MemoryAsset) => void;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Component to display list of memory assets
 */
export const AssetList: FC<AssetListProps> = ({
  onAssetClick,
  apiEndpoint,
  className = '',
}) => {
  const { assets, loading, error, fetchAssets, canManage } = useMemoryAssets(apiEndpoint);
  
  const [filters, setFilters] = useState<AssetFilter>({
    limit: 10,
    offset: 0,
  });
  const [agentIdFilter, setAgentIdFilter] = useState('');

  const handleRefresh = () => {
    fetchAssets(filters);
  };

  const handleFilterChange = () => {
    const newFilters: AssetFilter = {
      ...filters,
      agentId: agentIdFilter || undefined,
    };
    setFilters(newFilters);
    fetchAssets(newFilters);
  };

  const handleLoadMore = () => {
    const newFilters = {
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || 10),
    };
    setFilters(newFilters);
    fetchAssets(newFilters);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shortenId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-8)}`;
  };

  if (!canManage) {
    return (
      <div className={`asset-list not-connected ${className}`}>
        <p>Please connect your wallet to view your memory assets</p>
      </div>
    );
  }

  return (
    <div className={`asset-list ${className}`}>
      <div className="asset-list-header">
        <h3>My Memory Assets</h3>
        <button onClick={handleRefresh} disabled={loading} className="refresh-button">
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      <div className="asset-filters">
        <input
          type="text"
          placeholder="Filter by Agent ID"
          value={agentIdFilter}
          onChange={(e) => setAgentIdFilter(e.target.value)}
          className="filter-input"
        />
        <button onClick={handleFilterChange} className="filter-button">
          Apply Filter
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}

      {loading && assets.length === 0 ? (
        <div className="loading-state">
          <p>Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <p>No memory assets found</p>
          <p className="empty-hint">Mint your first memory to get started!</p>
        </div>
      ) : (
        <>
          <div className="assets-grid">
            {assets.map((asset) => (
              <div
                key={asset.assetId}
                className="asset-card"
                onClick={() => onAssetClick?.(asset)}
              >
                <div className="asset-header">
                  <span className="asset-version">v{asset.version}</span>
                  {asset.batchId && (
                    <span className="asset-batch" title="Part of batch">
                      📦
                    </span>
                  )}
                </div>

                <div className="asset-id">
                  <label>Asset ID:</label>
                  <code title={asset.assetId}>{shortenId(asset.assetId)}</code>
                </div>

                {asset.metadata?.agentId && (
                  <div className="asset-agent">
                    <label>Agent:</label>
                    <span>{asset.metadata.agentId}</span>
                  </div>
                )}

                <div className="asset-dates">
                  <div className="asset-date">
                    <label>Created:</label>
                    <span>{formatDate(asset.createdAt)}</span>
                  </div>
                  {asset.updatedAt !== asset.createdAt && (
                    <div className="asset-date">
                      <label>Updated:</label>
                      <span>{formatDate(asset.updatedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="asset-links">
                  <a
                    href={`https://arweave.net/${asset.arweaveId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="asset-link"
                  >
                    View on Arweave →
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="asset-list-footer">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="load-more-button"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
            <span className="asset-count">
              Showing {assets.length} assets
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default AssetList;
