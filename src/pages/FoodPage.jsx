import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LevelDisplay from '../components/gamification/LevelDisplay';

// Component Imports
import CartContainer from '../components/shared/Cart/CartContainer';
import Search from '../components/shared/Search/Search';
import HistoryView from '../components/shared/HistoryView';
import DateTimePicker, { useDateTimePicker } from '../components/ui/DateTimePicker.tsx';
import DailySummary from '../components/nutrition/DailySummary';
import DailyTotalsCard from '../components/nutrition/DailyTotalsCard';
import SuggestedFoodsCard from '../components/nutrition/SuggestedFoodsCard';

// Hook Imports
import useCart from '../hooks/useCart';
import useHistory from "../hooks/useHistory";
import useLibrary from '../hooks/useLibrary';
import useSearch from '../hooks/useSearch';
import useAuthStore from "../store/useAuthStore";
import useFoodLogging from '../hooks/useFoodLogging';

// Utility Imports
import { getFoodMacros } from '../utils/dataUtils';

export default function FoodPage() {
    const { userProfile, togglePinFood, addRecipe, deleteRecipe, user, saveUserProfile } = useAuthStore();
    const dateTimePicker = useDateTimePicker('food');
    
    // Initialize hooks
    const foodLibrary = useLibrary('food');
    const foodHistory = useHistory('food');
    const cart = useCart('food');
    
    // Use custom food logging hook with nutrients support
    const { handleSelect, handleNutrientsAdd, logCart, showAllHistory, setShowAllHistory } = useFoodLogging(
        foodLibrary, cart, null, dateTimePicker
    );
    
    // Initialize search with nutrients callback
    const search = useSearch('food', foodLibrary, userProfile, {
        onNutrientsAdd: handleNutrientsAdd
    });

    const pinnedItems = (userProfile?.pinnedFoods && foodLibrary.items)
        ? userProfile.pinnedFoods.map(id => foodLibrary.items.find(f => f.id === id)).filter(Boolean)
        : [];
    
    const recipes = userProfile?.recipes || [];
    
    const todayLogs = foodHistory.getLogsForToday();
    const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

    const historyProps = {
        logs: showAllHistory ? foodHistory.logs : todayLogs,
        goals: userProfile?.goals || defaultGoals,
        getFoodById: (id) => foodLibrary.items.find(f => f.id === id),
        updateLog: foodHistory.updateLog,
        deleteLog: foodHistory.deleteLog,
    };

    const handleRecipeCreated = async (recipe) => {
        await addRecipe(recipe);
        cart.clearCart();
        cart.addToCart(recipe, 1);
    };

    const handleRecipeSelect = (recipe) => {
        cart.addToCart(recipe, 1);
    };

    const handleRecipeDelete = async (recipeId) => {
        await deleteRecipe(recipeId);
    };

    // Get account creation date (use user creation time or default to 30 days ago)
    const accountCreationDate = useMemo(() => {
        if (user?.metadata?.creationTime) {
            return new Date(user.metadata.creationTime);
        }
        // Default to 30 days ago if no creation time available
        return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }, [user]);

    const [aiUsage, setAiUsage] = useState(() => {
        const today = new Date().toISOString().split('T')[0];
        return userProfile?.aiFoodSuggestionUsage?.date === today
            ? userProfile.aiFoodSuggestionUsage.count
            : 0;
    });

    const isAdmin = userProfile?.subscription?.status === 'admin';
    const isPremium = userProfile?.subscription?.status === 'premium';

    const handleUsage = async () => {
        const today = new Date().toISOString().split('T')[0];
        const newUsage = aiUsage + 1;
        setAiUsage(newUsage);
        const updatedProfile = {
            ...userProfile,
            aiFoodSuggestionUsage: { date: today, count: newUsage }
        };
        await saveUserProfile(updatedProfile);
    };

    const handleResetUsage = async () => {
        setAiUsage(0);
        const today = new Date().toISOString().split('T')[0];
        const updatedProfile = {
            ...userProfile,
            aiFoodSuggestionUsage: { date: today, count: 0 }
        };
        await saveUserProfile(updatedProfile);
    };

    if (foodLibrary.loading || foodHistory.loading) {
        return <div>Loading food data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            {/* XP Progress at the very top */}
            <LevelDisplay
                totalXP={userProfile?.totalXP || 0}
                workoutLogs={foodHistory.logs}
                accountCreationDate={accountCreationDate}
                className="mb-4"
                userProfile={userProfile}
            />
            {(isPremium || isAdmin) && (
                <SuggestedFoodsCard
                    foodLog={todayLogs}
                    nutritionGoals={userProfile?.goals || { calories: 2000, protein: 150, carbs: 200, fat: 60, fiber: 25 }}
                    onAddFoods={handleRecipeCreated}
                    usage={aiUsage}
                    onUsage={handleUsage}
                    isAdmin={isAdmin}
                    onResetUsage={handleResetUsage}
                />
            )}
            <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-4">
                <Search
                    type="food"
                    searchQuery={search.searchQuery}
                    setSearchQuery={search.setSearchQuery}
                    searchResults={search.searchResults}
                    handleApiSearch={search.handleApiSearch}
                    handleNutrientsSearch={search.handleNutrientsSearch}
                    handleSelect={handleSelect}
                    isLoading={search.searchLoading}
                    nutrientsLoading={search.nutrientsLoading}
                    userProfile={userProfile}
                    togglePin={togglePinFood}
                    getFoodMacros={getFoodMacros}
                    placeholder="e.g., 1 cup of oatmeal"
                    filters={search.filters}
                    setFilters={search.setFilters}
                />
                {cart.cart.length > 0 && (
                    <CartContainer
                        title="Your Food Cart"
                        type="food"
                        items={cart.cart}
                        icon="🛒"
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
                        onRecipeCreated={handleRecipeCreated}
                    />
                )}
            </div>
            
            {/* <DailySummary 
                foodLibrary={foodLibrary.items} 
                cart={cart.cart}
                cartTimePeriod={dateTimePicker.timePeriod}
            /> */}
            
            <DailyTotalsCard
                logs={todayLogs}
                goals={userProfile?.goals || { calories: 2000, protein: 150, carbs: 200, fat: 60, fiber: 25 }}
                getFoodById={(id) => foodLibrary.items.find(f => f.id === id)}
            />
            
            <HistoryView
                type="food"
                {...historyProps}
            />
            {!showAllHistory && foodHistory.logs.length > todayLogs.length && (
                <div className="text-center mt-4">
                    <Button variant="link" onClick={() => setShowAllHistory(true)}>
                        Show Full History
                    </Button>
                </div>
            )}
        </div>
    );
} 