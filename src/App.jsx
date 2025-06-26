import React, { useState, useEffect } from "react";
import useAuthStore from "./store/useAuthStore";
import Auth from "./Auth";
import ProfileMenu from "./ProfileMenu";
import MainPage from "./pages/MainPage";
import ExercisePage from "./pages/ExercisePage";
import FoodPage from "./pages/FoodPage";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

// Component Imports

// Add global debug functions for development
if (process.env.NODE_ENV === 'development') {
  window.debugUserProfile = () => {
    const { user, userProfile, isAdmin, isPremium, toggleSubscriptionStatus, ensureSubscriptionField } = useAuthStore.getState();
    
    return { user, userProfile, isAdmin: isAdmin(), isPremium: isPremium() };
  };
  
  window.fixUserProfile = async () => {
    const { ensureSubscriptionField, toggleSubscriptionStatus } = useAuthStore.getState();
    await ensureSubscriptionField();
  };
  
  window.toggleUserStatus = async () => {
    const { toggleSubscriptionStatus } = useAuthStore.getState();
    await toggleSubscriptionStatus();
  };
}

export default function App() {
  const { user, init, loading } = useAuthStore();

  // --- Initialize Auth Listener ---
  useEffect(() => {
    init();
  }, [init]);

  // --- UI State ---
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('exercise');
  const [theme, setTheme] = useState('theme-exercise');
  
  useEffect(() => {
    const favicon = document.getElementById('favicon');
    if (!favicon) return;
    if (activeTab === 'nutrition') {
      setTheme('theme-nutrition');
      favicon.href = '/nutrition-favicon.png';
    } else {
      setTheme('theme-exercise');
      favicon.href = '/exercise-favicon.png';
    }
  }, [activeTab]);

  const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const Navigation = () => (
    <div className="flex items-center space-x-3">
      <Button
        variant={activeTab === "exercise" ? "default" : "outline"}
        onClick={() => setActiveTab("exercise")}
        size="icon"
        className="h-12 w-12"
      >
        <img 
          src="/exercise-favicon.png" 
          alt="Exercise" 
          className="h-7 w-7"
        />
      </Button>
      <Button
        variant={activeTab === "nutrition" ? "default" : "outline"}
        onClick={() => setActiveTab("nutrition")}
        size="icon"
        className="h-12 w-12"
      >
        <img 
          src="/nutrition-favicon.png" 
          alt="Nutrition" 
          className="h-7 w-7"
        />
      </Button>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme}`}>
      <header className="bg-card shadow-md relative">
        <div className="container mx-auto px-4 py-2 flex justify-center items-center">
          <Navigation />
          <div className="absolute top-2 right-4">
            <ProfileMenu />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {activeTab === 'exercise' && <ExercisePage />}
        {activeTab === 'nutrition' && <FoodPage />}
      </main>
      <Toaster />
    </div>
  );
}