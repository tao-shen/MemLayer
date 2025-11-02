import React, { useEffect, useState } from 'react';
import { useBlockchainStore } from '../stores/blockchainStore';
import { useWalletConnection } from '../hooks/useWalletConnection';
import type { MemoryAsset } from '../types';

interface BlockchainAssetsProps {
  agentId: string;
  className?: string;
}

const BlockchainAssets: React.FC<BlockchainAssetsProps> = ({ agentId, className = '' }) => {
  const { assets, loadAssets, selectAsset, selectedAsset } = useBlockchainStore();
  const { connected, publicKey } = useWalletConnection();
  const [filter, setFilter] = useState<'all' | 'owned'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      setIsLoading(true);
      loadAssets(agentId).finally(() => setIsLoading(false));
    }
  }, [connected, publicKey, agentId, loadAssets]);

  const filteredAssets = filter === 'owned' && publicKey
    ? assets.filter(asset => asset.owner === publicKey.toString())
    : assets;

  if (!connected) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Connect Wallet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please connect your wallet to view blockchain assets
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Blockchain Assets</h3>
          <span className="text-sm text-gray-500">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'owned')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Assets</option>
            <option value="owned">My Assets</option>
          </select>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAssets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'owned'
                  ? 'You don\'t own any memory NFTs yet'
                  : 'No memory NFTs have been minted yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => selectAsset(asset)}
                className={`bg-white border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                  selectedAsset?.id === asset.id ? 'ring-2 ring-blue-600' : 'border-gray-200'
                }`}
              >
                {/* Asset Image */}
                <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {asset.metadata.image ? (
                    <img
                      src={asset.metadata.image}
                      alt={asset.metadata.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>

                {/* Asset Info */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 truncate">{asset.metadata.name}</h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {asset.metadata.description}
                  </p>
                  
                  {/* Owner Badge */}
                  {asset.owner === publicKey?.toString() && (
                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Owned
                    </div>
                  )}

                  {/* Minted Date */}
                  <div className="mt-2 text-xs text-gray-400">
                    Minted {new Date(asset.mintedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainAssets;
