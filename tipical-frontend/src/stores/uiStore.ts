import { create } from 'zustand';

interface UIState {
  showAuthModal: boolean;
  selectedBusinessId: string | null;
  showBusinessPanel: boolean;
  setShowAuthModal: (show: boolean) => void;
  setSelectedBusiness: (id: string | null) => void;
  setShowBusinessPanel: (show: boolean) => void;
  openBusinessPanel: (id: string) => void;
  closeBusinessPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showAuthModal: false,
  selectedBusinessId: null,
  showBusinessPanel: false,
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setSelectedBusiness: (id) => set({ selectedBusinessId: id }),
  setShowBusinessPanel: (show) => set({ showBusinessPanel: show }),
  openBusinessPanel: (id) => set({ selectedBusinessId: id, showBusinessPanel: true }),
  closeBusinessPanel: () => set({ selectedBusinessId: null, showBusinessPanel: false }),
}));
