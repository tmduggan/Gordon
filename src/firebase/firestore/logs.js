import { db } from '../../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function fetchUserLogs(userId) {
    const logsQuery = query(collection(db, 'foodLog'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(logsQuery);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUserLog(logId, updateData) {
    const logRef = doc(db, 'foodLog', logId);
    await updateDoc(logRef, updateData);
}

export async function deleteUserLog(logId) {
    await deleteDoc(doc(db, 'foodLog', logId));
} 