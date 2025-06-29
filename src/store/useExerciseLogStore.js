import { create } from 'zustand';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from './useAuthStore';

const useExerciseLogStore = create((set, get) => ({
  logs: [],
  loading: false,

  fetchLogs: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      console.log('[useExerciseLogStore] No user found, skipping fetchLogs.');
      return;
    }
    set({ loading: true });
    try {
      console.log(`[useExerciseLogStore] Fetching logs for user: ${user.uid}`);
      // Correct Firestore path: users/[userId]/workoutLog
      const logsRef = collection(db, 'users', user.uid, 'workoutLog');
      const q = query(logsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`[useExerciseLogStore] Fetched ${logs.length} logs for user: ${user.uid}`);
      set({ logs, loading: false });
    } catch (error) {
      console.error('[useExerciseLogStore] Error fetching exercise logs:', error);
      set({ loading: false });
    }
  },

  clearLogs: () => set({ logs: [] })
}));

export default useExerciseLogStore; 