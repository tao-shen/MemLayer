import React from 'react';

interface WalletInfoCardProps {
  publicKey: string;
  balance: number | null;
}

const WalletInfoCard: React.FC<WalletInfoCardProps> = ({ publicKey, balance }) => {
  return (
    <div className="card">
      <h2>钱包信息</h2>
      <div className="wallet-info">
        <div className="info-item">
          <label>连接状态</label>
          <div className="value">
            <span className="status-badge status-connected">已连接</span>
          </div>
        </div>
        <div className="info-item">
          <label>钱包地址</label>
          <div className="value" style={{ fontSize: '14px' }}>
            {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
          </div>
        </div>
        <div className="info-item">
          <label>SOL 余额</label>
          <div className="value">
            {balance !== null ? `${balance.toFixed(4)} SOL` : '加载中...'}
          </div>
        </div>
        <div className="info-item">
          <label>网络</label>
          <div className="value">Devnet</div>
        </div>
      </div>
    </div>
  );
};

export default WalletInfoCard;
