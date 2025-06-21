import React, { useState } from 'react';

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

// Utility Imports
import { getFoodMacros } from '../utils/dataUtils';
import { logFoodEntry } from '../firebase/firestore/logFoodEntry';
import { get24Hour } from '../utils/timeUtils';
import { saveWorkoutLog } from '../firebase/firestore/logExerciseEntry';
import { groupAndEnrichLogs } from '../utils/timeUtils';


export default function MainPage({ type }) {
    const { user, userProfile, togglePinFood, togglePinExercise } = useAuthStore();
    const dateTimePicker = useDateTimePicker();
    const [currentLogData, setCurrentLogData] = useState({}); // For exercise cart inputs
    
    // Type-specific hooks and handlers
    let library, history, search, cart, handleSelect, logCart, pinnedItems, historyProps, searchPlaceholder, itemType, onPinToggle, cartProps = {};
    
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
            const { cartDate, cartHour12, cartMinute, cartAmPm } = dateTimePicker.getCartData();
            for (const item of cart.cart) {
                let food = library.foods.find(f => f.id === item.id);
                if (!food) {
                    const newFoodId = await library.fetchAndSave(item);
                    if (newFoodId) food = { ...item, id: newFoodId };
                    else { console.warn("Could not save new food for cart item:", item); continue; }
                }
                try {
                    await logFoodEntry(food, { user, cartDate, cartHour12, cartMinute, cartAmPm, serving: item.quantity });
                } catch (error) { console.error("Error adding food log from cart:", error, item); }
            }
            cart.clearCart();
        };

        pinnedItems = (userProfile?.pinnedFoods && library.foods)
            ? userProfile.pinnedFoods.map(id => library.foods.find(f => f.id === id)).filter(Boolean)
            : [];
        
        const todayLogs = history.getLogsForToday();
        const logsByTimeSegment = history.groupLogsByTimeSegment(todayLogs);
        const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

        historyProps = {
            goals: userProfile?.goals || defaultGoals,
            logsByDate: logsByTimeSegment,
            getFoodById: (id) => library.foods.find(f => f.id === id),
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
            const { cartDate, cartHour12, cartMinute, cartAmPm } = dateTimePicker.getCartData();
            const cartHour24 = get24Hour(cartHour12, cartAmPm);
            for (const item of cart.cart) {
                const exerciseDetails = currentLogData[item.id] || {};
                const weight = Number(exerciseDetails.weight) || null;
                const reps = Number(exerciseDetails.reps) || null;
                const duration = Number(exerciseDetails.duration) || null;
                const isStrength = !!(weight || reps);
                const logToSave = {
                    userId: user.uid,
                    exerciseId: item.id,
                    timestamp: new Date(`${cartDate}T${String(cartHour24).padStart(2, '0')}:${cartMinute}`),
                    duration: !isStrength ? duration : null,
                    sets: isStrength ? [{ weight, reps }] : null,
                    score: 0,
                };
                try {
                    await saveWorkoutLog(logToSave);
                } catch (error) { console.error("Error logging exercise:", error, item); }
            }
            cart.clearCart();
            setCurrentLogData({});
        };

        pinnedItems = (userProfile?.pinnedExercises && library.localExercises)
            ? userProfile.pinnedExercises.map(id => library.localExercises.find(e => e.id === id)).filter(Boolean)
            : [];
        
        historyProps = {
            enrichedAndGroupedLogs: (history.logs && library.localExercises)
                ? groupAndEnrichLogs(history.logs, library.localExercises)
                : {},
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
                    handleApiSearch={search.handleApiSearch} // Only used by food
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
                        footerControls={
                            <DateTimePicker
                                date={dateTimePicker.cartDate}
                                setDate={dateTimePicker.setCartDate}
                                hour={dateTimePicker.cartHour12}
                                setHour={dateTimePicker.setCartHour12}
                                minute={dateTimePicker.cartMinute}
                                setMinute={dateTimePicker.setCartMinute}
                                ampm={dateTimePicker.cartAmPm}
                                setAmpm={dateTimePicker.setCartAmPm}
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
                <HistoryView
                    type={type}
                    {...historyProps}
                />
            ) : (
                <MuscleGroupProgress />
            )}
        </>
    );
} 