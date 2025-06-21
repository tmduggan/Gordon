import React from 'react';

// Component Imports
import SearchBar from '../components/Search/SearchBar';
import SearchResultItem from '../components/Search/SearchResultItem';
import CartTable from '../components/Cart/CartTable';
import DailySummary from '../components/nutrition/DailySummary';
import PinnedQuickAdd from '../components/PinnedQuickAdd';
import MacroDisplay from '../components/nutrition/MacroDisplay';
import LogTable from '../components/nutrition/LogTable';

// Hook Imports
import useCartLogger from '../hooks/useCartLogger';
import useLogFetcher from "../hooks/useLogFetcher";
import useFoodLibrary from '../hooks/useFoodLibrary';
import useSearchController from "../hooks/useSearchController";
import useAuthStore from "../store/useAuthStore";

// Utility Imports
import { getFoodMacros } from '../utils/dataUtils';

export default function NutritionPage() {
    const { user, userProfile, togglePinFood } = useAuthStore();
    
    // --- Hooks ---
    const foodLibrary = useFoodLibrary();
    const { logs, setLogs, getLogsForToday, groupLogsByTimeSegment, updateLog, deleteLog } = useLogFetcher(user);
    const search = useSearchController(foodLibrary);
    
    const saveFoodIfNeeded = async (food) => {
        if (foodLibrary.foods.some(f => f.id === food.id)) {
        return food.id;
        }
        return await foodLibrary.fetchAndSave(food);
    };
    
    const cart = useCartLogger('food', { user, foodList: foodLibrary.foods, saveFoodIfNeeded, setLogs });

    // Helper to calculate daily totals
    const calculateDailyTotals = (logsArr) => {
        const totals = { calories: 0, fat: 0, carbs: 0, protein: 0, fiber: 0 };
        logsArr.forEach(log => {
            const food = foodLibrary.foods.find(f => f.id === log.foodId);
            if (food) {
                const foodMacros = getFoodMacros(food);
                totals.calories += foodMacros.calories * log.serving;
                totals.fat += foodMacros.fat * log.serving;
                totals.carbs += foodMacros.carbs * log.serving;
                totals.protein += foodMacros.protein * log.serving;
                totals.fiber += foodMacros.fiber * log.serving;
            }
        });
        return totals;
    };

    const handleSelectFood = async (food) => {
        let foodToLog = food;
        if (food.isPreview) {
            const savedFood = await foodLibrary.fetchAndSave(food);
            if (savedFood) {
                foodToLog = savedFood;
            }
        }
        cart.addToCart(foodToLog);
        search.clearSearch();
    };
    
    const logCart = (timestampData) => {
        cart.logCart(timestampData);
    };

    // --- Derived State ---
    const pinnedFoodObjects = (userProfile?.pinnedFoods || [])
        .map(foodId => foodLibrary.foods.find(f => f.id === foodId))
        .filter(Boolean);

    const todayLogs = getLogsForToday();
    const dailyTotals = calculateDailyTotals(todayLogs);
    const logsByTimeSegment = groupLogsByTimeSegment(todayLogs);
    const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

    if (foodLibrary.loading) {
        return <div>Loading Nutrition Data...</div>;
    }

    return (
        <>
            {/* Search and Pinned Items Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <PinnedQuickAdd
                items={pinnedFoodObjects}
                onItemClick={(food) => cart.addToCart(food, 1)}
                onPinToggle={togglePinFood}
                onAddClick={() => { /* Logic for adding a new pinned item */ }}
                renderItem={(food) => {
                  const macros = getFoodMacros(food);
                  return (
                    <MacroDisplay macros={macros} format="stacked" truncateLength={25}>
                      {food.label || food.food_name}
                    </MacroDisplay>
                  );
                }}
              />
              <div className="relative mt-4">
                <SearchBar
                  label="Search Nutritionix"
                  placeholder="e.g., 1 cup of oatmeal"
                  query={search.searchQuery}
                  setQuery={search.setSearchQuery}
                  onSearch={search.handleApiSearch}
                  isLoading={search.searchLoading}
                />
                {search.searchResults.length > 0 && (
                  <ul className="absolute w-full bg-white border rounded-b-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {search.searchResults.map((food) => {
                      const macros = getFoodMacros(food);
                      const isPinned = userProfile?.pinnedFoods?.includes(food.id);
                      const foodName = food.food_name || food.label;
                      return (
                        <SearchResultItem
                          key={food.id || foodName}
                          onSelect={() => handleSelectFood(food)}
                          actionButton={
                            food.id && ( // Only show pin button for items that have an ID (i.e., are in our DB)
                                <button 
                                    className={`ml-2 text-yellow-500 hover:text-yellow-700 bg-white rounded-full w-6 h-6 flex items-center justify-center border border-gray-300`}
                                    onClick={(e) => { e.stopPropagation(); togglePinFood(food.id); }}
                                    title={isPinned ? "Unpin food" : "Pin food"}
                                >
                                    {isPinned ? '📌' : '📍'}
                                </button>
                            )
                          }
                        >
                          <MacroDisplay macros={macros} format="inline-text" truncateLength={40}>
                            {foodName}
                          </MacroDisplay>
                        </SearchResultItem>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Cart Section */}
            <CartTable
              foodCart={cart.cart}
              clearCart={cart.clearCart}
              updateCartItem={cart.updateCartItem}
              removeFromCart={cart.removeFromCart}
              logCart={logCart}
            />
            
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <DailySummary
                goals={userProfile?.goals || defaultGoals}
                dailyTotals={dailyTotals}
              />
              <LogTable
                logsByDate={logsByTimeSegment}
                getFoodById={(id) => foodLibrary.foods.find(f => f.id === id)}
                updateLog={updateLog}
                deleteLog={deleteLog}
              />
            </div>
        </>
    );
} 