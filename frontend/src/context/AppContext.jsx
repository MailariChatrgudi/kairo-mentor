import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // ── Auth Session State ──
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('kairo_logged_in') === 'true';
  });

  // ── User Profile State ──
  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kairo_profile')) || null;
    } catch { return null; }
  });

  // ── Career Selection State ──
  const [selectedCareer, setSelectedCareer] = useState(() => {
    return localStorage.getItem('kairo_career') || null;
  });

  // ── Journey / Roadmap State ──
  const [roadmapData, setRoadmapData] = useState(null);
  const [journeyProgress, setJourneyProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kairo_journey')) || { currentPhase: 1, reflections: [] };
    } catch { 
      return { currentPhase: 1, reflections: [] }; 
    }
  });

  const [currentDay, setCurrentDay] = useState(
    parseInt(localStorage.getItem('kairo_current_day')) || 1
  );

  const updateCurrentDay = (day) => {
    const d = parseInt(day) || 1;
    setCurrentDay(d);
    localStorage.setItem('kairo_current_day', d);
  };

  // ── Sync with localStorage ──
  useEffect(() => {
    localStorage.setItem('kairo_logged_in', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    if (userProfile) localStorage.setItem('kairo_profile', JSON.stringify(userProfile));
    else localStorage.removeItem('kairo_profile');
  }, [userProfile]);

  useEffect(() => {
    if (selectedCareer) {
        localStorage.setItem('kairo_career', selectedCareer);
    }
  }, [selectedCareer]);

  useEffect(() => {
    localStorage.setItem('kairo_journey', JSON.stringify(journeyProgress));
  }, [journeyProgress]);

  const [fullUserData, setFullUserData] = useState(null);

  const logout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserProfile(null);
    setSelectedCareer(null);
    setRoadmapData(null);
    setJourneyProgress({ currentPhase: 1, reflections: [] });
    setFullUserData(null);
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn, setIsLoggedIn,
        userProfile, setUserProfile,
        selectedCareer, setSelectedCareer,
        roadmapData, setRoadmapData,
        journeyProgress, setJourneyProgress,
        currentDay, updateCurrentDay,
        fullUserData, setFullUserData,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};
