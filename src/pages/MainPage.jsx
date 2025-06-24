import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

// Component Imports
import CartContainer from '../components/Cart/CartContainer';
import Search from '../components/Search/Search';
import { PinnedItemsGrid } from '../components/PinnedItem';
import HistoryView from '../components/HistoryView';
import DateTimePicker, { useDateTimePicker } from '../components/DateTimePicker.tsx';
import DailySummary from '../components/nutrition/DailySummary';
import DailyTotalsCard from '../components/nutrition/DailyTotalsCard';
import MuscleChartDisplay from '../components/exercise/MuscleChartDisplay';
import LevelDisplay from '../components/LevelDisplay';
import WorkoutSuggestions from '../components/WorkoutSuggestions';

// Hook Imports
import useCart from '../hooks/useCart';
import useHistory from "../hooks/fetchHistory";
import useLibrary from '../hooks/fetchLibrary';
import useSearch from '../hooks/useSearch';
import useAuthStore from "../store/useAuthStore";
import { useToast } from '../hooks/use-toast';

// Utility Imports
import { getFoodMacros } from '../utils/dataUtils';
import { logFoodEntry } from '../firebase/firestore/logFoodEntry';
import { get24Hour } from '../utils/timeUtils';
import { saveWorkoutLog } from '../firebase/firestore/logExerciseEntry';
import { groupAndEnrichLogs } from '../utils/timeUtils';
import { calculateWorkoutScore, updatePersonalBests } from '../services/scoringService';
import { muscleMapping } from '../utils/muscleMapping';


