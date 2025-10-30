import React, { FC, useState } from 'react';
import { useMemoryAssets } from '../hooks/useMemoryAssets';

export interface TransferAssetFormProps {
  assetId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Form component for transferring asset ownership
 */
export const TransferAssetForm: FC<TransferAssetFormProps> = ({
  assetId,
  onSuccess,
  onCancel,
  apiEndpoint,
  className = '',
}) => {
  const { transferAsset, loading, canManage } = useMemoryAssets(apiEndpoint);
  
  const [toAddress, setToAddress] = useState('');
  const [confirmAddress, setConfirmAddress] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (toAddress !== confirmAddress) {
      setError('Addresses do not match');
      return;
    }

    if (!confirmed) {
      setError('Please confirm the transfer');
      return;
    }

    try {
      await transferAsset(assetId, toAddress);
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!canManage) {
    return (
      <div className={`transfer-asset-form not-connected ${className}`}>
        <p>Please connect your wallet to transfer assets</p>
      </div>
    );
  }

  return (
    <div className={`transfer-asset-form ${className}`}>
      <div className="form-header">
        <h4>Transfer Asset Ownership</h4>
        <p className="warning-text">
          ⚠️ This action is irreversible. The asset will be permanently transferred to the new owner.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="assetId">Asset ID</label>
          <input
            id="assetId"
            type="text"
            value={assetId}
            disabled
            className="readonly-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="toAddress">New Owner Address</label>
          <input
            id="toAddress"
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="Enter recipient wallet address"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmAddress">Confirm Address</label>
          <input
            id="confirmAddress"
            type="text"
            value={confirmAddress}
            onChange={(e) => setConfirmAddress(e.target.value)}
            placeholder="Re-enter recipient wallet address"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={loading}
            />
            <span>
              I understand that this transfer is permanent and cannot be undone
            </span>
          </label>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="cancel-button"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !toAddress || !confirmAddress || !confirmed}
            className="transfer-button"
          >
            {loading ? 'Transferring...' : 'Transfer Asset'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransferAssetForm;
