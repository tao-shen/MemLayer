import { create } from 'zustand';
import { TacitFilters, ViewType, AggregatedTacit } from '../types';

interface VisualizationState {
  currentView: ViewType;
  selectedTacit: AggregatedTacit | null;
  filters: TacitFilters;
  setCurrentView: (view: ViewType) => void;
  setSelectedTacit: (tacit: AggregatedTacit | null) => void;
  setFilters: (filters: TacitFilters) => void;
  updateFilters: (partial: Partial<TacitFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: TacitFilters = {
  types: undefined,
  timeRange: undefined,
  importanceRange: undefined,
  searchQuery: undefined,
  sessionId: undefined,
};

export const useVisualizationStore = create<VisualizationState>((set) => ({
  currentView: 'timeline',
  selectedTacit: null,
  filters: defaultFilters,

  setCurrentView: (view) => set({ currentView: view }),

  setSelectedTacit: (tacit) => set({ selectedTacit: tacit }),

  setFilters: (filters) => set({ filters }),

  updateFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
