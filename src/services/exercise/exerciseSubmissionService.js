import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';

// Generate next available 5-digit ID starting with '9' (90001, 90002, etc.)
export async function generateExerciseSubmissionId() {
  try {
    // Get all existing exercise submissions
    const submissionsRef = collection(db, 'exerciseSubmissions');
    const snapshot = await getDocs(submissionsRef);
    const existingIds = snapshot.docs
      .map((doc) => parseInt(doc.id))
      .filter((id) => id >= 90001);

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
      adminNotes: '',
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    throw error;
  }
}

// Approve exercise submission and add to library
export async function approveExerciseSubmission(submissionId, adminUserId) {
  try {
    // Get the submission
    const submissionRef = doc(db, 'exerciseSubmissions', submissionId);
    const submissionDoc = await getDoc(submissionRef);

    if (!submissionDoc.exists()) {
      throw new Error('Submission not found');
    }

    const submission = submissionDoc.data();

    // Add to exercise library
    const exerciseData = {
      id: submission.id,
      name: submission.name,
      target: submission.target,
      bodyPart: submission.bodyPart,
      category: submission.category,
      difficulty: submission.difficulty,
      equipment: submission.equipment,
      description: submission.description || '',
      instructions: submission.instructions || [],
      secondaryMuscles: submission.secondaryMuscles || [],
      gifUrl: submission.gifUrl || '',
      source: submission.source || 'user-submission',
      approvedBy: adminUserId,
      approvedAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),
    };

    const exerciseRef = doc(db, 'exerciseLibrary', submission.id);
    await setDoc(exerciseRef, exerciseData);

    // Update submission status
    await updateDoc(submissionRef, {
      status: 'approved',
      approvedBy: adminUserId,
      approvedAt: new Date().toISOString(),
      adminNotes: 'Approved and added to library',
    });

    return submission.id;
  } catch (error) {
    console.error('Error approving exercise submission:', error);
    throw error;
  }
}

// Reject exercise submission
export async function rejectExerciseSubmission(
  submissionId,
  adminUserId,
  adminNotes = ''
) {
  try {
    const submissionRef = doc(db, 'exerciseSubmissions', submissionId);
    await updateDoc(submissionRef, {
      status: 'rejected',
      rejectedBy: adminUserId,
      rejectedAt: new Date().toISOString(),
      adminNotes: adminNotes || 'Rejected by admin',
    });

    return submissionId;
  } catch (error) {
    console.error('Error rejecting exercise submission:', error);
    throw error;
  }
}
