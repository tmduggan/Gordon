import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatIdTimestamp } from '../../utils/timeUtils';

/**
 * Saves a prepared workout log object to Firestore with a custom ID.
 *
 * @param {object} logObject - The complete workout log object to be saved.
 * @returns {Promise<string|null>} The document ID if successful, otherwise null.
 */
export const saveWorkoutLog = async (logObject) => {
  if (!logObject || !logObject.userId || !logObject.exerciseId || !logObject.timestamp) {
    console.error("Invalid log object provided for saving:", logObject);
    return null;
  }

  // Construct the custom document ID
  const formattedTimestamp = formatIdTimestamp(logObject.timestamp);
  const docId = `${logObject.exerciseId} - ${formattedTimestamp}`;
  
  try {
    const docRef = doc(db, 'workoutLog', docId);
    await setDoc(docRef, logObject);

    console.log('Workout entry saved to workoutLog with ID: ', docId);
    return docId;
  } catch (error) {
    console.error("Error saving workout log:", error);
    return null;
  }
}; 