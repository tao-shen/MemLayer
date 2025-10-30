import React, { FC, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface WalletInfoProps {
  className?: string;
  showBalance?: boolean;
  showAddress?: boolean;
}

/**
 * Wallet Information Display
 * Shows connected wallet address and balance
 */
export const WalletInfo: FC<WalletInfoProps> = ({
  className = '',
  showBalance = true,
  showAddress = true,
}) => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey && showBalance) {
      fetchBalance();
    }
  }, [connected, publicKey, showBalance]);

  const fetchBalance = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  if (!connected || !publicKey) {
    return null;
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={`wallet-info ${className}`}>
      {showAddress && (
        <div className="wallet-address">
          <span className="label">Address:</span>
          <span className="value" title={publicKey.toBase58()}>
            {shortenAddress(publicKey.toBase58())}
          </span>
        </div>
      )}
      
      {showBalance && (
        <div className="wallet-balance">
          <span className="label">Balance:</span>
          <span className="value">
            {loading ? (
              'Loading...'
            ) : balance !== null ? (
              `${balance.toFixed(4)} SOL`
            ) : (
              'Error'
            )}
          </span>
          {!loading && balance !== null && (
            <button
              onClick={fetchBalance}
              className="refresh-button"
              title="Refresh balance"
            >
              ↻
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletInfo;
