import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Creates a new food log entry in Firestore under the user's subcollection.
 * @param {object} item - The food item from the cart.
 * @param {object} user - The authenticated user object.
 * @param {number} serving - The serving size.
 * @param {Date} timestamp - The specific timestamp for the log entry.
 * @returns {object} The newly created log entry with its auto-generated ID.
 */
export async function logFoodEntry(item, user, serving, timestamp) {
    if (!user || !item.id) {
        throw new Error("User and Food ID must be provided to log an entry.");
    }

    const newLog = {
        foodId: item.id,
        timestamp: timestamp, // Use the provided timestamp directly
        serving: serving || 1,
        units: item.units || item.serving_unit || 'serving',
        userId: user.uid,
        recordedTime: serverTimestamp(),
    };
    
    // Add the new log to the user's 'foodLog' subcollection
    const subcollectionRef = collection(db, 'users', user.uid, 'foodLog');
    const docRef = await addDoc(subcollectionRef, newLog);
    
    console.log("Food entry logged with new ID: ", docRef.id);
    return { id: docRef.id, ...newLog };
} 