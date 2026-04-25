import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, BookOpen, Briefcase, Loader2,
  ChevronRight, Book, ClipboardCheck, HelpCircle, Lock,
  X, Calendar, ArrowRight
} from 'lucide-react';
import Card from '../components/Card';
import BottomNav from '../components/BottomNav';
import ProgressionTracker from '../components/ProgressionTracker';
import QuizModal from '../components/QuizModal';
import { useAppContext } from '../context/AppContext';
import './Dashboard.css';

const logoPath = '/logo.jpeg';
const placeholderLogo = 'https://ui-avatars.com/api/?name=K&background=C8A951&color=fff';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ── Phase Topics Popup Modal ──────────────────────────────────────────────────
const PhaseTopicsModal = ({ isOpen, onClose, weekPlan, selectedPhaseDay }) => {
  if (!isOpen || !selectedPhaseDay) return null;
  const phase = weekPlan.find(d => d.day === selectedPhaseDay);
  if (!phase) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            className="phase-modal"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="phase-modal__header">
              <div>
                <span className="phase-modal__label">Day {phase.day}</span>
                <h2 className="phase-modal__title">{phase.title}</h2>
              </div>
              <button className="phase-modal__close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div className="phase-modal__body">
              <div className="phase-modal__status">
                {phase.locked ? (
                  <span className="status-badge locked"><Lock size={12} /> Locked</span>
                ) : phase.completed ? (
                  <span className="status-badge completed"><CheckCircle2 size={12} /> Completed</span>
                ) : (
                  <span className="status-badge active"><div className="pulse-dot" /> Current Day</span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">Topics</h4>
              <div className="phase-modal__topics">
                {(phase.videos || []).map((v, i) => (
                  <div key={v.id || i} className={`phase-topic-item ${v.completed ? 'is-done' : phase.locked ? 'is-locked' : ''}`}>
                    <div className={`phase-topic-node ${v.completed ? 'completed' : phase.locked ? 'locked' : 'pending'}`}>
                      {v.completed ? <CheckCircle2 size={12} /> : phase.locked ? <Lock size={10} /> : <span>{i + 1}</span>}
                    </div>
                    <span className="phase-topic-label">{v.title || `Topic ${i + 1}`}</span>
                  </div>
                ))}
              </div>
              {!phase.locked && (
                <button
                  className="phase-modal__action"
                  onClick={onClose}
                >
                  View in Roadmap <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, selectedCareer, journeyProgress, setFullUserData, updateCurrentDay, logout } = useAppContext();
  const displayName = userProfile?.name || 'Student';

  const handleLogout = () => { logout(); navigate('/'); };

  const getUserId = () =>
    (displayName).toLowerCase().replace(/\s+/g, '_') || 'demo_user';

  // ── State ──────────────────────────────────────────────────────────────────
  const [todayPlan, setTodayPlan]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [progressData, setProgressData]   = useState({ streak: 0, activity: {} });
  const [userProgress, setUserProgress]   = useState(null);
  const [weekPlan, setWeekPlan]           = useState([]);
  const [selectedDay, setSelectedDay]     = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [showUnlockBanner, setShowUnlockBanner] = useState(false);
  const [unlockedDayNum, setUnlockedDayNum]   = useState(null);

  // Phase modal state
  const [phaseModalOpen, setPhaseModalOpen]       = useState(false);
  const [phaseModalDay, setPhaseModalDay]         = useState(null);

  // ── SYSTEM 7: Unified data refresh ───────────────────────────────────────
  const fetchUserData = useCallback(async () => {
    const userId = getUserId();
    try {
      const res  = await fetch(`${API_BASE}/api/get_user/${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success && data.user) {
        setFullUserData(data.user);
        setProgressData(data.user.progress || { streak: 0, activity: {} });
        const journeyDay = data.user.journey?.day || 1;
        updateCurrentDay(journeyDay);
        return journeyDay;
      }
    } catch (e) { console.error('fetchUserData failed', e); }
    return 1;
  }, [userProfile]);

  const fetchWeekOverview = useCallback(async () => {
    const userId = getUserId();
    try {
      const res  = await fetch(`${API_BASE}/api/get_week_plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) setWeekPlan(data.week_plan || []);
    } catch (e) { console.error('fetchWeekOverview failed', e); }
  }, [userProfile]);

  const fetchTodayPlan = useCallback(async (day) => {
    if (!selectedCareer) { setLoading(false); return; }
    const userId = getUserId();
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/get_today_plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          career: selectedCareer,
          level: 'beginner',
          day: day,
          language: userProfile?.preferred_language || 'English',
          user_id: userId
        })
      });
      const data = await res.json();
      if (data.success) setTodayPlan(data);
      else setTodayPlan(null);
    } catch (e) { console.error('fetchTodayPlan failed', e); }
    finally { setLoading(false); }
  }, [selectedCareer, userProfile]);

  const refreshDashboard = useCallback(async () => {
    const journeyDay = await fetchUserData();
    await fetchWeekOverview();
    const day = selectedDay ?? journeyDay;
    setSelectedDay(day);
    await fetchTodayPlan(day);
  }, [fetchUserData, fetchWeekOverview, fetchTodayPlan, selectedDay]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    refreshDashboard();
    const onFocus = () => refreshDashboard();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [selectedCareer, userProfile]);

  // ── When selected day changes → fetch that day plan ───────────────────────
  useEffect(() => {
    if (selectedDay !== null) fetchTodayPlan(selectedDay);
  }, [selectedDay]);

  // ── Assignment submit ─────────────────────────────────────────────────────
  const handleAssignmentSubmit = async () => {
    const textEl = document.getElementById(`assign-${selectedDay}`);
    const text   = textEl?.value?.trim();
    if (!text) return alert('Please enter something to submit!');

    try {
      const res = await fetch(`${API_BASE}/api/save_submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: getUserId(),
          task_id: `day_${selectedDay}`,
          submission_text: text
        })
      });
      const data = await res.json();
      if (data.success) {
        setUnlockedDayNum(data.unlocked_day);
        setShowUnlockBanner(true);
        // SYSTEM 7: refresh everything
        await fetchUserData();
        await fetchWeekOverview();
        setTimeout(() => {
          setShowUnlockBanner(false);
          setSelectedDay(data.unlocked_day);
        }, 2500);
      } else {
        alert(data.error || 'Please complete all videos first!');
      }
    } catch { alert('Submission failed. Check your connection.'); }
  };

  // ── Computed values ───────────────────────────────────────────────────────
  const currentJourneyDay = userProgress?.current_day
    || (weekPlan.find(d => !d.locked && !d.completed)?.day ?? 1);

  return (
    <div className="dashboard lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <motion.div className="dashboard__content max-w-5xl mx-auto p-4 lg:p-10 lg:pt-8"
        variants={container} initial="hidden" animate="show">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div className="dashboard__header" variants={item}>
          <div>
            <p className="dashboard__greeting">Good day,</p>
            <h1 className="dashboard__name">{displayName} ✨</h1>
          </div>
          <div className="dashboard__avatar" onClick={handleLogout} style={{ cursor: 'pointer' }} title="Log out">
            <img src={logoPath} alt="Avatar" onError={e => e.target.src = placeholderLogo} />
          </div>
        </motion.div>

        {/* ── SYSTEM 2+8: Streak + Contribution Card ─────────────────────── */}
        <motion.div variants={item}>
          <ProgressionTracker
            streak={progressData?.streak || 0}
            activity={progressData?.activity || {}}
          />
        </motion.div>

        {/* ── SYSTEM 5: Weekly Roadmap with Phase Popup ──────────────────── */}
        <motion.div className="dashboard__section" variants={item}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="dashboard__section-title">Weekly Roadmap</h2>
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
              {weekPlan.length}-Day Sprint
            </div>
          </div>

          <div className="weekly-scroll">
            {weekPlan.map((dayData, idx) => {
              const isSelected  = dayData.day === selectedDay;
              const isCompleted = dayData.completed || (
                dayData.videos?.length > 0 && dayData.videos.every(v => v.completed)
              );
              return (
                <div
                  key={idx}
                  className={`weekly-card ${dayData.locked ? 'is-locked' : 'is-unlocked'} ${isSelected ? 'is-selected' : ''} ${isCompleted ? 'is-completed' : ''}`}
                  onClick={() => {
                    // Single click → select day
                    setSelectedDay(dayData.day);
                  }}
                  onDoubleClick={() => {
                    // Double click → open phase popup
                    setPhaseModalDay(dayData.day);
                    setPhaseModalOpen(true);
                  }}
                  title="Click to view • Double-click for topic list"
                >
                  <div className="weekly-card__header">
                    <span className="day-label">Day {dayData.day}</span>
                    {dayData.locked ? (
                      <Lock size={14} className="text-gray-400" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : isSelected ? (
                      <div className="pulse-indicator" />
                    ) : null}
                  </div>
                  <h4 className="weekly-card__title">{dayData.title}</h4>
                  <div className="weekly-card__video-count">
                    {dayData.videos?.length || 0} Lessons
                    <button
                      className="topics-peek-btn"
                      onClick={e => {
                        e.stopPropagation();
                        setPhaseModalDay(dayData.day);
                        setPhaseModalOpen(true);
                      }}
                      title="View topics"
                    >
                      <Calendar size={11} />
                    </button>
                  </div>
                  {dayData.locked && <div className="locked-overlay-subtle" />}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Roadmap Detail View ─────────────────────────────────────────── */}
        <motion.div className="roadmap-view" variants={item}>
          {/* Banner */}
          <div className={`roadmap-banner ${selectedDay > currentJourneyDay ? 'is-preview' : ''}`}>
            <div className="flex justify-between items-start w-full">
              <div>
                <span className="roadmap-banner__label">
                  {selectedDay > currentJourneyDay ? '🔮 PREVIEW MODE' : (selectedCareer?.toUpperCase() || 'CAREER PATH')}
                </span>
                <h2 className="roadmap-banner__title">
                  {loading
                    ? `Loading Day ${selectedDay}…`
                    : `Day ${selectedDay}: ${todayPlan?.topic || 'Curriculum Overview'}`}
                </h2>
              </div>
              {selectedDay !== currentJourneyDay && (
                <button
                  onClick={() => setSelectedDay(currentJourneyDay)}
                  className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg backdrop-blur-md transition-all font-bold"
                >
                  Return to Today
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="roadmap-list-container">
            {loading ? (
              <div className="flex items-center gap-2 p-8 justify-center">
                <Loader2 size={20} className="spin" color="#666" />
                <span className="text-gray-500 font-medium">Loading roadmap…</span>
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
              <div>
                {/* Locked day notice */}
                {weekPlan.find(d => d.day === selectedDay)?.locked && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center gap-3">
                    <Lock className="text-amber-600" size={20} />
                    <div>
                      <p className="text-amber-800 font-bold text-sm">🔒 Preview Mode</p>
                      <p className="text-amber-700 text-xs">Complete Day {selectedDay - 1} to unlock this day.</p>
                    </div>
                  </div>
                )}

                <div className="roadmap-list-header mb-4 md:mb-6">
                  <span className="text-[10px] md:text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                    {todayPlan?.phase || 'Learning Module'}
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-2 leading-tight">
                    {todayPlan?.topic || 'Daily Curriculum'}
                  </h2>
                </div>

                <div className="roadmap-list">
                  <div className="roadmap-line" />

                  {/* Videos */}
                  {(todayPlan?.videos || []).map((vPlan, idx) => {
                    const dayInfo  = weekPlan.find(d => d.day === selectedDay);
                    const vStatus  = dayInfo?.videos?.find(v => v.id === vPlan.id) || {};
                    const isDone   = vStatus.completed ?? vPlan.completed;
                    const isLocked = vStatus.locked ?? vPlan.locked ?? dayInfo?.locked;
                    const videoId  = vPlan.id || `v${idx + 1}`;

                    return (
                      <div
                        key={videoId}
                        className={`roadmap-item ${isLocked ? 'is-locked-video' : ''}`}
                        onClick={() => {
                          if (isLocked)    return alert('Complete previous lesson first! 🔒');
                          if (dayInfo?.locked) return alert('This day is locked. Finish the previous day first! 🔒');
                          navigate(
                            `/learn/${encodeURIComponent(vPlan.title)}?url=${encodeURIComponent(vPlan.url)}&day=${selectedDay}&videoId=${videoId}`
                          );
                        }}
                        style={dayInfo?.locked ? { cursor: 'not-allowed', opacity: 0.7 } : {}}
                      >
                        <div className={`roadmap-node ${isDone ? 'completed' : isLocked ? 'locked' : 'pending'}`}>
                          {isDone
                            ? <CheckCircle2 size={16} />
                            : isLocked
                            ? <Lock size={12} className="text-gray-400" />
                            : <div className="inner-node" />}
                        </div>
                        <div className="roadmap-item__body">
                          <div className="roadmap-item__header">
                            <div className="flex items-center gap-2">
                              <Book size={18} className={isDone ? 'text-emerald-500' : isLocked ? 'text-gray-300' : 'text-indigo-600'} />
                              <h3 className={`roadmap-item__title ${isDone ? 'text-emerald-700 font-semibold' : isLocked ? 'text-gray-400' : ''}`}>
                                {vPlan.title}
                              </h3>
                            </div>
                            {isDone
                              ? <CheckCircle2 size={20} className="text-emerald-500" />
                              : isLocked
                              ? <Lock size={18} className="text-gray-300" />
                              : <ChevronRight size={20} className="text-gray-400" />}
                          </div>
                          <div className="roadmap-item__meta">
                            <span className={`${isDone ? 'text-emerald-600 font-bold' : isLocked ? 'text-gray-400' : 'text-indigo-600 font-black'}`}>
                              {isDone ? '✓ COMPLETED' : isLocked ? '🔒 LOCKED' : '▶ READY'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Quiz */}
                  {todayPlan?.quiz?.length > 0 && (
                    <div className="roadmap-item" onClick={() => setIsQuizModalOpen(true)}>
                      <div className="roadmap-node"><div className="inner-node" /></div>
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
                          <span className="dot-sep" />
                          <span className="label" style={{ color: '#2563EB' }}>Quiz</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assignment */}
                  {todayPlan?.assignment && (
                    <div className="roadmap-item is-assignment mt-6">
                      <div className="roadmap-node">
                        <div className={`inner-node ${weekPlan.find(d => d.day === selectedDay)?.completed ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          {weekPlan.find(d => d.day === selectedDay)?.completed
                            ? <CheckCircle2 size={10} color="white" />
                            : <ClipboardCheck size={10} color="white" />}
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
                            placeholder="Paste your solution or notes here…"
                            id={`assign-${selectedDay}`}
                          />
                          {weekPlan.find(d => d.day === selectedDay)?.completed ? (
                            <div className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm">
                              <CheckCircle2 size={16} /> Day Completed ✓
                            </div>
                          ) : (
                            <button
                              onClick={handleAssignmentSubmit}
                              className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl transition-all shadow-md active:scale-95"
                            >
                              Submit to Unlock Next Day
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* ── Unlock Banner ──────────────────────────────────────────────────── */}
      {showUnlockBanner && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white', padding: '16px 32px', borderRadius: 20,
          fontWeight: 700, fontSize: 16, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(16,185,129,0.45)', whiteSpace: 'nowrap'
        }}>
          🎉 Day {selectedDay} Complete! Day {unlockedDayNum} is now unlocked!
        </div>
      )}

      <BottomNav />

      {/* ── Phase Topics Modal ─────────────────────────────────────────────── */}
      <PhaseTopicsModal
        isOpen={phaseModalOpen}
        onClose={() => setPhaseModalOpen(false)}
        weekPlan={weekPlan}
        selectedPhaseDay={phaseModalDay}
      />

      {/* ── Quiz Overlay Modal ─────────────────────────────────────────────── */}
      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        questions={todayPlan?.quiz}
      />
    </div>
  );
};

export default Dashboard;
