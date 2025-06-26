import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import useAuthStore from "./store/useAuthStore";
import Auth from "./Auth";
import ProfileMenu from "./ProfileMenu";
import MainPage from "./pages/MainPage";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

// Component Imports

// Add global debug functions for development
if (process.env.NODE_ENV === 'development') {
  window.debugUserProfile = () => {
    const { user, userProfile, isAdmin, isPremium, toggleSubscriptionStatus, ensureSubscriptionField } = useAuthStore.getState();
    
    console.log('=== USER PROFILE DEBUG ===');
    console.log('User:', user);
    console.log('User Profile:', userProfile);
    console.log('Subscription Status:', userProfile?.subscription?.status);
    console.log('Is Admin:', isAdmin());
    console.log('Is Premium:', isPremium());
    console.log('========================');
    
    return { user, userProfile, isAdmin: isAdmin(), isPremium: isPremium() };
  };
  
  window.fixUserProfile = async () => {
    const { ensureSubscriptionField, toggleSubscriptionStatus } = useAuthStore.getState();
    await ensureSubscriptionField();
    console.log('User profile subscription field ensured');
  };
  
  window.toggleUserStatus = async () => {
    const { toggleSubscriptionStatus } = useAuthStore.getState();
    await toggleSubscriptionStatus();
    console.log('User subscription status toggled');
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

  const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
      <div className="flex items-center space-x-3">
        <Button
          variant={location.pathname === "/exercise" ? "default" : "outline"}
          onClick={() => navigate("/exercise")}
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
          variant={location.pathname === "/nutrition" ? "default" : "outline"}
          onClick={() => navigate("/nutrition")}
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
  };

  const MainApp = () => {
    const location = useLocation();
    const [theme, setTheme] = useState('theme-exercise');

    useEffect(() => {
      const favicon = document.getElementById('favicon');
      if (!favicon) return;

      if (location.pathname.includes('/nutrition')) {
        setTheme('theme-nutrition');
        const newIcon = '/nutrition-favicon.png';
        favicon.href = newIcon;
      } else if (location.pathname.includes('/exercise')) {
        setTheme('theme-exercise');
        const newIcon = '/exercise-favicon.png';
        favicon.href = newIcon;
      }
    }, [location]);

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
          <Routes>
            <Route path="/" element={<Navigate to="/exercise" />} />
            <Route path="/nutrition" element={<MainPage type="food" />} />
            <Route path="/exercise" element={<MainPage type="exercise" />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    );
  };

  return (
    <Router>
      <MainApp />
    </Router>
  );
}