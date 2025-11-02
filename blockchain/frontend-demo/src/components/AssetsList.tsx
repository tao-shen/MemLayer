import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import bs58 from 'bs58';

const API_URL = 'http://localhost:3000';

interface MemoryAsset {
  assetId: string;
  owner: string;
  content: string;
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
  };
  createdAt: string;
}

const AssetsList: React.FC = () => {
  const { publicKey, signMessage } = useWallet();
  const [assets, setAssets] = useState<MemoryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      loadAssets();
    }
  }, [publicKey]);

  const getAuthToken = async (): Promise<string | null> => {
    if (!publicKey || !signMessage) {
      return null;
    }

    try {
      const challengeResponse = await axios.post(`${API_URL}/v1/blockchain/auth/challenge`, {
        walletAddress: publicKey.toBase58()
      });

      const { message } = challengeResponse.data;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      const verifyResponse = await axios.post(`${API_URL}/v1/blockchain/auth/verify`, {
        walletAddress: publicKey.toBase58(),
        signature: bs58.encode(signature),
        message
      });

      return verifyResponse.data.token;
    } catch (err) {
      console.error('认证失败:', err);
      return null;
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('认证失败');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_URL}/v1/blockchain/memories`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            owner: publicKey?.toBase58()
          }
        }
      );

      setAssets(response.data.memories || []);
    } catch (err: any) {
      console.error('加载资产失败:', err);
      setError(err.response?.data?.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="error">{error}</div>
        <button onClick={loadAssets} className="button">
          重试
        </button>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
        <p>您还没有铸造任何记忆 NFT</p>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          切换到"铸造记忆 NFT"标签开始创建
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#2d3748' }}>我的记忆资产 ({assets.length})</h3>
        <button onClick={loadAssets} className="button button-secondary">
          刷新
        </button>
      </div>

      <div className="asset-list">
        {assets.map((asset) => (
          <div key={asset.assetId} className="asset-card">
            <h3>{asset.metadata.title || '无标题'}</h3>
            <p><strong>资产 ID:</strong> {asset.assetId.slice(0, 8)}...{asset.assetId.slice(-8)}</p>
            <p><strong>内容:</strong> {asset.content.slice(0, 100)}{asset.content.length > 100 ? '...' : ''}</p>
            {asset.metadata.description && (
              <p><strong>描述:</strong> {asset.metadata.description}</p>
            )}
            {asset.metadata.tags && asset.metadata.tags.length > 0 && (
              <p>
                <strong>标签:</strong>{' '}
                {asset.metadata.tags.map((tag, i) => (
                  <span key={i} style={{ 
                    background: '#e6fffa', 
                    color: '#234e52',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginRight: '5px',
                    fontSize: '12px'
                  }}>
                    {tag}
                  </span>
                ))}
              </p>
            )}
            <p style={{ fontSize: '12px', color: '#a0aec0' }}>
              创建时间: {new Date(asset.createdAt).toLocaleString('zh-CN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetsList;
