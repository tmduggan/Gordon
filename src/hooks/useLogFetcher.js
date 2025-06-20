import { useState, useEffect, useRef } from 'react';
import { getTimeSegment } from '../utils/timeUtils';
import { fetchUserLogs, updateUserLog, deleteUserLog } from '../firebase/firestore/logs';

export default function useLogFetcher(user) {
    const [logs, setLogs] = useState([]);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (!user || loadedRef.current) return;
        const loadLogs = async () => {
            try {
                const fetchedLogs = await fetchUserLogs(user.uid);
                setLogs(fetchedLogs);
                loadedRef.current = true;
            } catch (error) {
                console.error("Error fetching food logs:", error);
            }
        };
        loadLogs();
    }, [user]);

    const getLogsForToday = () => {
        const todayString = new Date().toDateString();
        return logs.filter(l => new Date(l.timestamp).toDateString() === todayString);
    };

    const groupLogsByTimeSegment = (dayLogs) => {
        return dayLogs.reduce((acc, log) => {
            const segment = getTimeSegment(new Date(log.timestamp));
            acc[segment] = acc[segment] || [];
            acc[segment].push(log);
            return acc;
        }, { Morning: [], Midday: [], Evening: [] });
    };

    const updateLog = async (id, field, value) => {
        if (!user) return;
        try {
            const log = logs.find(l => l.id === id);
            let updateData = {};
            if (field === 'date' || field === 'time') {
                const d = new Date(log.timestamp);
                if (field === 'date') {
                    const time = d.toTimeString().slice(0, 5);
                    updateData.timestamp = new Date(`${value}T${time}`).toISOString();
                } else {
                    const date = d.toISOString().slice(0, 10);
                    updateData.timestamp = new Date(`${date}T${value}`).toISOString();
                }
            } else {
                const newVal = field === 'serving' ? parseFloat(value) || 1 : value;
                updateData[field] = newVal;
            }
            await updateUserLog(id, updateData);
            setLogs(logs.map(l => l.id === id ? { ...l, ...updateData } : l));
        } catch (error) {
            console.error("Error updating food log:", error);
        }
    };
    
    const deleteLog = async (id) => {
        if (!user) return;
        try {
            await deleteUserLog(id);
            setLogs(logs.filter(l => l.id !== id));
        } catch (error) {
            console.error("Error deleting food log:", error);
        }
    };

    return { logs, setLogs, getLogsForToday, groupLogsByTimeSegment, updateLog, deleteLog };
} 