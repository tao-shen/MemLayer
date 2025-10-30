import React, { FC, useState } from 'react';
import { useWalletSigning } from '../hooks/useWalletSigning';

export interface SignMessageButtonProps {
  message: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component for signing messages
 */
export const SignMessageButton: FC<SignMessageButtonProps> = ({
  message,
  onSuccess,
  onError,
  className = '',
  children = 'Sign Message',
}) => {
  const { signTextMessage, signing, canSign } = useWalletSigning();
  const [signature, setSignature] = useState<string | null>(null);

  const handleSign = async () => {
    try {
      const result = await signTextMessage(message);
      setSignature(result.signatureBase58);
      onSuccess?.(result.signatureBase58);
    } catch (error) {
      console.error('Error signing message:', error);
      onError?.(error as Error);
    }
  };

  if (!canSign) {
    return (
      <button disabled className={`sign-message-button disabled ${className}`}>
        Connect Wallet to Sign
      </button>
    );
  }

  return (
    <div className="sign-message-container">
      <button
        onClick={handleSign}
        disabled={signing}
        className={`sign-message-button ${signing ? 'signing' : ''} ${className}`}
      >
        {signing ? 'Signing...' : children}
      </button>
      
      {signature && (
        <div className="signature-result">
          <p className="signature-label">Signature:</p>
          <code className="signature-value" title={signature}>
            {signature.slice(0, 20)}...{signature.slice(-20)}
          </code>
        </div>
      )}
    </div>
  );
};

export default SignMessageButton;
