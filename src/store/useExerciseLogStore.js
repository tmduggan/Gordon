import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from './useAuthStore';

const useExerciseLogStore = create((set, get) => ({
  logs: [],
  loading: false,

  fetchLogs: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true });
    try {
      const logsRef = collection(db, 'exerciseLogs');
      const q = query(logsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ logs, loading: false });
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
      set({ loading: false });
    }
  },

  clearLogs: () => set({ logs: [] })
}));

export default useExerciseLogStore; 