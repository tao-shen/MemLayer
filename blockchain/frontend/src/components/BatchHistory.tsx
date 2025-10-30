import React, { FC, useState } from 'react';
import { useTransactionHistory, BatchInfo, TransactionFilter } from '../hooks/useTransactionHistory';

export interface BatchHistoryProps {
  onBatchClick?: (batch: BatchInfo) => void;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Component to display batch minting history
 */
export const BatchHistory: FC<BatchHistoryProps> = ({
  onBatchClick,
  apiEndpoint,
  className = '',
}) => {
  const { batches, loading, error, fetchBatches, canView } = useTransactionHistory(apiEndpoint);
  
  const [filters, setFilters] = useState<TransactionFilter>({
    limit: 10,
    offset: 0,
  });

  const handleRefresh = () => {
    fetchBatches(filters);
  };

  const handleLoadMore = () => {
    const newFilters = {
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || 10),
    };
    setFilters(newFilters);
    fetchBatches(newFilters);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (lamports: number) => {
    return (lamports / 1e9).toFixed(6);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getExplorerUrl = (signature: string) => {
    return `https://explorer.solana.com/tx/${signature}`;
  };

  if (!canView) {
    return (
      <div className={`batch-history not-connected ${className}`}>
        <p>Please connect your wallet to view batch history</p>
      </div>
    );
  }

  return (
    <div className={`batch-history ${className}`}>
      <div className="history-header">
        <h3>Batch Minting History</h3>
        <button onClick={handleRefresh} disabled={loading} className="refresh-button">
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}

      {loading && batches.length === 0 ? (
        <div className="loading-state">
          <p>Loading batch history...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <p>No batch minting history found</p>
          <p className="empty-hint">Batch mint memories to see them here</p>
        </div>
      ) : (
        <>
          <div className="batches-grid">
            {batches.map((batch) => (
              <div
                key={batch.batchId}
                className="batch-card"
                onClick={() => onBatchClick?.(batch)}
              >
                <div className="batch-header">
                  <span
                    className="batch-status"
                    style={{ backgroundColor: getStatusColor(batch.status) }}
                  >
                    {batch.status}
                  </span>
                  <span className="batch-count">
                    {batch.memoryCount} memories
                  </span>
                </div>

                <div className="batch-id">
                  <label>Batch ID:</label>
                  <code title={batch.batchId}>
                    {batch.batchId.slice(0, 12)}...
                  </code>
                </div>

                <div className="batch-details">
                  <div className="batch-detail">
                    <label>Size:</label>
                    <span>{(batch.totalSizeBytes / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="batch-detail">
                    <label>Cost:</label>
                    <span>{formatCost(batch.totalCostLamports)} SOL</span>
                  </div>
                </div>

                <div className="batch-dates">
                  <div className="batch-date">
                    <label>Created:</label>
                    <span>{formatDate(batch.createdAt)}</span>
                  </div>
                  {batch.confirmedAt && (
                    <div className="batch-date">
                      <label>Confirmed:</label>
                      <span>{formatDate(batch.confirmedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="batch-links">
                  <a
                    href={getExplorerUrl(batch.transactionSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="explorer-link"
                  >
                    View Transaction →
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="history-footer">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="load-more-button"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
            <span className="batch-count">
              Showing {batches.length} batches
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default BatchHistory;
