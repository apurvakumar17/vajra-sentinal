import { create } from 'zustand'

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('sentinel_token'),
  setToken: (token: string) => {
    localStorage.setItem('sentinel_token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('sentinel_token');
    set({ token: null });
  }
}))
