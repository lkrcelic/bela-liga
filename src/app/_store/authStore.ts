import { create } from "zustand";

export type AuthUser = { id: number; username: string } | null;

type AuthState = {
  user: AuthUser;
  loading: boolean;
  setUser: (user: AuthUser) => void;
  reset: () => void;
};

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  reset: () => set({ user: null }),
}));

export default useAuthStore;
