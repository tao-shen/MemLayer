import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSigning } from '../hooks/useWalletSigning';

export interface AuthenticationFlowProps {
  onAuthenticated?: (walletAddress: string, signature: string) => void;
  onError?: (error: Error) => void;
  apiEndpoint?: string;
  className?: string;
}

interface Challenge {
  message: string;
  nonce: string;
  expiresAt: number;
}

/**
 * Complete authentication flow component
 * Handles challenge generation and signature verification
 */
export const AuthenticationFlow: FC<AuthenticationFlowProps> = ({
  onAuthenticated,
  onError,
  apiEndpoint = '/api/v1/auth',
  className = '',
}) => {
  const { publicKey, connected } = useWallet();
  const { signChallenge, signing } = useWalletSigning();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate challenge when wallet connects
  useEffect(() => {
    if (connected && publicKey && !authenticated) {
      generateChallenge();
    }
  }, [connected, publicKey, authenticated]);

  const generateChallenge = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${apiEndpoint}/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate challenge');
      }

      const data = await response.json();
      setChallenge(data.challenge);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    }
  };

  const handleAuthenticate = async () => {
    if (!publicKey || !challenge) return;

    try {
      // Sign the challenge
      const { signatureBase58 } = await signChallenge(
        challenge.message,
        challenge.nonce
      );

      // Verify signature with backend
      const response = await fetch(`${apiEndpoint}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature: signatureBase58,
          message: challenge.message,
          nonce: challenge.nonce,
        }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      if (data.authenticated) {
        setAuthenticated(true);
        setError(null);
        onAuthenticated?.(publicKey.toBase58(), signatureBase58);
      } else {
        throw new Error('Invalid signature');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    }
  };

  if (!connected) {
    return (
      <div className={`auth-flow not-connected ${className}`}>
        <p>Please connect your wallet to authenticate</p>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className={`auth-flow authenticated ${className}`}>
        <div className="success-message">
          ✓ Authenticated with {publicKey?.toBase58().slice(0, 8)}...
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-flow ${className}`}>
      <div className="auth-content">
        <h3>Authenticate with Wallet</h3>
        
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        {challenge ? (
          <div className="challenge-section">
            <p className="challenge-info">
              Please sign the message to authenticate
            </p>
            <button
              onClick={handleAuthenticate}
              disabled={signing}
              className="authenticate-button"
            >
              {signing ? 'Signing...' : 'Sign & Authenticate'}
            </button>
          </div>
        ) : (
          <div className="loading-section">
            <p>Generating challenge...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthenticationFlow;
