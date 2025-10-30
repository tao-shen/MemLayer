import React, { FC, useState } from 'react';
import { useMemoryAssets } from '../hooks/useMemoryAssets';

export interface AccessControlPanelProps {
  assetId: string;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Component for managing access control of a memory asset
 */
export const AccessControlPanel: FC<AccessControlPanelProps> = ({
  assetId,
  apiEndpoint,
  className = '',
}) => {
  const { grantAccess, revokeAccess, loading, canManage } = useMemoryAssets(apiEndpoint);
  
  const [granteeAddress, setGranteeAddress] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [expiresAt, setExpiresAt] = useState('');
  const [maxAccess, setMaxAccess] = useState('');
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    try {
      await grantAccess(
        assetId,
        granteeAddress,
        permissions,
        expiresAt ? new Date(expiresAt) : undefined,
        maxAccess ? parseInt(maxAccess) : undefined
      );

      setResult({
        type: 'success',
        message: `Access granted to ${granteeAddress}`,
      });

      // Reset form
      setGranteeAddress('');
      setPermissions(['read']);
      setExpiresAt('');
      setMaxAccess('');
      setShowGrantForm(false);
    } catch (error) {
      setResult({
        type: 'error',
        message: (error as Error).message,
      });
    }
  };

  const handleRevokeAccess = async (address: string) => {
    setResult(null);

    try {
      await revokeAccess(assetId, address);
      setResult({
        type: 'success',
        message: `Access revoked for ${address}`,
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: (error as Error).message,
      });
    }
  };

  const togglePermission = (permission: string) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter(p => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };

  if (!canManage) {
    return (
      <div className={`access-control-panel not-connected ${className}`}>
        <p>Please connect your wallet to manage access control</p>
      </div>
    );
  }

  return (
    <div className={`access-control-panel ${className}`}>
      <div className="panel-header">
        <h4>Access Control</h4>
        <button
          onClick={() => setShowGrantForm(!showGrantForm)}
          className="grant-button"
          disabled={loading}
        >
          {showGrantForm ? 'Cancel' : '+ Grant Access'}
        </button>
      </div>

      {result && (
        <div className={`result-message ${result.type}`}>
          {result.message}
        </div>
      )}

      {showGrantForm && (
        <form onSubmit={handleGrantAccess} className="grant-form">
          <div className="form-group">
            <label htmlFor="granteeAddress">Wallet Address</label>
            <input
              id="granteeAddress"
              type="text"
              value={granteeAddress}
              onChange={(e) => setGranteeAddress(e.target.value)}
              placeholder="Enter wallet address"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Permissions</label>
            <div className="permissions-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={permissions.includes('read')}
                  onChange={() => togglePermission('read')}
                  disabled={loading}
                />
                <span>Read</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={permissions.includes('write')}
                  onChange={() => togglePermission('write')}
                  disabled={loading}
                />
                <span>Write</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={permissions.includes('transfer')}
                  onChange={() => togglePermission('transfer')}
                  disabled={loading}
                />
                <span>Transfer</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="expiresAt">Expires At (Optional)</label>
            <input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxAccess">Max Access Count (Optional)</label>
            <input
              id="maxAccess"
              type="number"
              value={maxAccess}
              onChange={(e) => setMaxAccess(e.target.value)}
              placeholder="Unlimited"
              min="1"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !granteeAddress || permissions.length === 0}
            className="submit-button"
          >
            {loading ? 'Granting...' : 'Grant Access'}
          </button>
        </form>
      )}

      <div className="grants-list">
        <h5>Active Grants</h5>
        <p className="info-text">
          Active access grants will be displayed here once loaded from the blockchain
        </p>
        {/* This would be populated with actual grants from the API */}
      </div>
    </div>
  );
};

export default AccessControlPanel;
