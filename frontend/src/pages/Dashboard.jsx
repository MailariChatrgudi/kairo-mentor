import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, ArrowRight, CheckCircle2, BookOpen, Briefcase, PlayCircle, 
  Loader2, ExternalLink, ChevronRight, Book, ClipboardCheck, HelpCircle, Play, Lock,
  Target
} from 'lucide-react';
import Card from '../components/Card';
import BottomNav from '../components/BottomNav';
import StreakCard from '../components/StreakCard';
import ContributionGrid from '../components/ContributionGrid';
import VideoModal from '../components/VideoModal';
import QuizModal from '../components/QuizModal';
import CollegePredictor from './CollegePredictor';
import { useAppContext } from '../context/AppContext';
import './Dashboard.css';

const logoPath = '/logo.jpeg';
const placeholderLogo = 'https://ui-avatars.com/api/?name=K&background=C8A951&color=fff';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const quickActions = [
  { icon: BookOpen,  label: 'Skill Hub',     path: '/skills',        color: '#A89848' },
  { icon: Briefcase, label: 'Opportunities', path: '/opportunities', color: '#8B8040' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, selectedCareer, journeyProgress, setFullUserData, logout } = useAppContext();
  const displayName = userProfile?.name || 'Student';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [todayPlan, setTodayPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState({ streak: 0, activity: {} });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const [weekPlan, setWeekPlan] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1); // Default to day 1 until progress loads
  const [showUnlockBanner, setShowUnlockBanner] = useState(false);
  const [unlockedDayNum, setUnlockedDayNum] = useState(null);
  
  // Safe user_id generation for demo
  const userId = displayName.toLowerCase().replace(/\s+/g, '_') || 'demo_user';

  const fetchTodayPlan = () => {
    if (!selectedCareer) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/get_today_plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        career: selectedCareer,
        level: 'beginner',
        day: selectedDay,
        language: userProfile?.preferred_language || 'English',
        user_id: userId
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTodayPlan(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const refreshDashboard = () => {
    if (!userId) return;

    // A. Fetch Progress
    fetch(`${API_BASE}/api/get_progress/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserProgress(data.progress);
          // Only auto-jump if first time or specifically needed, 
          // usually keep user context
        }
      });

    // B. Fetch Full User Stats
    fetch(`${API_BASE}/api/get_user/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setFullUserData(data.user);
          setProgressData(data.user.progress || { streak: 0, activity: {} });
        }
      })
      .catch(console.error);

    // B-2. Fetch Weekly Plan
    fetch(`${API_BASE}/api/get_week_plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(r => r.json())
    .then(data => {
        if(data.success) {
            setWeekPlan(data.week_plan);
        }
    }).catch(err => console.error("Week plan fetch failed", err));

    // C. Fetch Today's Plan
    fetchTodayPlan();
  };

  useEffect(() => {
    refreshDashboard();

    // D. Sync Listener
    const onFocus = () => {
      refreshDashboard();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [selectedCareer, userProfile, userId, selectedDay]);

  // Handle task completion (updates streak and activity)
  const handleTaskComplete = (taskId) => {
     fetch(`${API_BASE}/api/update_progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, task_id: taskId, day: journeyProgress?.currentPhase || 1 })
     })
     .then(r => r.json())
     .then(data => {
        if(data.success) {
            setProgressData(data.progress);
        }
     }).catch(console.error);
  };


  // ── IST Greeting Logic ────────────────────────────────────────────────────
  const getGreetingConfig = useCallback(() => {
    // Use local system time (IST on user's device)
    const hour = new Date().getHours();

    // Hustle phases → weight 900, solid black, tight tracking
    const hardcore = {
      color: '#000000',
      fontWeight: 900,
      letterSpacing: '-0.02em',
    };
    // Standard phases → weight 500, still solid black for max contrast
    const standard = {
      color: '#000000',
      fontWeight: 500,
    };

    // 12:00 AM – 4:59 AM
    if (hour >= 0  && hour < 5)  return { text: 'Elite Hours! 💎',      style: hardcore };
    // 5:00 AM – 8:59 AM
    if (hour >= 5  && hour < 9)  return { text: 'Good morning ☀️',      style: standard };
    // 9:00 AM – 11:59 AM
    if (hour >= 9  && hour < 12) return { text: 'Morning Grinding! ⚙️', style: hardcore };
    // 12:00 PM – 4:59 PM
    if (hour >= 12 && hour < 17) return { text: 'Good afternoon ☕',     style: standard };
    // 5:00 PM – 8:59 PM
    if (hour >= 17 && hour < 21) return { text: 'Good evening 🌆',       style: standard };
    // 9:00 PM – 11:59 PM
    return                               { text: 'Grinding! 🔥',          style: hardcore };
  }, []);

  // Live-update the greeting every minute so it switches automatically
  const [greetingConfig, setGreetingConfig] = useState(() => getGreetingConfig());

  useEffect(() => {
    setGreetingConfig(getGreetingConfig());
    const id = setInterval(() => setGreetingConfig(getGreetingConfig()), 60_000);
    return () => clearInterval(id);
  }, [getGreetingConfig]);

  return (
    <div className="dashboard lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <motion.div className="dashboard__content max-w-5xl mx-auto p-4 lg:p-10 lg:pt-8" variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div className="dashboard__header" variants={item}>
          <div>
            <p className="dashboard__greeting" style={greetingConfig.style}>
              {greetingConfig.text}
            </p>
            <h1 className="dashboard__name">{displayName} ✨</h1>
          </div>
          <div className="dashboard__avatar" onClick={handleLogout} style={{ cursor: 'pointer' }} title="Log out">
            <img src={logoPath} alt="Avatar" onError={(e) => e.target.src = placeholderLogo} />
          </div>
        </motion.div>

        {/* User Progress Tracker (Streak & Grid) */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8 mt-2">
           <div className="col-span-1 h-full">
             <StreakCard streak={progressData?.streak || 0} />
           </div>
           <div className="lg:col-span-2 h-full">
             <ContributionGrid activity={progressData?.activity || {}} />
           </div>
        </motion.div>

        {/* 1-Week Roadmap Section (LOCKED SYSTEM) */}
        {selectedCareer ? (
          <>
            <motion.div className="dashboard__section" variants={item}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="dashboard__section-title">Weekly Roadmap</h2>
                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  <span className="dot w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                  7-Day Sprint
                </div>
              </div>
              
              <div className="weekly-scroll">
                {weekPlan.map((dayData, idx) => {
                  const isSelected = dayData.day === selectedDay;
                  const isCurrent = dayData.day === (journeyProgress?.currentPhase || 1);
                  const isCompleted = dayData.videos?.length > 0 && dayData.videos.every(v => v.completed);
                  
                  return (
                    <div 
                      key={idx} 
                      className={`weekly-card ${dayData.locked ? 'is-locked' : 'is-unlocked'} ${isSelected ? 'is-selected' : ''} ${isCurrent ? 'is-current' : ''} ${isCompleted ? 'is-completed' : ''}`}
                      onClick={() => {
                        setLoading(true);
                        setTodayPlan(null);
                        setSelectedDay(dayData.day);
                      }}
                    >
                      <div className="weekly-card__header">
                        <span className="day-label">Day {dayData.day}</span>
                        {dayData.locked ? (
                          <Lock size={14} className="text-gray-400" />
                        ) : isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : isCurrent ? (
                          <div className="pulse-indicator"></div>
                        ) : null}
                      </div>
                    <h4 className="weekly-card__title">{dayData.title}</h4>
                    <div className="weekly-card__video-count">
                        {dayData.videos?.length || 0} Lessons
                    </div>
                    {dayData.locked && <div className="locked-overlay-subtle"></div>}
                  </div>
                  );
                })}
              </div>
            </motion.div>

        {/* Roadmap View (Based on Reference) */}
        <motion.div className="roadmap-view" variants={item}>
          {/* Banner Area */}
          <div className={`roadmap-banner ${selectedDay > (journeyProgress?.currentPhase || 1) ? 'is-preview' : ''}`}>
             <div className="flex justify-between items-start w-full">
               <div>
                 <span className="roadmap-banner__label">
                   {selectedDay > (journeyProgress?.currentPhase || 1) ? '🔮 PREVIW MODE' : (selectedCareer?.toUpperCase() || 'CAREER PATH')}
                 </span>
                <h2 className="roadmap-banner__title">
                  {loading ? `Loading Day ${selectedDay}...` : `Day ${selectedDay}: ${todayPlan?.topic || 'Curriculum Overview'}`}
                </h2>
               </div>
               {selectedDay !== (journeyProgress?.currentPhase || 1) && (
                 <button 
                   onClick={() => setSelectedDay(journeyProgress?.currentPhase || 1)}
                   className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg backdrop-blur-md transition-all font-bold"
                 >
                   Return to Today
                 </button>
               )}
             </div>
          </div>

          {/* Timeline List */}
          <div className="roadmap-list-container">
            {loading ? (
              <div className="flex items-center gap-2 p-8 justify-center">
                 <Loader2 size={20} className="spin" color="#666"/>
                 <span className="text-gray-500 font-medium">Loading roadmap...</span>
              </div>
            ) : !todayPlan ? (
              <div className="text-center py-20 px-6">
                 <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={32} className="text-amber-500" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-800 mb-2">No Roadmap Found</h3>
                 <p className="text-gray-500 text-sm mb-6">Complete your profile to see your daily learning path.</p>
                 <button 
                    onClick={() => navigate('/onboarding')}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200"
                 >
                    Set Up Profile
                 </button>
              </div>
            ) : (
              <div className="roadmap-list-container">
                {weekPlan.find(d => d.day === selectedDay)?.locked && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center gap-3">
                    <Lock className="text-amber-600" size={20} />
                    <div>
                      <p className="text-amber-800 font-bold text-sm">🔒 Preview Mode</p>
                      <p className="text-amber-700 text-xs">Complete Day {selectedDay - 1} to unlock this day. You can preview the topics below.</p>
                    </div>
                  </div>
                )}
                <div className="roadmap-list-header mb-6">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                        {todayPlan?.phase || 'Learning Module'}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 mt-2">
                        {todayPlan?.topic || 'Daily Curriculum'}
                    </h2>
                </div>
                <div className="roadmap-list">
                    <div className="roadmap-line"></div>
                    {/* 1. Video Lesson(s) with Blocked Controls */}
                {(todayPlan?.videos || []).map((vPlan, idx) => {
                   // Cross-reference with weekPlan for lock status
                   const dayInfo = weekPlan.find(d => d.day === selectedDay);
                   const vStatus = dayInfo?.videos?.find(v => v.id === vPlan.id) || { locked: vPlan.locked, completed: vPlan.completed };
                   const isDone = vStatus.completed;
                   const isLocked = vStatus.locked || dayInfo?.locked;
                   const videoId = vPlan.id || `v${idx+1}`;

                   return (
                    <div 
                      key={videoId} 
                      className={`roadmap-item ${isLocked ? 'is-locked-video' : ''}`}
                      onClick={() => {
                        if (isLocked) {
                            alert("Complete previous lesson first to unlock this video! 🔒");
                            return;
                        }
                        if (weekPlan.find(d => d.day === selectedDay)?.locked) {
                           alert("This day is locked. Finish the previous day first! 🔒");
                           return;
                        }
                        const videoId = vPlan.id;   // always use what the API returns
                        navigate(`/learn/${encodeURIComponent(vPlan.title)}?url=${encodeURIComponent(vPlan.url)}&day=${selectedDay}&videoId=${videoId}`);
                      }}
                      style={weekPlan.find(d => d.day === selectedDay)?.locked ? { cursor: 'not-allowed', opacity: 0.7 } : {}}
                    >
                      <div className={`roadmap-node ${isDone ? 'completed' : isLocked ? 'locked' : 'pending'}`}>
                         {isDone ? <CheckCircle2 size={16} /> : isLocked ? <Lock size={12} className="text-gray-400" /> : <div className="inner-node"></div>}
                      </div>
                      <div className="roadmap-item__body">
                        <div className="roadmap-item__header">
                          <div className="flex items-center gap-2">
                            <Book size={18} className={isDone ? "text-emerald-500" : isLocked ? "text-gray-300" : "text-indigo-600"} />
                            <h3 className={`roadmap-item__title ${isDone ? 'text-emerald-700 font-semibold' : isLocked ? 'text-gray-400' : ''}`}>
                                {vPlan.title}
                            </h3>
                          </div>
                          {isDone ? <CheckCircle2 size={20} className="text-emerald-500" /> : isLocked ? <Lock size={18} className="text-gray-300" /> : <ChevronRight size={20} className="text-gray-400" />}
                        </div>
                        <div className="roadmap-item__meta">
                          <span className={`${isDone ? 'text-emerald-600 font-bold' : isLocked ? 'text-gray-400 font-medium' : 'text-indigo-600 font-bold'}`}>
                            {isDone ? '✓ COMPLETED' : isLocked ? '🔒 LOCKED' : '▶ READY TO LEARN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}


                {/* 3. Quiz Challenge Link */}
                {todayPlan?.quiz?.length > 0 && (
                  <div className="roadmap-item" onClick={() => setIsQuizModalOpen(true)}>
                    <div className="roadmap-node">
                       <div className="inner-node"></div>
                    </div>
                    <div className="roadmap-item__body">
                      <div className="roadmap-item__header">
                        <div className="flex items-center gap-2">
                          <HelpCircle size={18} className="text-blue-600" />
                          <h3 className="roadmap-item__title">Daily Practice Quiz</h3>
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                      <div className="roadmap-item__meta">
                        <span>5 Mins</span>
                        <span className="dot-sep"></span>
                        <span className="label practice" style={{ color: '#2563EB' }}>Quiz</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Daily Assignment (REQUIRED FOR UNLOCK) */}
                {todayPlan?.assignment && (
                  <div className="roadmap-item is-assignment mt-6">
                    <div className="roadmap-node">
                       <div className={`inner-node ${weekPlan.find(d => d.day === selectedDay)?.completed ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          {weekPlan.find(d => d.day === selectedDay)?.completed ? <CheckCircle2 size={10} color="white" /> : <ClipboardCheck size={10} color="white" />}
                       </div>
                    </div>
                    <div className="roadmap-item__body !bg-amber-50/30 !border-amber-100">
                      <div className="roadmap-item__header">
                         <div className="flex items-center gap-2">
                           <Briefcase size={18} className="text-amber-600" />
                           <h3 className="roadmap-item__title text-amber-900">Task: {todayPlan.assignment.title}</h3>
                         </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {todayPlan.assignment.description}
                      </p>
                      
                      <div className="mt-4">
                        <textarea 
                          className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none min-h-[80px]"
                          placeholder="Paste your solution or notes here..."
                          id={`assign-${selectedDay}`}
                        />
                        <button 
                          onClick={() => {
                            const text = document.getElementById(`assign-${selectedDay}`).value;
                            if(!text) return alert("Please enter something to submit!");
                            
                            fetch(`${API_BASE}/api/save_submission`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                user_id: userId,
                                task_id: `day_${selectedDay}`,
                                submission_text: text
                              })
                            })
                            .then(r => r.json())
                            .then(data => {
                              if (data.success) {
                                setUnlockedDayNum(data.unlocked_day);
                                setShowUnlockBanner(true);
                                setTimeout(() => {
                                  setShowUnlockBanner(false);
                                  setSelectedDay(data.unlocked_day);
                                  refreshDashboard();
                                }, 2500);
                              } else {
                                alert(data.error || "Please complete all videos first!");
                              }
                            })
                            .catch(() => alert("Submission failed. Check your connection."));
                          }}
                          className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl transition-all shadow-md active:scale-95"
                        >
                          Submit to Unlock Next Day
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
        </>
      ) : (
        <motion.div className="dashboard__section flex flex-col items-center justify-center p-12 bg-white border border-gray-200 rounded-3xl shadow-sm text-center" variants={item}>
          <div className="p-5 bg-indigo-50 text-indigo-500 rounded-full mb-6">
            <Target size={48} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">No Career Path Selected</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed text-lg">
            You skipped choosing a career path during setup. Select a path now to unlock your personalized learning roadmap, daily tasks, and progress tracking.
          </p>
          <button 
            onClick={() => navigate('/career-select')} 
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            Choose a Career Path <ChevronRight size={20} />
          </button>
        </motion.div>
      )}

      </motion.div>
      
      {showUnlockBanner && (
        <div style={{
          position: 'fixed',
          bottom: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '16px 32px',
          borderRadius: 20,
          fontWeight: 700,
          fontSize: 16,
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(16,185,129,0.45)',
          whiteSpace: 'nowrap',
          animation: 'slideUp 0.4s ease'
        }}>
          🎉 Day {selectedDay} Complete! Day {unlockedDayNum} is now unlocked!
        </div>
      )}

      <BottomNav />

      {/* Video Overlay Modal (Removed in favor of VideoConsole Page) */}
      {/* <VideoModal 
        isOpen={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
        video={selectedVideo} 
      /> */}

      {/* Quiz Overlay Modal */}
      <QuizModal 
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        questions={todayPlan?.quiz}
      />
    </div>
  );
};

export default Dashboard;
