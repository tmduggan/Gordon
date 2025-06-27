import React, { useMemo, useState } from 'react';

// Component Imports
import CartContainer from '../components/Cart/CartContainer';
import Search from '../components/Search/Search';
import { PinnedItemsGrid } from '../components/PinnedItem';
import DateTimePicker, { useDateTimePicker } from '../components/ui/DateTimePicker.tsx';
import MuscleChartDisplay from '../components/exercise/muscleData/MuscleChartDisplay';
import LevelDisplay from '../components/gamification/LevelDisplay';
import WorkoutSuggestions from '../components/WorkoutSuggestions';
import { Button } from '../components/ui/button';
import PaywalledMuscleChart from '../components/exercise/PaywalledMuscleChart';

// Hook Imports
import useCart from '../hooks/useCart';
import useHistory from "../hooks/fetchHistory";
import useLibrary from '../hooks/fetchLibrary';
import useSearch from '../hooks/useSearch';
import useAuthStore from "../store/useAuthStore";
import useExerciseLogging from '../hooks/useExerciseLogging';
import { ensureAvailableEquipment } from '../utils/dataUtils';
import { getMuscleGroupCategoryNames } from '../services/svgMappingService';

export default function ExercisePage() {
    const { user, userProfile, togglePinExercise } = useAuthStore();
    const dateTimePicker = useDateTimePicker('exercise');
    const [selectedFilter, setSelectedFilter] = useState(null); // null = all
    const [showPinnedExercises, setShowPinnedExercises] = useState(false); // Temporarily hide pinned exercises
    
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
    const search = useSearch('exercise', exerciseLibrary, userProfile);
    const cart = useCart('exercise');
    
    // Use custom exercise logging hook
    const { handleSelect, logCart, cartProps } = useExerciseLogging(
        exerciseLibrary, exerciseHistory, cart, search, dateTimePicker
    );
    
    const pinnedItems = (userProfile?.pinnedExercises && exerciseLibrary.items)
        ? userProfile.pinnedExercises.map(id => exerciseLibrary.items.find(e => e.id === id)).filter(Boolean)
        : [];

    const exerciseFilterOptions = {
        targets: getMuscleGroupCategoryNames(),
        equipmentCategories: ['bodyweight', 'gym', 'cardio'],
    };

    const availableEquipment = ensureAvailableEquipment(userProfile?.availableEquipment);
    let selectedEquipment = [];
    if (selectedFilter === 'bodyweight') selectedEquipment = availableEquipment.bodyweight;
    else if (selectedFilter === 'gym') selectedEquipment = availableEquipment.gym;
    else if (selectedFilter === 'cardio') selectedEquipment = availableEquipment.cardio;
    else selectedEquipment = [
        ...new Set([
            ...(availableEquipment.bodyweight || []),
            ...(availableEquipment.gym || []),
            ...(availableEquipment.cardio || [])
        ])
    ];

    if (exerciseLibrary.loading || exerciseHistory.loading) {
        return <div>Loading exercise data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            <LevelDisplay
                totalXP={userProfile?.totalXP || 0}
                workoutLogs={exerciseHistory.logs}
                accountCreationDate={accountCreationDate}
                className="mb-4"
            />
            <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-4">
                {/* Filter buttons above suggestions */}
                <div className="flex justify-center gap-2 mb-4">
                    <button
                        className={`px-4 py-2 rounded-l-full border border-gray-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${selectedFilter === 'bodyweight' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-800 hover:bg-blue-50'}`}
                        onClick={() => setSelectedFilter(selectedFilter === 'bodyweight' ? null : 'bodyweight')}
                    >
                        Body Weight
                    </button>
                    <button
                        className={`px-4 py-2 border-t border-b border-gray-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${selectedFilter === 'gym' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-800 hover:bg-blue-50'}`}
                        onClick={() => setSelectedFilter(selectedFilter === 'gym' ? null : 'gym')}
                    >
                        Gym Equipment
                    </button>
                    <button
                        className={`px-4 py-2 rounded-r-full border border-gray-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${selectedFilter === 'cardio' ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-gray-800 hover:bg-blue-50'}`}
                        onClick={() => setSelectedFilter(selectedFilter === 'cardio' ? null : 'cardio')}
                    >
                        Cardio
                    </button>
                </div>
                <WorkoutSuggestions
                    muscleScores={userProfile?.muscleScores || {}}
                    workoutLogs={exerciseHistory.logs}
                    exerciseLibrary={exerciseLibrary.items}
                    availableEquipment={selectedEquipment}
                    onAddToCart={handleSelect}
                    className="mb-4"
                    exerciseCategory={selectedFilter}
                    selectedBodyweight={availableEquipment.bodyweight}
                    selectedGym={availableEquipment.gym}
                    selectedCardio={availableEquipment.cardio}
                />
                {/* Toggle button for pinned exercises */}
                {pinnedItems.length > 0 && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPinnedExercises(!showPinnedExercises)}
                            className="text-xs"
                        >
                            {showPinnedExercises ? 'Hide' : 'Show'} Pinned Exercises ({pinnedItems.length})
                        </Button>
                    </div>
                )}
                {showPinnedExercises && (
                    <PinnedItemsGrid
                        items={pinnedItems}
                        onSelectItem={(item) => cart.addToCart(item, 1)}
                        onPinToggleItem={togglePinExercise}
                        itemType="exercise"
                    />
                )}
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
                    exerciseCategory={selectedFilter}
                    selectedBodyweight={availableEquipment.bodyweight}
                    selectedGym={availableEquipment.gym}
                    selectedCardio={availableEquipment.cardio}
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
            <PaywalledMuscleChart className="mt-4 px-4" />
        </div>
    );
} 