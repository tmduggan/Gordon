import { useCallback, useEffect, useState } from 'react';
import {
  deleteLog,
  getLogsForToday,
  groupLogsByTimeSegment,
  subscribeToHistoryLogs,
  updateLog,
} from '../services/firebase/fetchHistoryService';
import useAuthStore from '../store/useAuthStore';
import type { Log, Exercise, ExerciseLog, FoodLog } from '../types';

export type LogType = 'food' | 'exercise';

interface LogWithName extends Log {
  name?: string;
}

interface UseHistoryReturn {
  exerciseHistory: ExerciseLog[];
  foodHistory: FoodLog[];
  addExerciseLog: (log: ExerciseLog) => void;
  addFoodLog: (log: FoodLog) => void;
  logs: LogWithName[];
  loading: boolean;
  deleteLog: (id: string) => Promise<void>;
  updateLog: (id: string, field: string, value: any) => Promise<void>;
  getLogsForToday: () => LogWithName[];
  groupLogsByTimeSegment: (dayLogs: LogWithName[]) => any;
}

export default function useHistory(
  logType: LogType,
  exerciseLibrary: Exercise[] | null = null
): UseHistoryReturn {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<LogWithName[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseLog[]>([]);
  const [foodHistory, setFoodHistory] = useState<FoodLog[]>([]);

  useEffect(() => {
    if (!user || !logType) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToHistoryLogs(
      user.uid,
      logType,
      (fetchedLogs: Log[]) => {
        // Attach exercise name from library if available
        let logsWithNames: LogWithName[] = fetchedLogs;
        if (exerciseLibrary && Array.isArray(exerciseLibrary)) {
          logsWithNames = fetchedLogs.map((log: Log) => {
            if (log.exerciseId) {
              const ex = exerciseLibrary.find((e: Exercise) => e.id === log.exerciseId);
              if (ex) {
                return { ...log, name: ex.name };
              }
            }
            return log;
          });
        }
        setLogs(logsWithNames);
        setLoading(false);
      },
      (error: Error) => {
        console.error(`Error fetching ${logType} logs: `, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, logType, exerciseLibrary]);

  const handleDeleteLog = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;
      try {
        await deleteLog(user.uid, logType, id);
      } catch (error) {
        console.error(`Error deleting ${logType} log: `, error);
      }
    },
    [user, logType]
  );

  const handleUpdateLog = useCallback(
    async (id: string, field: string, value: any): Promise<void> => {
      if (!user) return;
      try {
        await updateLog(user.uid, logType, id, field, value, logs);
      } catch (error) {
        console.error(`Error updating ${logType} log: `, error);
      }
    },
    [user, logType, logs]
  );

  const getTodayLogs = useCallback((): LogWithName[] => {
    return getLogsForToday(logs, logType);
  }, [logs, logType]);

  const groupByTimeSegment = useCallback(
    (dayLogs: LogWithName[]) => {
      return groupLogsByTimeSegment(dayLogs, logType);
    },
    [logType]
  );

  function addExerciseLog(log: ExerciseLog) {
    setExerciseHistory((prev) => [...prev, log]);
  }

  function addFoodLog(log: FoodLog) {
    setFoodHistory((prev) => [...prev, log]);
  }

  return {
    exerciseHistory,
    foodHistory,
    addExerciseLog,
    addFoodLog,
    logs,
    loading,
    deleteLog: handleDeleteLog,
    updateLog: handleUpdateLog,
    getLogsForToday: getTodayLogs,
    groupLogsByTimeSegment: groupByTimeSegment,
  };
} 