import { create } from 'zustand';

interface MapState {
  center: { lat: number; lng: number } | null;
  zoom: number;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: null,
  zoom: 13,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
}));
