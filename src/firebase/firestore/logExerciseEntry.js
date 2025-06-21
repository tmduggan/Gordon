import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatTimestampLocal } from '../../utils/timeUtils';

/**
 * Saves a new workout log entry to the user's 'workoutLog' subcollection.
 * @param {object} logObject - The workout data to save.
 * @returns {string} The ID of the newly created document.
 */
export const saveWorkoutLog = async (logObject) => {
    if (!logObject.userId) {
        throw new Error("User ID is required to save a workout log.");
    }
    
    // Reference the user's specific 'workoutLog' subcollection
    const subcollectionRef = collection(db, 'users', logObject.userId, 'workoutLog');

    // Add server-generated timestamp for recording
    const logData = {
        ...logObject,
        recordedTime: serverTimestamp()
    };

    const docRef = await addDoc(subcollectionRef, logData);

    console.log('Workout entry saved with new ID: ', docRef.id);
    return docRef.id;
}; 