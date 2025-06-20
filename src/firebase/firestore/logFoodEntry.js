import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatTimestampLocal } from '../../utils/timeUtils';

/**
 * Creates a new food log entry in Firestore.
 * @param {object} item - The food item from the cart.
 * @param {object} options - Contains user, cartDate, and time details.
 * @returns {object} The newly created log entry.
 */
export async function logFoodEntry(item, { user, cartDate, cartHour12, cartMinute, cartAmPm, foodId }) {
    if (!user || !foodId) {
        throw new Error("User and Food ID must be provided to log an entry.");
    }

    const timestamp = formatTimestampLocal(cartDate, cartHour12, cartMinute, cartAmPm);
    const recordedTime = new Date().toISOString();

    const newLog = {
        foodId,
        timestamp,
        serving: item.serving || 1,
        units: item.units || item.default_serving?.label || 'serving',
        userId: user.uid,
        recordedTime,
    };
    
    // Create a unique ID to prevent duplicate logs if the user clicks quickly.
    const customId = `${timestamp}_${foodId}`;
    await setDoc(doc(db, 'foodLog', customId), newLog);
    
    return { id: customId, ...newLog };
} 