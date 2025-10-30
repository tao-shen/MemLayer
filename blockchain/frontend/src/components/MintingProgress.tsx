import React, { FC, useEffect, useState } from 'react';
import { useMemoryMinting } from '../hooks/useMemoryMinting';

export interface MintingProgressProps {
  requestId: string;
  onComplete?: () => void;
  apiEndpoint?: string;
  className?: string;
}

interface MintStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  result?: any;
  error?: string;
}

/**
 * Component to display minting progress
 */
export const MintingProgress: FC<MintingProgressProps> = ({
  requestId,
  onComplete,
  apiEndpoint,
  className = '',
}) => {
  const { getMintStatus } = useMemoryMinting(apiEndpoint);
  const [status, setStatus] = useState<MintStatus>({ status: 'pending' });
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const pollStatus = async () => {
      try {
        const result = await getMintStatus(requestId);
        setStatus(result);

        if (result.status === 'completed' || result.status === 'failed') {
          setPolling(false);
          if (result.status === 'completed') {
            onComplete?.();
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);
    pollStatus(); // Initial poll

    return () => clearInterval(interval);
  }, [requestId, polling, getMintStatus, onComplete]);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      default:
        return '•';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'pending':
        return '#ffa500';
      case 'processing':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <div className={`minting-progress ${className}`}>
      <div className="progress-header">
        <span className="status-icon" style={{ color: getStatusColor() }}>
          {getStatusIcon()}
        </span>
        <h4>Minting Status: {status.status}</h4>
      </div>

      {status.progress !== undefined && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{
              width: `${status.progress}%`,
              backgroundColor: getStatusColor(),
            }}
          />
          <span className="progress-text">{status.progress}%</span>
        </div>
      )}

      {status.message && (
        <p className="status-message">{status.message}</p>
      )}

      {status.error && (
        <div className="error-message">
          <strong>Error:</strong> {status.error}
        </div>
      )}

      {status.result && status.status === 'completed' && (
        <div className="result-summary">
          <h5>Minting Complete!</h5>
          <div className="result-item">
            <span>Asset ID:</span>
            <code>{status.result.assetId}</code>
          </div>
          <div className="result-item">
            <span>Transaction:</span>
            <a
              href={`https://explorer.solana.com/tx/${status.result.transactionSignature}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MintingProgress;
