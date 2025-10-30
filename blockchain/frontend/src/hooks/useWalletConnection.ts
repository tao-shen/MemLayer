import { useEffect, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

export interface WalletConnectionState {
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: PublicKey | null;
  walletName: string | null;
  error: Error | null;
}

/**
 * Hook for managing wallet connection state
 */
export const useWalletConnection = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  
  const [state, setState] = useState<WalletConnectionState>({
    connected: wallet.connected,
    connecting: wallet.connecting,
    disconnecting: wallet.disconnecting,
    publicKey: wallet.publicKey,
    walletName: wallet.wallet?.adapter.name || null,
    error: null,
  });

  useEffect(() => {
    setState({
      connected: wallet.connected,
      connecting: wallet.connecting,
      disconnecting: wallet.disconnecting,
      publicKey: wallet.publicKey,
      walletName: wallet.wallet?.adapter.name || null,
      error: null,
    });
  }, [
    wallet.connected,
    wallet.connecting,
    wallet.disconnecting,
    wallet.publicKey,
    wallet.wallet,
  ]);

  const connect = useCallback(async () => {
    try {
      await wallet.connect();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }));
      throw error;
    }
  }, [wallet]);

  const disconnect = useCallback(async () => {
    try {
      await wallet.disconnect();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as Error,
      }));
      throw error;
    }
  }, [wallet]);

  const getBalance = useCallback(async (): Promise<number | null> => {
    if (!wallet.publicKey) {
      return null;
    }

    try {
      const balance = await connection.getBalance(wallet.publicKey);
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }, [wallet.publicKey, connection]);

  return {
    ...state,
    connect,
    disconnect,
    getBalance,
    wallet,
    connection,
  };
};

export default useWalletConnection;
