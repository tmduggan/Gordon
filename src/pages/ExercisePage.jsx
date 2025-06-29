import React, { useMemo, useState } from 'react';

// Component Imports
import CartContainer from '../components/shared/Cart/CartContainer';
import Search from '../components/shared/Search/Search';
import DateTimePicker, { useDateTimePicker } from '../components/ui/DateTimePicker.tsx';
import MuscleChart from '../components/exercise/muscleData/MuscleChart';
import LevelDisplay from '../components/gamification/LevelDisplay';
import WorkoutSuggestions from '../components/exercise/WorkoutSuggestions';
import { Button } from '../components/ui/button';
import PaywalledMuscleChart from '../components/exercise/PaywalledMuscleChart';

// Hook Imports
import useCart from '../hooks/useCart';
import useHistory from "../hooks/useHistory";
import useLibrary from '../hooks/useLibrary';
import useSearch from '../hooks/useSearch';
import useAuthStore from "../store/useAuthStore";
import useExerciseLogging from '../hooks/useExerciseLogging';
import { ensureAvailableEquipment } from '../utils/dataUtils';
import { getMuscleGroupCategoryNames } from '../services/svgMappingService';
import { analyzeLaggingMuscles } from '../services/gamification/suggestionService';
import useExerciseLogStore from '../store/useExerciseLogStore';

export default function ExercisePage() {
    const { user, userProfile, togglePinExercise } = useAuthStore();
    const dateTimePicker = useDateTimePicker('exercise');
    const [selectedFilter, setSelectedFilter] = useState(null); // null = all
    const [showPinnedExercises, setShowPinnedExercises] = useState(false); // Temporarily hide pinned exercises
    const { fetchLogs } = useExerciseLogStore();
    React.useEffect(() => { fetchLogs(); }, [fetchLogs]);
    
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

    // Compute lagging muscles for search and suggestions
    const laggingMuscles = React.useMemo(() => {
        if (!userProfile || !exerciseHistory.logs || !exerciseLibrary.items) return [];
        return analyzeLaggingMuscles(userProfile.muscleScores, exerciseHistory.logs, exerciseLibrary.items);
    }, [userProfile, exerciseHistory.logs, exerciseLibrary.items]);

    if (exerciseLibrary.loading || exerciseHistory.loading) {
        return <div>Loading exercise data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            <LevelDisplay
                totalXP={userProfile?.totalXP || 0}
                workoutLogs={exerciseHistory.logs}
                accountCreationDate={accountCreationDate}
                className="mb-4 w-full"
                userProfile={userProfile}
            />
            <WorkoutSuggestions
                muscleScores={userProfile?.muscleScores || {}}
                exerciseLibrary={exerciseLibrary.items}
                availableEquipment={selectedEquipment}
                onAddToCart={handleSelect}
                exerciseCategory={selectedFilter}
                selectedBodyweight={availableEquipment.bodyweight}
                selectedGym={availableEquipment.gym}
                selectedCardio={availableEquipment.cardio}
                equipmentButtons={
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
                }
                className="mb-6 w-full"
                userProfile={userProfile}
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
                exerciseCategory={selectedFilter}
                selectedBodyweight={availableEquipment.bodyweight}
                selectedGym={availableEquipment.gym}
                selectedCardio={availableEquipment.cardio}
                laggingMuscles={laggingMuscles}
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
            <PaywalledMuscleChart className="mt-4 px-4" />
        </div>
    );
} 