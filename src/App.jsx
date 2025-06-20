import React, { useState, useEffect, useRef } from "react";
import { db, auth } from './firebase';

// Component Imports
import Auth from './Auth';
import ProfileMenu from './ProfileMenu';
import DailyGoalsModal from './DailyGoalsModal';
import Exercise from './Exercise';
import SearchBar from './components/Search/SearchBar';
import SearchResultItem from './components/Search/SearchResultItem';
import CartTable from './components/Cart/CartTable';
import DailySummary from './components/nutrition/DailySummary';
import PinnedQuickAdd from './components/PinnedQuickAdd';
import MacroDisplay from './components/nutrition/MacroDisplay';
import LogTable from './components/nutrition/LogTable';

// Hook Imports
import useUserProfile from './hooks/useUserProfile';
import useCartLogger from './hooks/useCartLogger';
import useLogFetcher from "./hooks/useLogFetcher";
import useFoodLibrary from './hooks/useFoodLibrary';

// Utility Imports
import { timeZoneOptions, getTimeSegment, getDefaultTimeSegment, formatTimeForDisplay, parseTimeFromDisplay } from './utils/timeUtils';
import { getFoodMacros, slugify } from './utils/dataUtils';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('nutrition'); // or 'exercise'
  
  // --- Hooks ---
  const { userProfile, profileLoading, saveUserProfile, defaultGoals } = useUserProfile(user);
  const foodLibrary = useFoodLibrary();
  const { logs, setLogs, getLogsForToday, groupLogsByTimeSegment, updateLog, deleteLog } = useLogFetcher(user);
  
  const saveFoodIfNeeded = async (food) => {
    if (foodLibrary.foods.some(f => f.id === food.id)) {
      return food.id;
    }
    return await foodLibrary.fetchAndSave(food);
  };
  
  const cart = useCartLogger('food', { user, foodList: foodLibrary.foods, saveFoodIfNeeded, setLogs });

  // Helper to calculate daily totals, requires logs and foodList.
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

  // --- State for UI that doesn't belong in a hook ---
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Cart Timestamp State
  const now = new Date();
  let defaultHour = now.getHours();
  const [cartDate, setCartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cartHour12, setCartHour12] = useState(((defaultHour % 12) || 12));
  const [cartMinute, setCartMinute] = useState(now.getMinutes());
  const [cartAmPm, setCartAmPm] = useState(defaultHour >= 12 ? 'PM' : 'AM');

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Live search for local foods ---
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
        return;
    }
    if (!foodLibrary.foods) {
      return;
    }
    const localResults = foodLibrary.foods.filter(food =>
      (food.label || food.food_name).toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(localResults);
  }, [searchQuery, foodLibrary.foods]);

  // --- Handlers ---
  const handleApiSearch = async () => {
    if (!searchQuery) return;
    setSearchLoading(true);
    const apiResults = await foodLibrary.searchNutritionix(searchQuery) || [];
    // Combine with existing local results, avoiding duplicates
    setSearchResults(prevResults => {
      const combined = [...prevResults];
      apiResults.forEach(apiFood => {
        if (!combined.some(localFood => localFood.label === apiFood.food_name)) {
          combined.push({ ...apiFood, isPreview: true });
        }
      });
      return combined;
    });
    setSearchLoading(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
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
    clearSearch();
  };

  const togglePinFood = async (foodId) => {
    if (!userProfile || !user) return;
    const currentPinned = userProfile.pinnedFoods || [];
    const newPinned = currentPinned.includes(foodId)
      ? currentPinned.filter(id => id !== foodId)
      : [...currentPinned, foodId];
    await saveUserProfile({ ...userProfile, pinnedFoods: newPinned });
  };
  
  const logCart = () => {
    cart.logCart({ cartDate, cartHour12, cartMinute, cartAmPm });
  };

  // --- Derived State ---
  const pinnedFoodObjects = (userProfile?.pinnedFoods || [])
    .map(foodId => foodLibrary.foods.find(f => f.id === foodId))
    .filter(Boolean);

  const todayLogs = getLogsForToday();
  const dailyTotals = calculateDailyTotals(todayLogs);
  const logsByTimeSegment = groupLogsByTimeSegment(todayLogs);

  // --- Render Logic ---
  if (loading || profileLoading || foodLibrary.loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto p-4">
        <div className="relative flex items-center justify-between mb-6">
          <div className="w-10"></div> {/* Spacer */}
          <h1 className="text-3xl font-bold text-center">
            <span role="img" aria-label="Chef">👨🏻‍🍳</span> GORDON <span role="img" aria-label="Chef">👨🏻‍🍳</span>
          </h1>
          <div className="relative">
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-300 hover:border-blue-500"
                onClick={() => setProfileMenuOpen(v => !v)}
              />
              {profileMenuOpen && (
                <ProfileMenu
                user={user}
                userProfile={userProfile}
                  onSignOut={() => { auth.signOut(); setProfileMenuOpen(false); }}
                onOpenGoals={() => { setGoalsModalOpen(true); setProfileMenuOpen(false); }}
                onSwitchView={(view) => { setCurrentView(view); setProfileMenuOpen(false); }}
                currentView={currentView}
                />
              )}
            </div>
          </div>

        {goalsModalOpen && (
          <DailyGoalsModal
            onClose={() => setGoalsModalOpen(false)}
            onSave={(newGoals) => {
              saveUserProfile({ ...userProfile, goals: newGoals });
              setGoalsModalOpen(false);
            }}
            initialGoals={userProfile?.goals || defaultGoals}
          />
        )}

        {currentView === 'nutrition' ? (
          <>
            {/* Search and Pinned Items Section */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Pinned Foods</h3>
              <PinnedQuickAdd
                items={pinnedFoodObjects}
                onItemClick={(food) => cart.addToCart(food, 1)}
                onPinToggle={togglePinFood}
                onAddClick={() => { /* Logic for adding a new pinned item */ }}
                renderItem={(food) => {
                  const macros = getFoodMacros(food);
                  return (
                    <MacroDisplay macros={macros} format="stacked">
                      {food.label || food.food_name}
                    </MacroDisplay>
                  );
                }}
              />
              <div className="relative mt-4">
                <SearchBar
                  label="Search Nutritionix"
                  placeholder="e.g., 1 cup of oatmeal"
                  query={searchQuery}
                  setQuery={setSearchQuery}
                  onSearch={handleApiSearch}
                  isLoading={searchLoading}
                />
                {searchResults.length > 0 && (
                  <ul className="absolute w-full bg-white border rounded-b-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {searchResults.map((food) => {
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
                          <MacroDisplay macros={macros} format="inline-text">
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
              cartDate={cartDate}
              setCartDate={setCartDate}
              cartHour12={cartHour12}
              setCartHour12={setCartHour12}
              cartMinute={cartMinute}
              setCartMinute={setCartMinute}
              cartAmPm={cartAmPm}
              setCartAmPm={setCartAmPm}
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
        ) : (
          <Exercise user={user} userProfile={userProfile} />
      )}
      </div>
    </div>
  );
}