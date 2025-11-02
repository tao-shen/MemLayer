import { create } from 'zustand';
import { MemoryFilters, ViewType, AggregatedMemory } from '../types';

interface VisualizationState {
  currentView: ViewType;
  selectedMemory: AggregatedMemory | null;
  filters: MemoryFilters;
  setCurrentView: (view: ViewType) => void;
  setSelectedMemory: (memory: AggregatedMemory | null) => void;
  setFilters: (filters: MemoryFilters) => void;
  updateFilters: (partial: Partial<MemoryFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: MemoryFilters = {
  types: undefined,
  timeRange: undefined,
  importanceRange: undefined,
  searchQuery: undefined,
  sessionId: undefined,
};

export const useVisualizationStore = create<VisualizationState>((set) => ({
  currentView: 'timeline',
  selectedMemory: null,
  filters: defaultFilters,

  setCurrentView: (view) => set({ currentView: view }),

  setSelectedMemory: (memory) => set({ selectedMemory: memory }),

  setFilters: (filters) => set({ filters }),

  updateFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
