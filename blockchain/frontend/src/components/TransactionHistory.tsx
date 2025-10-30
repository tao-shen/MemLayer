import React, { FC, useState } from 'react';
import { useTransactionHistory, TransferRecord, TransactionFilter } from '../hooks/useTransactionHistory';

export interface TransactionHistoryProps {
  assetId?: string;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Component to display transaction history
 */
export const TransactionHistory: FC<TransactionHistoryProps> = ({
  assetId,
  apiEndpoint,
  className = '',
}) => {
  const { transfers, loading, error, fetchTransfers, canView } = useTransactionHistory(apiEndpoint);
  
  const [filters, setFilters] = useState<TransactionFilter>({
    limit: 20,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleRefresh = () => {
    fetchTransfers(assetId, filters);
  };

  const handleLoadMore = () => {
    const newFilters = {
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || 20),
    };
    setFilters(newFilters);
    fetchTransfers(assetId, newFilters);
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

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (signature: string) => {
    return `https://explorer.solana.com/tx/${signature}`;
  };

  const filteredTransfers = searchTerm
    ? transfers.filter(
        (t) =>
          t.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.toAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.transactionSignature.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transfers;

  if (!canView) {
    return (
      <div className={`transaction-history not-connected ${className}`}>
        <p>Please connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className={`transaction-history ${className}`}>
      <div className="history-header">
        <h3>Transaction History</h3>
        <button onClick={handleRefresh} disabled={loading} className="refresh-button">
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      <div className="history-search">
        <input
          type="text"
          placeholder="Search by asset ID, address, or transaction..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}

      {loading && transfers.length === 0 ? (
        <div className="loading-state">
          <p>Loading transaction history...</p>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found</p>
          {searchTerm && <p className="empty-hint">Try adjusting your search</p>}
        </div>
      ) : (
        <>
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Asset ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="date-cell">
                      {formatDate(transfer.transferredAt)}
                    </td>
                    <td className="asset-cell">
                      <code title={transfer.assetId}>
                        {transfer.assetId.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="address-cell">
                      <code title={transfer.fromAddress}>
                        {shortenAddress(transfer.fromAddress)}
                      </code>
                    </td>
                    <td className="address-cell">
                      <code title={transfer.toAddress}>
                        {shortenAddress(transfer.toAddress)}
                      </code>
                    </td>
                    <td className="transaction-cell">
                      <a
                        href={getExplorerUrl(transfer.transactionSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="explorer-link"
                        title={transfer.transactionSignature}
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="history-footer">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="load-more-button"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
            <span className="transaction-count">
              Showing {filteredTransfers.length} transactions
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