export default function MainPage({ type }) {
    const { user, userProfile, saveUserProfile, togglePinFood, togglePinExercise } = useAuthStore();
    const dateTimePicker = useDateTimePicker(type);
    const [currentLogData, setCurrentLogData] = useState({}); // For exercise cart inputs
    const { toast } = useToast();
    const [showAllHistory, setShowAllHistory] = useState(false);
    
    // Get account creation date (use user creation time or default to 30 days ago)
    const accountCreationDate = useMemo(() => {
        if (user?.metadata?.creationTime) {
            return new Date(user.metadata.creationTime);
        }
        // Default to 30 days ago if no creation time available
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }, [user]);
    
    // Initialize hooks for both types
    const foodLibrary = useLibrary('food');
    const foodHistory = useHistory('food');
    const exerciseLibrary = useLibrary('exercise');
    const exerciseHistory = useHistory('exercise', exerciseLibrary.items);
    
    // Calculate total XP from workout history (always calculate, but only use for exercise)
    const totalXP = useMemo(() => {
        return exerciseHistory.logs.reduce((total, log) => total + (log.score || 0), 0);
    }, [exerciseHistory.logs]);
    
    // Type-specific hooks and handlers
    let library, history, search, cart, handleSelect, logCart, pinnedItems, historyProps, searchPlaceholder, itemType, onPinToggle, cartProps = {};
    let todayLogs = [];
    let exerciseFilterOptions = {};
    
    if (type === 'food') {
        library = foodLibrary;
        history = foodHistory;
        search = useSearch('food', library);
        cart = useCart('food');
        itemType = 'food';
        searchPlaceholder = "e.g., 1 cup of oatmeal";
        onPinToggle = togglePinFood;

        handleSelect = async (food) => {
            let foodToLog = food;
            if (food.isPreview) {
                const savedFood = await library.fetchAndSave(food);
                if (savedFood) foodToLog = savedFood;
            }
            cart.addToCart(foodToLog);
            search.clearSearch();
        };

        logCart = async () => {
            const timestamp = dateTimePicker.getLogTimestamp();
            for (const item of cart.cart) {
                let food = library.items.find(f => f.id === item.id);
                if (!food) {
                    const newFoodId = await library.fetchAndSave(item);
                    if (newFoodId) food = { ...item, id: newFoodId };
                    else { console.warn("Could not save new food for cart item:", item); continue; }
                }
                try {
                    await logFoodEntry(food, user, item.quantity, timestamp);
                } catch (error) { console.error("Error adding food log from cart:", error, item); }
            }
            cart.clearCart();
        };

        pinnedItems = (userProfile?.pinnedFoods && library.items)
            ? userProfile.pinnedFoods.map(id => library.items.find(f => f.id === id)).filter(Boolean)
            : [];
        
        todayLogs = history.getLogsForToday();
        const logsByTimeSegment = history.groupLogsByTimeSegment(todayLogs);
        const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

        historyProps = {
            logs: showAllHistory ? history.logs : todayLogs,
            goals: userProfile?.goals || defaultGoals,
            getFoodById: (id) => library.items.find(f => f.id === id),
            updateLog: history.updateLog,
            deleteLog: history.deleteLog,
        };

    } else { // exercise
        library = exerciseLibrary;
        history = exerciseHistory;
        search = useSearch('exercise', library);
        cart = useCart('exercise');
        itemType = 'exercise';
        searchPlaceholder = "Search for an exercise...";
        onPinToggle = togglePinExercise;

        handleSelect = (exercise) => {
            cart.addToCart(exercise);
            setCurrentLogData(prev => ({ ...prev, [exercise.id]: { sets: [{ weight: '', reps: '' }] } }));
            search.clearSearch();
        };

        logCart = async () => {
            const timestamp = dateTimePicker.getLogTimestamp();
            const userWorkoutHistory = history.logs; // All past logs
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
                const exerciseDetailsFromLib = library.items.find(e => e.id === item.id) || {};
                
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

        pinnedItems = (userProfile?.pinnedExercises && library.items)
            ? userProfile.pinnedExercises.map(id => library.items.find(e => e.id === id)).filter(Boolean)
            : [];
        
        historyProps = {
            logs: history.logs,
            getExerciseName: (id) => library.items.find(e => e.id === id)?.name || 'Unknown',
            deleteExerciseLog: history.deleteLog,
        };

        cartProps = {
            logData: currentLogData,
            onLogDataChange: (id, data) => setCurrentLogData(prev => ({ ...prev, [id]: data })),
        };

        exerciseFilterOptions = {
            targets: [...new Set(library.items.map(item => item.target).filter(Boolean))].sort(),
            equipments: [...new Set(library.items.map(item => item.equipment).filter(Boolean))].sort(),
        };
    }

    if (library.loading || history.loading) {
        return <div>Loading {type} data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-4">
                {type === 'exercise' && (
                    <WorkoutSuggestions
                        muscleScores={userProfile?.muscleScores || {}}
                        workoutLogs={history.logs}
                        exerciseLibrary={library.items}
                        availableEquipment={userProfile?.availableEquipment || []}
                        onAddToCart={handleSelect}
                        className="mb-4"
                    />
                )}
                <PinnedItemsGrid
                    items={pinnedItems}
                    onSelectItem={(item) => cart.addToCart(item, 1)}
                    onPinToggleItem={onPinToggle}
                    itemType={itemType}
                />
                <Search
                    type={type}
                    searchQuery={search.searchQuery}
                    setSearchQuery={search.setSearchQuery}
                    searchResults={search.searchResults}
                    handleApiSearch={search.handleApiSearch}
                    handleSelect={handleSelect}
                    isLoading={search.searchLoading}
                    userProfile={userProfile}
                    togglePin={onPinToggle}
                    getFoodMacros={type === 'food' ? getFoodMacros : undefined} // Pass only if food
                    placeholder={searchPlaceholder}
                    filters={search.filters}
                    setFilters={search.setFilters}
                    filterOptions={exerciseFilterOptions}
                />
                {cart.cart.length > 0 && (
                    <CartContainer
                        title={`Your ${type} Cart`}
                        type={type}
                        items={cart.cart}
                        icon={type === 'food' ? '🛒' : '🏋️'}
                        footerControls={
                            <DateTimePicker
                                date={dateTimePicker.date}
                                setDate={dateTimePicker.setDate}
                                timePeriod={dateTimePicker.timePeriod}
                                setTimePeriod={dateTimePicker.setTimePeriod}
                                timePeriods={dateTimePicker.timePeriods}
                            />
                        }
                        clearCart={cart.clearCart}
                        updateCartItem={cart.updateCartItem}
                        removeFromCart={cart.removeFromCart}
                        logCart={logCart}
                        userWorkoutHistory={history.logs}
                        exerciseLibrary={library.items}
                        userProfile={userProfile}
                        {...cartProps}
                    />
                )}
            </div>
            {type === 'exercise' && (
                <>
                    <LevelDisplay 
                        totalXP={totalXP}
                        workoutLogs={history.logs}
                        accountCreationDate={accountCreationDate}
                        className="mb-4"
                    />
                    
                    <MuscleChartDisplay className="mt-4 px-4" />
                </>
            )}
            {type === 'food' && (
                <DailySummary 
                    foodLibrary={library.items} 
                    cart={cart.cart}
                    cartTimePeriod={dateTimePicker.timePeriod}
                />
            )}
            {type === 'food' && (
                <DailyTotalsCard
                    logs={todayLogs}
                    goals={userProfile?.goals || { calories: 2000, protein: 150, carbs: 200, fat: 60, fiber: 25 }}
                    getFoodById={(id) => library.items.find(f => f.id === id)}
                />
            )}
            {type === 'food' ? (
                <>
                    <HistoryView
                        type={type}
                        {...historyProps}
                    />
                    {!showAllHistory && history.logs.length > todayLogs.length && (
                        <div className="text-center mt-4">
                            <Button variant="link" onClick={() => setShowAllHistory(true)}>
                                Show Full History
                            </Button>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
} 