import React, { useState, useEffect } from "react";
import { auth } from './firebase';

// Component Imports
import Auth from './Auth';
import ProfileMenu from './ProfileMenu';
import DailyGoalsModal from './DailyGoalsModal';
import ViewToggler from "./components/ViewToggler";
import NutritionPage from "./pages/NutritionPage";
import ExercisePage from "./pages/ExercisePage";
import ExerciseLibraryPage from "./pages/ExerciseLibraryPage";

// Hook Imports
import useAuthStore from "./store/useAuthStore";

export default function App() {
  const { user, userProfile, loading, init, saveUserProfile } = useAuthStore();
  const [currentView, setCurrentView] = useState('nutrition'); // 'nutrition', 'exercise', or 'exerciseLibrary'

  // --- Initialize Auth Listener ---
  useEffect(() => {
    init();
  }, [init]);

  // --- UI State ---
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

  // --- Render Logic ---
  if (loading) {
    return <div className="text-center p-8">Initializing App...</div>;
  }

    if (!user) {
    return <Auth />;
  }

  const isExerciseView = currentView === 'exercise';

  return (
    <div className={`min-h-screen font-sans ${isExerciseView ? 'bg-blue-50' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto p-4">
        <div className="relative flex items-center justify-between mb-6">
          <div className="w-10"></div> {/* Spacer */}
          <h1 className="text-3xl font-bold text-center">
            {isExerciseView ? '💪 GOLIATH 💪' : '👨🏻‍🍳 GORDON 👨🏻‍🍳'}
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
                  onSignOut={() => { auth.signOut(); setProfileMenuOpen(false); }}
                  onOpenGoals={() => { setGoalsModalOpen(true); setProfileMenuOpen(false); }}
                  onSwitchView={(view) => { setCurrentView(view); setProfileMenuOpen(false); }}
                  currentView={currentView}
                />
              )}
            </div>
          </div>

        {currentView !== 'exerciseLibrary' && <ViewToggler currentView={currentView} onSwitchView={setCurrentView} />}

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

        {currentView === 'nutrition' && <NutritionPage />}
        {currentView === 'exercise' && <ExercisePage />}
        {currentView === 'exerciseLibrary' && <ExerciseLibraryPage />}
            </div>
    </div>
  );
}