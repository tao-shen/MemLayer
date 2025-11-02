import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBlockchainStore } from '../stores/blockchainStore';
import { useNotification } from '../hooks/useNotification';
import type { Memory } from '../types';

interface MintButtonProps {
  memory: Memory;
  variant?: 'icon' | 'button';
  className?: string;
}

export const MintButton: React.FC<MintButtonProps> = ({
  memory,
  variant = 'icon',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, connected, signMessage } = useWallet();
  const { mintMemory } = useBlockchainStore();
  const { showNotification } = useNotification();

  const handleMint = async () => {
    if (!connected || !publicKey) {
      showNotification({
        type: 'error',
        message: 'Please connect your wallet first',
      });
      return;
    }

    if (memory.onChain) {
      showNotification({
        type: 'info',
        message: 'This memory is already minted on-chain',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Request wallet signature for authentication
      const message = new TextEncoder().encode(
        `Mint memory NFT: ${memory.id}\nTimestamp: ${Date.now()}`
      );
      
      if (!signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      const signature = await signMessage(message);
      const signatureBase58 = Buffer.from(signature).toString('base64');

      // Call minting service
      const batchId = await mintMemory(memory.id, publicKey.toString(), signatureBase58);

      showNotification({
        type: 'success',
        message: 'Minting started! You can track progress in the blockchain view.',
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error('Minting error:', error);
      showNotification({
        type: 'error',
        message: error.message || 'Failed to mint memory NFT',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonContent = variant === 'icon' ? (
    <button
      onClick={() => setIsOpen(true)}
      className={`p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors ${className}`}
      title="Mint as NFT"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" />
      </svg>
    </button>
  ) : (
    <button
      onClick={() => setIsOpen(true)}
      className={`inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${className}`}
    >
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" />
      </svg>
      Mint as NFT
    </button>
  );

  return (
    <>
      {buttonContent}

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isLoading && setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Mint Memory as NFT
                  </Dialog.Title>

                  <div className="mt-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700 line-clamp-3">{memory.content}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {memory.type.toUpperCase()}
                        </span>
                        <span>Importance: {memory.importance.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network:</span>
                        <span className="font-medium">Solana Devnet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated Cost:</span>
                        <span className="font-medium">~0.01 SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated Time:</span>
                        <span className="font-medium">~30 seconds</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> This will create a compressed NFT on Solana. The memory
                        content will be encrypted and stored on Arweave.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      onClick={() => setIsOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                      onClick={handleMint}
                      disabled={isLoading || !connected}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Minting...
                        </>
                      ) : (
                        'Confirm & Mint'
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
