import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, deleteDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/useAuthStore';

export function useExerciseLogs() {
  const { user } = useAuthStore();
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExerciseLogs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const logsQuery = query(
        collection(db, 'workoutLog'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(logsQuery);
      const fetchedLogs = querySnapshot.docs.map(logDoc => ({
        id: logDoc.id,
        ...logDoc.data(),
        timestamp: logDoc.data().timestamp.toDate(),
      }));
      setExerciseLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching workout logs:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExerciseLogs();
  }, [fetchExerciseLogs]);

  const deleteExerciseLog = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'workoutLog', id));
      setExerciseLogs(logs => logs.filter(log => log.id !== id));
    } catch (error) {
      console.error("Error deleting workout log:", error);
    }
  }, []);

  const updateExerciseLog = useCallback(async (id, field, value) => {
    try {
      await updateDoc(doc(db, 'workoutLog', id), { [field]: value });
      fetchExerciseLogs();
    } catch (error) {
      console.error("Error updating workout log:", error);
    }
  }, [fetchExerciseLogs]);
  
  return {
    exerciseLogs,
    loading,
    deleteExerciseLog,
    updateExerciseLog,
  };
} 