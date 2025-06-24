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

// Hook Imports
import useCart from '../hooks/useCart';
import useHistory from "../hooks/fetchHistory";
import useLibrary from '../hooks/fetchLibrary';
import useSearch from '../hooks/useSearch';
import useAuthStore from "../store/useAuthStore";
import useFoodLogging from '../hooks/useFoodLogging';

// Utility Imports
import { getFoodMacros } from '../utils/dataUtils';

export default function FoodPage() {
    const { userProfile, togglePinFood } = useAuthStore();
    const dateTimePicker = useDateTimePicker('food');
    
    // Initialize hooks
    const foodLibrary = useLibrary('food');
    const foodHistory = useHistory('food');
    const search = useSearch('food', foodLibrary);
    const cart = useCart('food');
    
    // Use custom food logging hook
    const { handleSelect, logCart, showAllHistory, setShowAllHistory } = useFoodLogging(
        foodLibrary, cart, search, dateTimePicker
    );

    const pinnedItems = (userProfile?.pinnedFoods && foodLibrary.items)
        ? userProfile.pinnedFoods.map(id => foodLibrary.items.find(f => f.id === id)).filter(Boolean)
        : [];
    
    const todayLogs = foodHistory.getLogsForToday();
    const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

    const historyProps = {
        logs: showAllHistory ? foodHistory.logs : todayLogs,
        goals: userProfile?.goals || defaultGoals,
        getFoodById: (id) => foodLibrary.items.find(f => f.id === id),
        updateLog: foodHistory.updateLog,
        deleteLog: foodHistory.deleteLog,
    };

    if (foodLibrary.loading || foodHistory.loading) {
        return <div>Loading food data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto w-full">
            <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-4">
                <PinnedItemsGrid
                    items={pinnedItems}
                    onSelectItem={(item) => cart.addToCart(item, 1)}
                    onPinToggleItem={togglePinFood}
                    itemType="food"
                />
                <Search
                    type="food"
                    searchQuery={search.searchQuery}
                    setSearchQuery={search.setSearchQuery}
                    searchResults={search.searchResults}
                    handleApiSearch={search.handleApiSearch}
                    handleSelect={handleSelect}
                    isLoading={search.searchLoading}
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
                    />
                )}
            </div>
            
            <DailySummary 
                foodLibrary={foodLibrary.items} 
                cart={cart.cart}
                cartTimePeriod={dateTimePicker.timePeriod}
            />
            
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