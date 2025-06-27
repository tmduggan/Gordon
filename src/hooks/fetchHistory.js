import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import useAuthStore from '../store/useAuthStore';
import { getTimeSegment, isSameDayLocal } from '../utils/timeUtils';
import { recalculateScoresForHistory } from '../services/gamification/scoringService';

export default function useHistory(logType, exerciseLibrary = null) {
    const { user } = useAuthStore();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recalculated, setRecalculated] = useState(false);

    const collectionName = logType === 'food' ? 'foodLog' : 'workoutLog';

    useEffect(() => {
        if (!user || !logType) {
            setLogs([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const logsCollectionRef = collection(db, 'users', user.uid, collectionName);
        const q = query(logsCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedLogs = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
                return {
                    id: doc.id,
                    ...data,
                    timestamp
                };
            });
            setLogs(fetchedLogs);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching ${logType} logs: `, error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, logType, collectionName]);

    // Effect to recalculate scores when library is available
    useEffect(() => {
        if (logType === 'workout' && exerciseLibrary && logs.length > 0 && !recalculated) {
            const libraryMap = exerciseLibrary.reduce((acc, item) => {
                acc[item.id] = item;
                return acc;
            }, {});

            if (Object.keys(libraryMap).length > 0) {
                const recalculatedLogs = recalculateScoresForHistory(logs, libraryMap);
                setLogs(recalculatedLogs);
                setRecalculated(true);
            }
        }
    }, [logs, exerciseLibrary, logType, recalculated]);

    // Reset recalculation flag if user changes
    useEffect(() => {
        setRecalculated(false);
    }, [user]);

    const deleteLog = useCallback(async (id) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'users', user.uid, collectionName, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting ${logType} log: `, error);
        }
    }, [user, collectionName, logType]);

    const updateLog = useCallback(async (id, field, value) => {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid, collectionName, id);
        try {
            if (logType === 'food') {
                const log = logs.find(l => l.id === id);
                if (!log) return;
                let updateData = {};
                if (field === 'date' || field === 'time') {
                    const d = new Date(log.timestamp);
                    let newTimestamp;
                    if (field === 'date') {
                        const time = d.toTimeString().slice(0, 8); // HH:mm:ss
                        newTimestamp = new Date(`${value}T${time}`);
                    } else { // time
                        const date = d.toISOString().slice(0, 10); // YYYY-MM-DD
                        newTimestamp = new Date(`${date}T${value}`);
                    }
                    updateData.timestamp = newTimestamp;
                } else {
                    const newVal = field === 'serving' ? parseFloat(value) || 1 : value;
                    updateData[field] = newVal;
                }
                await updateDoc(docRef, updateData);
            } else {
                await updateDoc(docRef, { [field]: value });
            }
        } catch (error) {
            console.error(`Error updating ${logType} log: `, error);
        }
    }, [user, collectionName, logType, logs]);

    const getLogsForToday = useCallback(() => {
        if (logType !== 'food') return [];
        const today = new Date();
        return logs.filter(l => isSameDayLocal(new Date(l.timestamp), today));
    }, [logs, logType]);

    const groupLogsByTimeSegment = useCallback((dayLogs) => {
        if (logType !== 'food') return {};
        return dayLogs.reduce((acc, log) => {
            const segment = getTimeSegment(new Date(log.timestamp));
            acc[segment] = acc[segment] || [];
            acc[segment].push(log);
            return acc;
        }, { Morning: [], Midday: [], Evening: [] });
    }, [logType]);

    return { 
        logs, 
        loading, 
        deleteLog, 
        updateLog, 
        getLogsForToday,
        groupLogsByTimeSegment
    };
} 