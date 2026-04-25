import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Loader2, CheckCircle2, PlayCircle, X, ChevronRight,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './MyJourney.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

// ── Helpers ────────────────────────────────────────────────────────────────────

const getPhaseStatus = (phaseIndex, currentPhaseIndex, phase) => {
  // A phase is 'completed' if its day_end is before the user's current position
  if (phaseIndex < currentPhaseIndex) return 'completed';
  if (phaseIndex === currentPhaseIndex) return 'in-progress';
  return 'locked';
};

// ── Status badge component ─────────────────────────────────────────────────────

const StatusIcon = ({ status }) => {
  if (status === 'completed')   return <CheckCircle2 size={18} strokeWidth={1.8} color="#4CAF50" />;
  if (status === 'in-progress') return <PlayCircle   size={18} strokeWidth={1.8} color="#C8A951" />;
  return <Lock size={16} strokeWidth={1.8} color="#C0C0C0" />;
};

const StatusBadge = ({ status }) => (
  <span className={`my-journey__status-badge my-journey__status-badge--${status}`}>
    {status === 'completed'   && '✓ Completed'}
    {status === 'in-progress' && '▶ In Progress'}
    {status === 'locked'      && '🔒 Locked'}
  </span>
);

// ── Phase Modal ────────────────────────────────────────────────────────────────

const PhaseModal = ({ phase, status, completedDays, currentDay, onClose }) => {
  const overlayRef = useRef(null);

  // ESC key to close
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Click outside overlay closes modal
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const topics = phase.topics || [];

  const getTopicStatus = (topicTitle, topicIdx) => {
    // We map topic index to day numbers in the phase's day range
    const dayStart = phase.day_start || 1;
    const dayForTopic = dayStart + topicIdx;
    if (completedDays.includes(dayForTopic)) return 'completed';
    if (dayForTopic === currentDay) return 'active';
    if (dayForTopic < currentDay) return 'completed'; // past day
    return 'locked';
  };

  return (
    <div
      className="phase-modal__overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Phase details: ${phase.title}`}
    >
      <motion.div
        className="phase-modal__panel"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{    opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="phase-modal__header">
          <div className="phase-modal__header-left">
            <span className="phase-modal__phase-num">Phase {phase.index + 1}</span>
            <h3 className="phase-modal__title">{phase.title}</h3>
            {phase.days_range && (
              <span className="phase-modal__days-range">DAYS {phase.days_range}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={status} />
            <button
              className="phase-modal__close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Description */}
        {phase.full_label && (
          <p className="phase-modal__desc">
            Focus on: <strong>{phase.title}</strong>
          </p>
        )}

        {/* Topics list */}
        <div className="phase-modal__topics">
          <p className="phase-modal__topics-label">Topics</p>
          {topics.length === 0 ? (
            <p className="phase-modal__no-topics">Topics will appear as you progress.</p>
          ) : (
            <ul className="phase-modal__topic-list">
              {topics.map((topic, idx) => {
                const ts = getTopicStatus(topic, idx);
                return (
                  <li key={idx} className={`phase-modal__topic phase-modal__topic--${ts}`}>
                    <span className="phase-modal__topic-icon">
                      {ts === 'completed' ? '✔' : ts === 'active' ? '▶' : '🔒'}
                    </span>
                    <span className="phase-modal__topic-text">{topic}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── Stagger animations ─────────────────────────────────────────────────────────

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardAnim  = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } };

// ── Main component ─────────────────────────────────────────────────────────────

const MyJourney = () => {
  const { userProfile, fullUserData } = useAppContext();

  const userId = (
    fullUserData?.user_id ||
    (userProfile?.name || 'Student').toLowerCase().replace(/\s+/g, '_') ||
    'demo_user'
  );

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [courseInfo, setCourseInfo]         = useState(null);
  const [selectedPhase, setSelectedPhase]   = useState(null); // phase obj that is open in modal
  const [selectedStatus, setSelectedStatus] = useState('locked');

  // Fetch course info (phases + topics) from backend
  useEffect(() => {
    if (!userId || userId === 'demo_user') return;

    const fetchCourseInfo = async () => {
      setLoading(true);
      setError('');
      try {
        const res  = await fetch(`${API_BASE}/api/get_course_info`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ user_id: userId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load course info');
        setCourseInfo(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseInfo();
  }, [userId, fullUserData?.career?.course_id]);

  const handleCardClick = useCallback((phase, status) => {
    setSelectedPhase(phase);
    setSelectedStatus(status);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPhase(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!userId || userId === 'demo_user') return null;

  const phases             = courseInfo?.phases          || [];
  const currentPhaseIndex  = courseInfo?.current_phase_index  ?? 0;
  const completedDays      = courseInfo?.completed_days  || [];
  const currentDay         = courseInfo?.current_day     || 1;
  const careerLabel        = fullUserData?.career?.selected || 'Your Career';

  return (
    <div className="my-journey">
      {/* Header */}
      <div className="my-journey__header">
        <h2 className="my-journey__title">My Journey</h2>
        <span className="my-journey__career-badge" title={careerLabel}>
          {careerLabel}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="my-journey__loading">
          <Loader2 size={20} className="spin" />
          <span>Loading your roadmap…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && <p className="my-journey__error">{error}</p>}

      {/* Phase cards */}
      {!loading && !error && phases.length > 0 && (
        <motion.div className="my-journey__phases" variants={container} initial="hidden" animate="show">
          {phases.map((phase, i) => {
            const status = getPhaseStatus(i, currentPhaseIndex, phase);

            return (
              <motion.div
                key={i}
                className={`my-journey__phase-card my-journey__phase-card--${status} my-journey__phase-card--clickable`}
                variants={cardAnim}
                onClick={() => handleCardClick(phase, status)}
                role="button"
                tabIndex={0}
                aria-label={`Open Phase ${i + 1}: ${phase.title}`}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(phase, status)}
              >
                {/* Line + number */}
                <div className="my-journey__phase-left">
                  <div className="my-journey__phase-number">{i + 1}</div>
                  {i < phases.length - 1 && <div className="my-journey__connector" />}
                </div>

                {/* Card body */}
                <div className="my-journey__phase-body">
                  <div className="my-journey__phase-top">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="my-journey__phase-title">{phase.title}</span>
                      {phase.days_range && (
                        <span className="my-journey__days-label">
                          DAYS {phase.days_range}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ChevronRight size={14} strokeWidth={2} color="#C8C8C8" className="my-journey__chevron" />
                      <StatusIcon status={status} />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="my-journey__phase-desc">
                    Focus on {phase.title}
                  </p>

                  {/* Status badge */}
                  <div style={{ marginTop: 10 }}>
                    <StatusBadge status={status} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !error && phases.length === 0 && (
        <p className="my-journey__empty">No phases found for this course.</p>
      )}

      {/* Phase Modal */}
      <AnimatePresence>
        {selectedPhase && (
          <PhaseModal
            phase={selectedPhase}
            status={selectedStatus}
            completedDays={completedDays}
            currentDay={currentDay}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyJourney;
