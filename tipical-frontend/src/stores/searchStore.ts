import { create } from 'zustand';

interface Location {
  latitude: number;
  longitude: number;
}

interface SearchState {
  query: string;
  location: Location | null;
  showResults: boolean;
  setQuery: (query: string) => void;
  setLocation: (location: Location) => void;
  setShowResults: (show: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  location: null,
  showResults: false,
  setQuery: (query) => set({ query, showResults: Boolean(query.trim()) }),
  setLocation: (location) => set({ location }),
  setShowResults: (show) => set({ showResults: show }),
}));
