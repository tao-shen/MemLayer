import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

export interface WalletContextProviderProps {
  children: ReactNode;
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
  endpoint?: string;
}

/**
 * Wallet Context Provider
 * Provides Solana wallet connection functionality to the app
 */
export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
  network = 'devnet',
  endpoint,
}) => {
  // Determine RPC endpoint
  const rpcEndpoint = useMemo(() => {
    if (endpoint) {
      return endpoint;
    }
    
    // Use environment variable if available
    if (process.env.REACT_APP_SOLANA_RPC_URL) {
      return process.env.REACT_APP_SOLANA_RPC_URL;
    }
    
    // Fallback to public RPC
    return clusterApiUrl(network);
  }, [endpoint, network]);

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
