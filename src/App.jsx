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

export default function App() {
  const { user, init } = useAuthStore();

  // --- Initialize Auth Listener ---
  useEffect(() => {
    init();
  }, [init]);

  // --- UI State ---
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  
  const defaultGoals = { calories: 2300, fat: 65, carbs: 280, protein: 180, fiber: 32 };

  // --- Render Logic ---
  if (!user) {
    return <Auth />;
  }

  const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
      <div className="flex items-center space-x-2">
        <Button
          variant={location.pathname === "/exercise" ? "default" : "outline"}
          onClick={() => navigate("/exercise")}
          size="icon"
          className="h-10 w-10"
        >
          <img 
            src="/exercise-favicon.png" 
            alt="Exercise" 
            className="h-6 w-6"
          />
        </Button>
        <Button
          variant={location.pathname === "/nutrition" ? "default" : "outline"}
          onClick={() => navigate("/nutrition")}
          size="icon"
          className="h-10 w-10"
        >
          <img 
            src="/nutrition-favicon.png" 
            alt="Nutrition" 
            className="h-6 w-6"
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
        <header className="bg-card shadow-md">
          <div className="container mx-auto px-4 py-2 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Navigation />
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