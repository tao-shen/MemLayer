import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import WalletInfoCard from './WalletInfoCard';
import MintMemoryForm from './MintMemoryForm';
import AssetsList from './AssetsList';
import ApiStatus from './ApiStatus';

const Dashboard: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'mint' | 'assets'>('mint');

  useEffect(() => {
    if (publicKey && connected) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / LAMPORTS_PER_SOL);
      });
    } else {
      setBalance(null);
    }
  }, [publicKey, connected, connection]);

  return (
    <>
      <header className="header">
        <h1>🧠 Memory Platform - Blockchain Demo</h1>
        <WalletMultiButton />
      </header>

      <main className="main-content">
        <ApiStatus />

        {connected && publicKey ? (
          <>
            <WalletInfoCard 
              publicKey={publicKey.toBase58()} 
              balance={balance} 
            />

            <div className="card">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'mint' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mint')}
                >
                  铸造记忆 NFT
                </button>
                <button
                  className={`tab ${activeTab === 'assets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assets')}
                >
                  我的资产
                </button>
              </div>

              {activeTab === 'mint' && <MintMemoryForm />}
              {activeTab === 'assets' && <AssetsList />}
            </div>
          </>
        ) : (
          <div className="card">
            <h2>欢迎来到 Memory Platform</h2>
            <p style={{ color: '#718096', marginBottom: '20px' }}>
              这是一个基于 Solana 区块链的 AI Agent 记忆平台演示。
              请先连接您的钱包以开始使用。
            </p>
            <div style={{ textAlign: 'center' }}>
              <WalletMultiButton />
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Dashboard;
