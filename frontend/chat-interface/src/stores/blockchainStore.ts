import { create } from 'zustand';
import { blockchainApi } from '../api';
import type { MemoryAsset, MintingProgress } from '../types';

interface BlockchainStore {
  // State
  connected: boolean;
  walletAddress: string | null;
  assets: MemoryAsset[];
  mintingProgress: Record<string, MintingProgress>;
  selectedAsset: MemoryAsset | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConnected: (connected: boolean, address: string | null) => void;
  loadAssets: (agentId: string, owner?: string) => Promise<void>;
  mintMemory: (
    agentId: string,
    memoryId: string,
    walletAddress: string,
    signature: string
  ) => Promise<string>;
  trackMintingProgress: (batchId: string, progress: MintingProgress) => void;
  selectAsset: (asset: MemoryAsset | null) => void;
  clearMintingProgress: (batchId: string) => void;
}

export const useBlockchainStore = create<BlockchainStore>((set, get) => ({
  // Initial state
  connected: false,
  walletAddress: null,
  assets: [],
  mintingProgress: {},
  selectedAsset: null,
  isLoading: false,
  error: null,

  // Set connected
  setConnected: (connected: boolean, address: string | null) => {
    set({ connected, walletAddress: address });
  },

  // Load assets
  loadAssets: async (agentId: string, owner?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await blockchainApi.getAssets({
        agentId,
        owner: owner || get().walletAddress || undefined,
        limit: 100,
      });

      set({
        assets: response.data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load assets:', error);
      set({ error: 'Failed to load assets', isLoading: false });
    }
  },

  // Mint memory
  mintMemory: async (
    agentId: string,
    memoryId: string,
    walletAddress: string,
    signature: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      const response = await blockchainApi.mintMemory({
        agentId,
        memoryId,
        walletAddress,
        signature,
      });

      // Initialize minting progress
      set((state) => ({
        mintingProgress: {
          ...state.mintingProgress,
          [response.batchId]: {
            memoryId,
            status: 'encrypting',
            progress: 0,
            message: 'Starting minting process...',
          },
        },
        isLoading: false,
      }));

      return response.batchId;
    } catch (error) {
      console.error('Failed to mint memory:', error);
      set({ error: 'Failed to mint memory', isLoading: false });
      throw error;
    }
  },

  // Track minting progress
  trackMintingProgress: (batchId: string, progress: MintingProgress) => {
    set((state) => ({
      mintingProgress: {
        ...state.mintingProgress,
        [batchId]: progress,
      },
    }));
  },

  // Select asset
  selectAsset: (asset: MemoryAsset | null) => {
    set({ selectedAsset: asset });
  },

  // Clear minting progress
  clearMintingProgress: (batchId: string) => {
    set((state) => {
      const newProgress = { ...state.mintingProgress };
      delete newProgress[batchId];
      return { mintingProgress: newProgress };
    });
  },
}));
