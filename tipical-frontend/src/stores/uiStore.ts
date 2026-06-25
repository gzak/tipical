import { create } from 'zustand';
import type { Business } from '../types';

interface UIState {
  showAuthModal: boolean;
  selectedBusiness: Business | null;
  showBusinessPanel: boolean;
  activeMarkerId: string | null;
  setShowAuthModal: (show: boolean) => void;
  setShowBusinessPanel: (show: boolean) => void;
  openBusinessPanel: (business: Business) => void;
  closeBusinessPanel: () => void;
  setActiveMarkerId: (id: string | null) => void;
  clearAutocompleteUI: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showAuthModal: false,
  selectedBusiness: null,
  showBusinessPanel: false,
  activeMarkerId: null,
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setShowBusinessPanel: (show) => set({ showBusinessPanel: show }),
  openBusinessPanel: (business) => set({ selectedBusiness: business, showBusinessPanel: true }),
  closeBusinessPanel: () => set({ selectedBusiness: null, showBusinessPanel: false }),
  setActiveMarkerId: (id) => set({ activeMarkerId: id }),
  clearAutocompleteUI: () => set({ activeMarkerId: null, selectedBusiness: null, showBusinessPanel: false }),
}));
