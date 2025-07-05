import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Fetches all food logs for a specific user from their subcollection.
 * The 'where' clause on userId is no longer needed as we are querying a specific user's subcollection.
 */
export async function fetchUserLogs(userId) {
  const logsCollectionRef = collection(db, 'users', userId, 'foodLog');
  const logsQuery = query(logsCollectionRef, orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(logsQuery);
  return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Updates a specific food log entry within a user's subcollection.
 * Requires userId to locate the correct subcollection.
 */
export async function updateUserLog(userId, logId, updateData) {
  const logRef = doc(db, 'users', userId, 'foodLog', logId);
  await updateDoc(logRef, updateData);
}

/**
 * Deletes a specific food log entry from a user's subcollection.
 * Requires userId to locate the correct subcollection.
 */
export async function deleteUserLog(userId, logId) {
  const logRef = doc(db, 'users', userId, 'foodLog', logId);
  await deleteDoc(logRef);
}
