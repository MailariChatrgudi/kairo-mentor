import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Context
import { AppProvider, useAppContext } from './context/AppContext';

// Import Pages
import SplashScreen from './pages/SplashScreen';
import Onboarding from './pages/Onboarding';
import ProfileSetup from './pages/ProfileSetup';
import CareerSelect from './pages/CareerSelect';
import Dashboard from './pages/Dashboard';
import MentorChat from './pages/MentorChat';
import SkillHub from './pages/SkillHub';
import Opportunities from './pages/Opportunities';
import VideoConsole from './pages/VideoConsole';
import CollegeInfo from './pages/CollegeInfo';
import GrindOrb from './components/GrindOrb';

import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, selectedCareer } = useAppContext();
  
  if (!isLoggedIn && !selectedCareer) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

function AppRoutes() {
  const location = useLocation();

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/setup" element={<ProfileSetup />} />
          <Route path="/career-select" element={<CareerSelect />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/mentor" element={<ProtectedRoute><MentorChat /></ProtectedRoute>} />
          <Route path="/skills" element={<ProtectedRoute><SkillHub /></ProtectedRoute>} />
          <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
          <Route path="/colleges" element={<ProtectedRoute><CollegeInfo /></ProtectedRoute>} />
          <Route path="/learn/:videoTitle" element={<ProtectedRoute><VideoConsole /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <GrindOrb />
    </AppProvider>
  );
}

export default App;
