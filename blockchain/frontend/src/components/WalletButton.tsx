import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export interface WalletButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wallet Connection Button
 * Displays wallet connection status and allows users to connect/disconnect
 */
export const WalletButton: FC<WalletButtonProps> = ({ className, style }) => {
  return (
    <WalletMultiButton
      className={className}
      style={{
        backgroundColor: '#512da8',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 600,
        ...style,
      }}
    />
  );
};

export default WalletButton;
