// src/store/userStore.js
import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: {
    name: 'Guest',
    id: null,
    role: '',
    // Add more user fields as needed
  },
  setUser: (userData) => set({ user: userData }),
}));

export default useUserStore;
