import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { saveWorkoutLog } from '../firebase/firestore/logExerciseEntry';
import { calculateWorkoutScore, updatePersonalBests } from '../services/scoringService';
import { useToast } from './use-toast';

export default function useExerciseLogging(exerciseLibrary, exerciseHistory, cart, search, dateTimePicker) {
    const { user, userProfile, saveUserProfile } = useAuthStore();
    const { toast } = useToast();
    const [currentLogData, setCurrentLogData] = useState({}); // For exercise cart inputs

    const handleSelect = (exercise) => {
        cart.addToCart(exercise);
        setCurrentLogData(prev => ({ ...prev, [exercise.id]: { sets: [{ weight: '', reps: '' }] } }));
        search.clearSearch();
    };

    const logCart = async () => {
        const timestamp = dateTimePicker.getLogTimestamp();
        const userWorkoutHistory = exerciseHistory.logs; // All past logs
        let updatedProfile = { ...userProfile };
        let profileScores = updatedProfile.muscleScores || {};

        // Helper to process a comma-separated muscle string
        const processMuscleString = (muscleString, score) => {
            if (!muscleString) return;
            muscleString.split(',').forEach(muscle => {
                const name = muscle.trim().toLowerCase();
                if (!name) return;
                profileScores[name] = (profileScores[name] || 0) + score;
            });
        };

        for (const item of cart.cart) {
            const exerciseDetailsFromCart = currentLogData[item.id] || {};
            const exerciseDetailsFromLib = exerciseLibrary.items.find(e => e.id === item.id) || {};
            
            const workoutToScore = {
                sets: exerciseDetailsFromCart.sets || [],
                duration: exerciseDetailsFromCart.duration || null,
                timestamp,
            };

            const score = calculateWorkoutScore(
                workoutToScore, 
                userWorkoutHistory, 
                exerciseDetailsFromLib,
                userProfile
            );

            // --- Update Aggregated Profile Scores ---
            // Process target muscle(s)
            processMuscleString(exerciseDetailsFromLib.target, score);
            // Process secondary muscles (array or string)
            if (Array.isArray(exerciseDetailsFromLib.secondaryMuscles)) {
                exerciseDetailsFromLib.secondaryMuscles.forEach(sec => processMuscleString(sec, score));
            } else if (typeof exerciseDetailsFromLib.secondaryMuscles === 'string') {
                processMuscleString(exerciseDetailsFromLib.secondaryMuscles, score);
            }
            // --- End Score Update ---

            // Update personal bests if this workout has sets
            if (workoutToScore.sets && workoutToScore.sets.length > 0) {
                const bestSet = workoutToScore.sets.reduce((best, set) => {
                    const setValue = (set.weight || 0) * (1 + (set.reps || 0) / 30); // 1RM calculation
                    const bestValue = (best.weight || 0) * (1 + (best.reps || 0) / 30);
                    return setValue > bestValue ? set : best;
                }, {});
                
                updatedProfile = updatePersonalBests(
                    item.id,
                    bestSet,
                    exerciseDetailsFromLib,
                    updatedProfile
                );
            }

            const logToSave = {
                userId: user.uid,
                exerciseId: item.id,
                timestamp,
                sets: workoutToScore.sets,
                duration: workoutToScore.duration,
                score,
            };
            
            try {
                await saveWorkoutLog(logToSave);
                toast({
                    title: `+${score} XP!`,
                    description: `Logged ${item.name}.`
                });
            } catch (error) {
                console.error("Error saving workout log:", error);
            }
        }
        
        // Save updated profile with new personal bests and muscle scores
        updatedProfile.muscleScores = profileScores;
        await saveUserProfile(updatedProfile);
        
        cart.clearCart();
        setCurrentLogData({});
    };

    const cartProps = {
        logData: currentLogData,
        onLogDataChange: (id, data) => setCurrentLogData(prev => ({ ...prev, [id]: data })),
    };

    return {
        handleSelect,
        logCart,
        cartProps,
        currentLogData,
        setCurrentLogData
    };
} 