import { create } from 'zustand';

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: { lat: 37.7749, lng: -122.4194 }, // San Francisco default
  zoom: 13,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
}));
