import { create } from 'zustand';

export interface SearchCenter {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface SearchState {
  query: string;
  searchCenter: SearchCenter | null;
  showResults: boolean;
  setQuery: (query: string) => void;
  setSearchCenter: (center: SearchCenter) => void;
  setShowResults: (show: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  searchCenter: null,
  showResults: false,
  setQuery: (query) => set({ query, showResults: Boolean(query.trim()) }),
  setSearchCenter: (searchCenter) => set({ searchCenter }),
  setShowResults: (show) => set({ showResults: show }),
}));
