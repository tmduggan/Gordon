import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { getTimeSegment, isSameDayLocal } from '../../utils/timeUtils';

/**
 * Fetch history logs from Firestore
 * @param {string} userId - User ID
 * @param {string} logType - Type of logs ('food' or 'exercise')
 * @param {Function} onLogsUpdate - Callback when logs are updated
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToHistoryLogs(userId, logType, onLogsUpdate, onError) {
    if (!userId || !logType) {
        onLogsUpdate([]);
        return () => {};
    }

    const collectionName = logType === 'food' ? 'foodLog' : 'workoutLog';
    const logsCollectionRef = collection(db, 'users', userId, collectionName);
    const q = query(logsCollectionRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (querySnapshot) => {
        const fetchedLogs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
            return {
                id: doc.id,
                ...data,
                timestamp
            };
        });
        onLogsUpdate(fetchedLogs);
    }, (error) => {
        console.error(`Error fetching ${logType} logs: `, error);
        onError(error);
    });
}

/**
 * Delete a log entry
 * @param {string} userId - User ID
 * @param {string} logType - Type of log ('food' or 'exercise')
 * @param {string} logId - Log ID to delete
 * @returns {Promise} Delete operation promise
 */
export async function deleteLog(userId, logType, logId) {
    if (!userId) return;
    
    const collectionName = logType === 'food' ? 'foodLog' : 'workoutLog';
    const docRef = doc(db, 'users', userId, collectionName, logId);
    
    try {
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting ${logType} log: `, error);
        throw error;
    }
}

/**
 * Update a log entry
 * @param {string} userId - User ID
 * @param {string} logType - Type of log ('food' or 'exercise')
 * @param {string} logId - Log ID to update
 * @param {string} field - Field to update
 * @param {any} value - New value
 * @param {Array} currentLogs - Current logs array (for food log updates)
 * @returns {Promise} Update operation promise
 */
export async function updateLog(userId, logType, logId, field, value, currentLogs = []) {
    if (!userId) return;
    
    const collectionName = logType === 'food' ? 'foodLog' : 'workoutLog';
    const docRef = doc(db, 'users', userId, collectionName, logId);
    
    try {
        if (logType === 'food') {
            const log = currentLogs.find(l => l.id === logId);
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
        throw error;
    }
}

/**
 * Get logs for today
 * @param {Array} logs - All logs array
 * @param {string} logType - Type of logs
 * @returns {Array} Today's logs
 */
export function getLogsForToday(logs, logType) {
    if (logType !== 'food') return [];
    const today = new Date();
    return logs.filter(l => isSameDayLocal(new Date(l.timestamp), today));
}

/**
 * Group logs by time segment
 * @param {Array} dayLogs - Logs for a specific day
 * @param {string} logType - Type of logs
 * @returns {Object} Logs grouped by time segment
 */
export function groupLogsByTimeSegment(dayLogs, logType) {
    if (logType !== 'food') return {};
    return dayLogs.reduce((acc, log) => {
        const segment = getTimeSegment(new Date(log.timestamp));
        acc[segment] = acc[segment] || [];
        acc[segment].push(log);
        return acc;
    }, { Morning: [], Midday: [], Evening: [] });
} 