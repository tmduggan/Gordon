import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/useAuthStore';
import { 
    subscribeToHistoryLogs, 
    deleteLog, 
    updateLog, 
    getLogsForToday, 
    groupLogsByTimeSegment 
} from '../services/firebase/fetchHistoryService';

export default function useHistory(logType, exerciseLibrary = null) {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

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
            (fetchedLogs) => {
                setLogs(fetchedLogs);
                setLoading(false);
            },
            (error) => {
                console.error(`Error fetching ${logType} logs: `, error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, logType]);

    const handleDeleteLog = useCallback(async (id) => {
        if (!user) return;
        try {
            await deleteLog(user.uid, logType, id);
        } catch (error) {
            console.error(`Error deleting ${logType} log: `, error);
        }
    }, [user, logType]);

    const handleUpdateLog = useCallback(async (id, field, value) => {
        if (!user) return;
        try {
            await updateLog(user.uid, logType, id, field, value, logs);
        } catch (error) {
            console.error(`Error updating ${logType} log: `, error);
        }
    }, [user, logType, logs]);

    const getTodayLogs = useCallback(() => {
        return getLogsForToday(logs, logType);
    }, [logs, logType]);

    const groupByTimeSegment = useCallback((dayLogs) => {
        return groupLogsByTimeSegment(dayLogs, logType);
    }, [logType]);

    return { 
        logs, 
        loading, 
        deleteLog: handleDeleteLog, 
        updateLog: handleUpdateLog, 
        getLogsForToday: getTodayLogs,
        groupLogsByTimeSegment: groupByTimeSegment
    };
} 