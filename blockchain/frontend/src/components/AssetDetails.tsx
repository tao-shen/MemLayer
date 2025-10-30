import React, { FC, useState, useEffect } from 'react';
import { useMemoryAssets, MemoryAsset } from '../hooks/useMemoryAssets';

export interface AssetDetailsProps {
  assetId: string;
  onClose?: () => void;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Component to display detailed information about a memory asset
 */
export const AssetDetails: FC<AssetDetailsProps> = ({
  assetId,
  onClose,
  apiEndpoint,
  className = '',
}) => {
  const { getAsset, loading, error } = useMemoryAssets(apiEndpoint);
  const [asset, setAsset] = useState<MemoryAsset | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'metadata' | 'access'>('info');

  useEffect(() => {
    getAsset(assetId)
      .then(setAsset)
      .catch(console.error);
  }, [assetId, getAsset]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className={`asset-details loading ${className}`}>
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className={`asset-details error ${className}`}>
        <p>Error loading asset: {error?.message || 'Asset not found'}</p>
        {onClose && (
          <button onClick={onClose} className="close-button">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`asset-details ${className}`}>
      <div className="details-header">
        <h3>Memory Asset Details</h3>
        {onClose && (
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        )}
      </div>

      <div className="details-tabs">
        <button
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Information
        </button>
        <button
          className={`tab ${activeTab === 'metadata' ? 'active' : ''}`}
          onClick={() => setActiveTab('metadata')}
        >
          Metadata
        </button>
        <button
          className={`tab ${activeTab === 'access' ? 'active' : ''}`}
          onClick={() => setActiveTab('access')}
        >
          Access Control
        </button>
      </div>

      <div className="details-content">
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="detail-item">
              <label>Asset ID</label>
              <div className="detail-value">
                <code>{asset.assetId}</code>
                <button
                  onClick={() => copyToClipboard(asset.assetId)}
                  className="copy-button"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="detail-item">
              <label>Owner</label>
              <div className="detail-value">
                <code>{asset.owner}</code>
                <button
                  onClick={() => copyToClipboard(asset.owner)}
                  className="copy-button"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="detail-item">
              <label>Arweave ID</label>
              <div className="detail-value">
                <code>{asset.arweaveId}</code>
                <a
                  href={`https://arweave.net/${asset.arweaveId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  View on Arweave →
                </a>
              </div>
            </div>

            <div className="detail-item">
              <label>Version</label>
              <div className="detail-value">
                <span>v{asset.version}</span>
              </div>
            </div>

            {asset.batchId && (
              <div className="detail-item">
                <label>Batch ID</label>
                <div className="detail-value">
                  <code>{asset.batchId}</code>
                </div>
              </div>
            )}

            <div className="detail-item">
              <label>Content Hash</label>
              <div className="detail-value">
                <code className="hash">{asset.contentHash}</code>
              </div>
            </div>

            <div className="detail-item">
              <label>Created At</label>
              <div className="detail-value">
                <span>{formatDate(asset.createdAt)}</span>
              </div>
            </div>

            <div className="detail-item">
              <label>Updated At</label>
              <div className="detail-value">
                <span>{formatDate(asset.updatedAt)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="metadata-tab">
            {Object.keys(asset.metadata).length === 0 ? (
              <p className="empty-message">No metadata available</p>
            ) : (
              <pre className="metadata-json">
                {JSON.stringify(asset.metadata, null, 2)}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'access' && (
          <div className="access-tab">
            <p className="access-info">
              Access control management will be displayed here
            </p>
            {/* Access control UI will be implemented in AccessControlPanel */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDetails;
