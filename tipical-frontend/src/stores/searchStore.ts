import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { createElement, createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface SearchCenter {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface SearchState {
  query: string;
  searchCenter: SearchCenter;
  showResults: boolean;
  setQuery: (query: string) => void;
  setSearchCenter: (center: SearchCenter) => void;
  setShowResults: (show: boolean) => void;
}

type SearchStoreApi = ReturnType<typeof createSearchStore>;

function createSearchStore(initialCenter: SearchCenter) {
  return createStore<SearchState>((set) => ({
    query: '',
    searchCenter: initialCenter,
    showResults: false,
    setQuery: (query) => set({ query, showResults: Boolean(query.trim()) }),
    setSearchCenter: (searchCenter) => set({ searchCenter }),
    setShowResults: (show) => set({ showResults: show }),
  }));
}

const SearchStoreContext = createContext<SearchStoreApi | null>(null);

export function SearchStoreProvider({ initialCenter, children }: { initialCenter: SearchCenter; children: ReactNode }) {
  const [store] = useState(() => createSearchStore(initialCenter));
  return createElement(SearchStoreContext.Provider, { value: store }, children);
}

export function useSearchStore<T>(selector: (state: SearchState) => T): T {
  const store = useContext(SearchStoreContext);
  if (!store) throw new Error('useSearchStore must be used within SearchStoreProvider');
  return useStore(store, selector);
}
