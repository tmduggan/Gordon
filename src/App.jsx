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
import MuscleChartPage from "./pages/MuscleChartPage";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";

// Component Imports
import DailyGoalsModal from './DailyGoalsModal';

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
        >
          Exercise
        </Button>
        <Button
          variant={location.pathname === "/nutrition" ? "default" : "outline"}
          onClick={() => navigate("/nutrition")}
        >
          Nutrition
        </Button>
        <Button
          variant={location.pathname === "/muscle-chart" ? "default" : "outline"}
          onClick={() => navigate("/muscle-chart")}
        >
          Chart
        </Button>
      </div>
    );
  };

  const MainApp = () => {
    const location = useLocation();
    const [theme, setTheme] = useState('theme-exercise');
    const [iconSrc, setIconSrc] = useState('/exercise-favicon.png');

    useEffect(() => {
      const favicon = document.getElementById('favicon');
      if (!favicon) return;

      if (location.pathname.includes('/nutrition')) {
        setTheme('theme-nutrition');
        const newIcon = '/nutrition-favicon.png';
        favicon.href = newIcon;
        setIconSrc(newIcon);
      } else if (location.pathname.includes('/exercise')) {
        setTheme('theme-exercise');
        const newIcon = '/exercise-favicon.png';
        favicon.href = newIcon;
        setIconSrc(newIcon);
      }
    }, [location]);

    return (
      <div className={`min-h-screen ${theme}`}>
        <header className="bg-card shadow-md">
          <div className="container mx-auto px-4 py-2 flex justify-between items-center">
            <img src={iconSrc} alt="Goliath Logo" className="h-10 w-10 rounded-lg" />
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
            <Route path="/muscle-chart" element={<MuscleChartPage />} />
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