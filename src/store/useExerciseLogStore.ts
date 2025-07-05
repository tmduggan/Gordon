import { collection, getDocs, query, where } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../firebase';
import useAuthStore from './useAuthStore';
import type { ExerciseLog } from '../types';

interface ExerciseLogState {
  logs: ExerciseLog[];
  addLog: (log: ExerciseLog) => void;
  removeLog: (id: string) => void;
  clearLogs: () => void;
}

const useExerciseLogStore = create<ExerciseLogState>((set, get) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  removeLog: (id) => set((state) => ({ logs: state.logs.filter((log) => log.id !== id) })),
  clearLogs: () => set({ logs: [] }),

  fetchLogs: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true });
    try {
      const logsRef = collection(db, 'exerciseLogs');
      const q = query(logsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as ExerciseLog[];
      set({ logs, loading: false });
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
      set({ loading: false });
    }
  },
}));

export default useExerciseLogStore; 