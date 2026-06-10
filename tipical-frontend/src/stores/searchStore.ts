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
  buttonBaseCenter: SearchCenter;
  placeId: string | null;
  sessionToken: string | null;
  fitBoundsOnResults: boolean;
  setQuery: (query: string) => void;
  setSearchCenter: (center: SearchCenter) => void;
  setPlaceId: (placeId: string, displayText: string, sessionToken: string) => void;
  clearFitBounds: () => void;
  syncButtonBase: (center: SearchCenter) => void;
  clearSearch: (center: SearchCenter) => void;
}

type SearchStoreApi = ReturnType<typeof createSearchStore>;

function createSearchStore(initialCenter: SearchCenter) {
  return createStore<SearchState>((set) => ({
    query: '',
    searchCenter: initialCenter,
    buttonBaseCenter: initialCenter,
    placeId: null,
    sessionToken: null,
    fitBoundsOnResults: false,
    setQuery: (query) => set({ query, placeId: null, sessionToken: null, fitBoundsOnResults: true }),
    setSearchCenter: (searchCenter) => set({ searchCenter, buttonBaseCenter: searchCenter }),
    setPlaceId: (placeId, displayText, sessionToken) =>
      set({ placeId, query: displayText, sessionToken, fitBoundsOnResults: true }),
    clearFitBounds: () => set({ fitBoundsOnResults: false }),
    syncButtonBase: (buttonBaseCenter) => set({ buttonBaseCenter }),
    clearSearch: (center) => set({ query: '', placeId: null, sessionToken: null, fitBoundsOnResults: false, searchCenter: center, buttonBaseCenter: center }),
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
