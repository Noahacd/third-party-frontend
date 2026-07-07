import { create } from 'zustand';

type UiState = {
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  openLogin: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  loginOpen: false,
  setLoginOpen: (open) => set({ loginOpen: open }),
  openLogin: () => set({ loginOpen: true }),
}));
