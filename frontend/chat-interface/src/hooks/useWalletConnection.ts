import { useCallback, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useNotification } from './useNotification';

export const useWalletConnection = () => {
  const { publicKey, connected, connect, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const { showNotification } = useNotification();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch balance
  const getBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return null;
    }

    try {
      const bal = await connection.getBalance(publicKey);
      const solBalance = bal / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      return solBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
      return null;
    }
  }, [publicKey, connection]);

  // Connect wallet
  const handleConnect = useCallback(async () => {
    if (connected) return;

    setIsLoading(true);
    try {
      await connect();
      showNotification({
        type: 'success',
        message: 'Wallet connected successfully',
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      if (error.name === 'WalletNotFoundError') {
        showNotification({
          type: 'error',
          message: 'Wallet not found. Please install a Solana wallet extension.',
        });
      } else if (error.name === 'WalletConnectionError') {
        showNotification({
          type: 'error',
          message: 'Failed to connect wallet. Please try again.',
        });
      } else {
        showNotification({
          type: 'error',
          message: error.message || 'Failed to connect wallet',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [connected, connect, showNotification]);

  // Disconnect wallet
  const handleDisconnect = useCallback(async () => {
    if (!connected) return;

    setIsLoading(true);
    try {
      await disconnect();
      setBalance(null);
      showNotification({
        type: 'info',
        message: 'Wallet disconnected',
      });
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      showNotification({
        type: 'error',
        message: error.message || 'Failed to disconnect wallet',
      });
    } finally {
      setIsLoading(false);
    }
  }, [connected, disconnect, showNotification]);

  // Validate Solana address
  const isValidAddress = useCallback((address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Auto-fetch balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      getBalance();
      
      // Refresh balance every 30 seconds
      const interval = setInterval(getBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, getBalance]);

  return {
    // State
    publicKey,
    connected,
    balance,
    isLoading,
    walletName: wallet?.adapter.name,
    
    // Methods
    connect: handleConnect,
    disconnect: handleDisconnect,
    getBalance,
    isValidAddress,
  };
};
