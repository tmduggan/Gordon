import { doc, setDoc, getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

// Generate next available 5-digit ID starting with '9' (90001, 90002, etc.)
export async function generateExerciseSubmissionId() {
  try {
    // Get all existing exercise submissions
    const submissionsRef = collection(db, 'exerciseSubmissions');
    const snapshot = await getDocs(submissionsRef);
    const existingIds = snapshot.docs.map(doc => parseInt(doc.id)).filter(id => id >= 90001);
    
    // Find next available ID starting from 90001
    let nextId = 90001;
    while (existingIds.includes(nextId)) {
      nextId++;
    }
    
    return nextId.toString();
  } catch (error) {
    console.error('Error generating exercise submission ID:', error);
    throw error;
  }
}

// Submit exercise submission
export async function submitExerciseSubmission(submissionData, userId) {
  try {
    const submissionRef = doc(db, 'exerciseSubmissions', submissionData.id);
    await setDoc(submissionRef, {
      ...submissionData,
      submittedBy: userId,
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending, rejected
      adminNotes: ''
    });
    
    return submissionData.id;
  } catch (error) {
    console.error('Error submitting exercise submission:', error);
    throw error;
  }
}

// Get user's submitted exercises
export async function getUserSubmissions(userId) {
  try {
    const submissionsRef = collection(db, 'exerciseSubmissions');
    const q = query(
      submissionsRef,
      where('submittedBy', '==', userId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user submissions:', error);
    throw error;
  }
}

// Get all pending submissions (for admin)
export async function getPendingSubmissions() {
  try {
    const submissionsRef = collection(db, 'exerciseSubmissions');
    const q = query(
      submissionsRef,
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    throw error;
  }
} 