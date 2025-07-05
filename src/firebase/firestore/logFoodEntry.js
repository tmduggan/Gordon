import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { calculateFoodXP } from '../../services/gamification/foodScoringService';

/**
 * Creates a new food log entry in Firestore under the user's subcollection.
 * @param {object} item - The food item from the cart.
 * @param {object} user - The authenticated user object.
 * @param {number} serving - The serving size.
 * @param {Date} timestamp - The specific timestamp for the log entry.
 * @param {string} [units] - The selected unit (optional, from cart).
 * @param {object} [extraFields] - Additional fields to include in the log entry.
 * @returns {object} The newly created log entry with its auto-generated ID.
 */
export async function logFoodEntry(
  item,
  user,
  serving,
  timestamp,
  units,
  extraFields = {}
) {
  if (!user || !item.id) {
    throw new Error('User and Food ID must be provided to log an entry.');
  }

  // Calculate XP for this food item
  const xp = calculateFoodXP(item, serving, units);

  const newLog = {
    foodId: item.id,
    timestamp: timestamp, // Use the provided timestamp directly
    serving: serving || 1,
    units: units || item.units || item.serving_unit || 'serving',
    userId: user.uid,
    recordedTime: serverTimestamp(),
    xp: xp, // Add XP to the log entry
    ...extraFields,
  };

  // Debug: Output the log entry before saving
  console.log('[logFoodEntry] Logging food entry:', { newLog, item });
  // Add the new log to the user's 'foodLog' subcollection
  const subcollectionRef = collection(db, 'users', user.uid, 'foodLog');
  const docRef = await addDoc(subcollectionRef, newLog);

  // console.log("Food entry logged with new ID: ", docRef.id, "XP: ", xp);
  return { id: docRef.id, ...newLog };
}
