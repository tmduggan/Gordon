import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

// Component Imports
import CartContainer from '../components/Cart/CartContainer';
import Search from '../components/Search/Search';
import { PinnedItemsGrid } from '../components/PinnedItem';
import HistoryView from '../components/HistoryView';
import DateTimePicker, { useDateTimePicker } from '../components/DateTimePicker.tsx';
import MuscleGroupProgress from '../components/exercise/MuscleGroupProgress';

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
import { calculateEffortScore } from '../services/scoringService';


export default function MainPage({ type }) {
    const { user, userProfile, togglePinFood, togglePinExercise } = useAuthStore();
    const dateTimePicker = useDateTimePicker(type);
    const [currentLogData, setCurrentLogData] = useState({}); // For exercise cart inputs
    const { toast } = useToast();
    const [showAllHistory, setShowAllHistory] = useState(false);
    
    // Type-specific hooks and handlers
    let library, history, search, cart, handleSelect, logCart, pinnedItems, historyProps, searchPlaceholder, itemType, onPinToggle, cartProps = {};
    let todayLogs = [];
    
    if (type === 'food') {
        library = useLibrary('food');
        history = useHistory('food');
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
        library = useLibrary('exercise');
        history = useHistory('exercise');
        search = useSearch('exercise', library);
        cart = useCart('exercise');
        itemType = 'exercise';
        searchPlaceholder = "Search for an exercise...";
        onPinToggle = togglePinExercise;

        handleSelect = (exercise) => {
            cart.addToCart(exercise);
            setCurrentLogData(prev => ({ ...prev, [exercise.id]: { weight: '', reps: '', duration: '' } }));
            search.clearSearch();
        };

        logCart = async () => {
            const timestamp = dateTimePicker.getLogTimestamp();
            for (const item of cart.cart) {
                const exerciseDetails = currentLogData[item.id] || {};
                const weight = Number(exerciseDetails.weight) || null;
                const reps = Number(exerciseDetails.reps) || null;
                const duration = Number(exerciseDetails.duration) || null;
                
                const score = calculateEffortScore({ weight, reps, duration });

                const isStrength = !!(weight || reps);
                const logToSave = {
                    userId: user.uid,
                    exerciseId: item.id,
                    timestamp: timestamp,
                    duration: !isStrength ? duration : null,
                    sets: isStrength ? [{ weight, reps }] : null,
                    score,
                };
                try {
                    await saveWorkoutLog(logToSave);
                    toast({
                        title: `+${score} XP!`,
                        description: `Logged ${item.name}.`
                    });
                } catch (error) { console.error("Error logging exercise:", error, item); }
            }
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
    }

    if (library.loading || history.loading) {
        return <div>Loading {type} data...</div>;
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-4">
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
                        {...cartProps}
                    />
                )}
            </div>
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
            ) : (
                <MuscleGroupProgress 
                    logs={history.logs}
                    exerciseLibrary={library.items}
                />
            )}
        </>
    );
} 