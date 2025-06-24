import React, { useMemo } from 'react';

// Component Imports
import CartContainer from '../components/Cart/CartContainer';
import Search from '../components/Search/Search';
import { PinnedItemsGrid } from '../components/PinnedItem';
import DateTimePicker, { useDateTimePicker } from '../components/DateTimePicker.tsx';
import MuscleChartDisplay from '../components/exercise/MuscleChartDisplay';
import LevelDisplay from '../components/LevelDisplay';
import WorkoutSuggestions from '../components/WorkoutSuggestions';

// Hook Imports
import useCart from '../hooks/useCart';
import useHistory from "../hooks/fetchHistory";
import useLibrary from '../hooks/fetchLibrary';
import useSearch from '../hooks/useSearch';
import useAuthStore from "../store/useAuthStore";
import useExerciseLogging from '../hooks/useExerciseLogging';

export default function ExercisePage() {
    const { user, userProfile, togglePinExercise } = useAuthStore();
    const dateTimePicker = useDateTimePicker('exercise');
    
    // Get account creation date (use user creation time or default to 30 days ago)
    const accountCreationDate = useMemo(() => {
        if (user?.metadata?.creationTime) {
            return new Date(user.metadata.creationTime);
        }
        // Default to 30 days ago if no creation time available
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }, [user]);
    
    // Initialize hooks
    const exerciseLibrary = useLibrary('exercise');
    const exerciseHistory = useHistory('exercise', exerciseLibrary.items);
    const search = useSearch('exercise', exerciseLibrary);
    const cart = useCart('exercise');
    
    // Use custom exercise logging hook
    const { handleSelect, logCart, cartProps } = useExerciseLogging(
        exerciseLibrary, exerciseHistory, cart, search, dateTimePicker
    );
    
    // Calculate total XP from workout history
    const totalXP = useMemo(() => {
        return exerciseHistory.logs.reduce((total, log) => total + (log.score || 0), 0);
    }, [exerciseHistory.logs]);

    const pinnedItems = (userProfile?.pinnedExercises && exerciseLibrary.items)
        ? userProfile.pinnedExercises.map(id => exerciseLibrary.items.find(e => e.id === id)).filter(Boolean)
        : [];

    const exerciseFilterOptions = {
        targets: [...new Set(exerciseLibrary.items.map(item => item.target).filter(Boolean))].sort(),
        equipments: [...new Set(exerciseLibrary.items.map(item => item.equipment).filter(Boolean))].sort(),
    };

    if (exerciseLibrary.loading || exerciseHistory.loading) {
        return <div>Loading exercise data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-4">
                <WorkoutSuggestions
                    muscleScores={userProfile?.muscleScores || {}}
                    workoutLogs={exerciseHistory.logs}
                    exerciseLibrary={exerciseLibrary.items}
                    availableEquipment={userProfile?.availableEquipment || []}
                    onAddToCart={handleSelect}
                    className="mb-4"
                />
                <PinnedItemsGrid
                    items={pinnedItems}
                    onSelectItem={(item) => cart.addToCart(item, 1)}
                    onPinToggleItem={togglePinExercise}
                    itemType="exercise"
                />
                <Search
                    type="exercise"
                    searchQuery={search.searchQuery}
                    setSearchQuery={search.setSearchQuery}
                    searchResults={search.searchResults}
                    handleApiSearch={search.handleApiSearch}
                    handleSelect={handleSelect}
                    isLoading={search.searchLoading}
                    userProfile={userProfile}
                    togglePin={togglePinExercise}
                    placeholder="Search for an exercise..."
                    filters={search.filters}
                    setFilters={search.setFilters}
                    filterOptions={exerciseFilterOptions}
                />
                {cart.cart.length > 0 && (
                    <CartContainer
                        title="Your Exercise Cart"
                        type="exercise"
                        items={cart.cart}
                        icon="🏋️"
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
                        userWorkoutHistory={exerciseHistory.logs}
                        exerciseLibrary={exerciseLibrary.items}
                        userProfile={userProfile}
                        {...cartProps}
                    />
                )}
            </div>
            
            <LevelDisplay 
                totalXP={totalXP}
                workoutLogs={exerciseHistory.logs}
                accountCreationDate={accountCreationDate}
                className="mb-4"
            />
            
            <MuscleChartDisplay className="mt-4 px-4" />
        </div>
    );
} 