import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatTimestampLocal } from '../../utils/timeUtils';

/**
 * Creates a new food log entry in Firestore under the user's subcollection.
 * @param {object} item - The food item from the cart.
 * @param {object} options - Contains user, cartDate, and time details.
 * @returns {object} The newly created log entry with its auto-generated ID.
 */
export async function logFoodEntry(item, { user, cartDate, cartHour12, cartMinute, cartAmPm, serving }) {
    if (!user || !item.id) {
        throw new Error("User and Food ID must be provided to log an entry.");
    }

    const timestamp = formatTimestampLocal(cartDate, cartHour12, cartMinute, cartAmPm);

    const newLog = {
        foodId: item.id,
        timestamp,
        serving: serving || 1,
        units: item.units || item.serving_unit || 'serving',
        userId: user.uid,
        recordedTime: serverTimestamp(), // Use server timestamp for accuracy
    };
    
    // Add the new log to the user's 'foodLog' subcollection
    const subcollectionRef = collection(db, 'users', user.uid, 'foodLog');
    const docRef = await addDoc(subcollectionRef, newLog);
    
    console.log("Food entry logged with new ID: ", docRef.id);
    return { id: docRef.id, ...newLog };
} 