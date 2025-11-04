import { create } from 'zustand';
import { visualizationApi, memoryApi } from '../api';
import type { Memory, Entity, Relationship, MemoryFilters, Statistics } from '../types';

type ViewType = 'timeline' | 'graph' | 'list' | 'stats' | 'blockchain';

interface VisualizationStore {
  // State
  activeView: ViewType;
  memories: Memory[];
  entities: Entity[];
  relationships: Relationship[];
  filters: MemoryFilters;
  selectedMemory: Memory | null;
  statistics: Statistics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveView: (view: ViewType) => void;
  loadVisualizationData: (agentId: string) => Promise<void>;
  updateFilters: (filters: Partial<MemoryFilters>) => void;
  selectMemory: (memory: Memory | null) => void;
  searchMemories: (agentId: string, query: string) => Promise<void>;
  exportData: (agentId: string, format: 'json' | 'csv') => Promise<void>;
  resetFilters: () => void;
}

const defaultFilters: MemoryFilters = {
  types: ['stm', 'episodic', 'semantic', 'reflection'],
  dateRange: null,
  importanceRange: [0, 10],
  searchQuery: '',
};

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  // Initial state
  activeView: 'timeline',
  memories: [],
  entities: [],
  relationships: [],
  filters: defaultFilters,
  selectedMemory: null,
  statistics: null,
  isLoading: false,
  error: null,

  // Set active view
  setActiveView: (view: ViewType) => {
    set({ activeView: view });
  },

  // Load visualization data
  loadVisualizationData: async (agentId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { filters } = get();

      const params = {
        types: filters.types.join(','),
        startDate: filters.dateRange?.[0]?.toISOString(),
        endDate: filters.dateRange?.[1]?.toISOString(),
        minImportance: filters.importanceRange[0],
        maxImportance: filters.importanceRange[1],
        includeRelationships: true,
        includeSimilarities: true,
      };

      const data = await visualizationApi.getVisualizationData(agentId, params);

      set({
        memories: data.memories,
        entities: data.entities,
        relationships: data.relationships,
        statistics: data.statistics,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load visualization data:', error);
      set({ error: 'Failed to load visualization data', isLoading: false });
    }
  },

  // Update filters
  updateFilters: (newFilters: Partial<MemoryFilters>) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    }));
  },

  // Select memory
  selectMemory: (memory: Memory | null) => {
    set({ selectedMemory: memory });
  },

  // Search memories
  searchMemories: async (agentId: string, query: string) => {
    try {
      set({ isLoading: true, error: null });
      const { filters } = get();

      const results = await memoryApi.searchMemories(agentId, {
        query,
        types: filters.types,
        topK: 50,
      });

      set({
        memories: results.map((r) => r.memory),
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to search memories:', error);
      set({ error: 'Failed to search memories', isLoading: false });
    }
  },

  // Export data
  exportData: async (agentId: string, format: 'json' | 'csv') => {
    try {
      const { filters } = get();

      const blob = await visualizationApi.exportData(agentId, {
        format,
        filters: {
          types: filters.types.join(','),
          startDate: filters.dateRange?.[0]?.toISOString(),
          endDate: filters.dateRange?.[1]?.toISOString(),
          minImportance: filters.importanceRange[0],
          maxImportance: filters.importanceRange[1],
        },
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memories-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
      set({ error: 'Failed to export data' });
    }
  },

  // Reset filters
  resetFilters: () => {
    set({ filters: defaultFilters });
  },
}));
