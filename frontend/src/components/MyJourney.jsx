import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, PlayCircle, Edit3, MessageSquare } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Button from './Button';
import './MyJourney.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const phaseStatus = (index, currentPhaseIndex) => {
  if (index < currentPhaseIndex) return 'completed';
  if (index === currentPhaseIndex) return 'in-progress';
  return 'locked';
};

const StatusIcon = ({ status }) => {
  if (status === 'completed')  return <CheckCircle2  size={18} strokeWidth={1.8} color="#4CAF50" />;
  if (status === 'in-progress') return <PlayCircle   size={18} strokeWidth={1.8} color="#C8A951" />;
  return <Lock size={16} strokeWidth={1.8} color="#C0C0C0" />;
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardAnim = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } };

const MyJourney = () => {
  const { userProfile, selectedCareer, roadmapData, setRoadmapData, journeyProgress, setJourneyProgress } = useAppContext();
  const userId = (userProfile?.name || 'Student').toLowerCase().replace(/\s+/g, '_') || 'demo_user';
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Reflection State
  const [learned, setLearned] = useState('');
  const [difficult, setDifficult] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);

  useEffect(() => {
    if (!selectedCareer) return;
    if (roadmapData) return;

    const fetchRoadmap = async () => {
      setLoading(true);
      setError('');
      try {
        const res  = await fetch(`${API_BASE}/api/get_roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ career: selectedCareer }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load roadmap');
        setRoadmapData(json.roadmap || json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [selectedCareer]);

  if (!selectedCareer) return null;

  let phases = [];
  if (roadmapData) {
    if (Array.isArray(roadmapData.phases)) phases = roadmapData.phases;
    else if (Array.isArray(roadmapData)) phases = roadmapData;
    else if (typeof roadmapData === 'object') {
      phases = Object.entries(roadmapData).map(([key, val]) => ({
        title: typeof val === 'string' ? val : key,
        description: typeof val === 'string' ? '' : JSON.stringify(val),
      }));
    }
  }

  const currentPhaseIndex = (journeyProgress?.currentPhase || 1) - 1;
  const reflections = journeyProgress?.reflections || [];

  const handleSaveReflection = () => {
    if (!learned.trim() && !difficult.trim()) return;

    const newReflection = {
      phaseIndex: currentPhaseIndex,
      learned,
      difficult,
      date: new Date().toISOString()
    };

    const updated = {
      ...journeyProgress,
      reflections: [...reflections, newReflection],
      currentPhase: currentPhaseIndex + 2 // Advance phase (1-based)
    };

    setJourneyProgress(updated);
    setLearned('');
    setDifficult('');
    setIsReflecting(false);

    // Save reflection to backend JSON storage
    fetch(`${API_BASE}/api/update_reflection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        reflection: `Learned: ${learned} | Difficult: ${difficult}`
      })
    }).catch(console.error);
  };

  return (
    <div className="my-journey">
      <div className="my-journey__header">
        <h2 className="my-journey__title">My Journey</h2>
        <span className="my-journey__career-badge">{selectedCareer}</span>
      </div>

      {loading && (
        <div className="my-journey__loading">
          <Loader2 size={20} className="spin" />
          <span>Building your AI roadmap…</span>
        </div>
      )}

      {error && !loading && <p className="my-journey__error">{error}</p>}

      {!loading && !error && phases.length > 0 && (
        <motion.div className="my-journey__phases" variants={container} initial="hidden" animate="show">
          {phases.map((phase, i) => {
            const status = phaseStatus(i, currentPhaseIndex);
            const title  = phase.title || `Phase ${i + 1}`;
            const duration = phase.duration || '';
            const desc   = phase.description || '';
            const phaseReflections = reflections.filter(r => r.phaseIndex === i);

            return (
              <motion.div key={i} className={`my-journey__phase-card my-journey__phase-card--${status}`} variants={cardAnim}>
                <div className="my-journey__phase-left">
                  <div className="my-journey__phase-number">{i + 1}</div>
                  {i < phases.length - 1 && <div className="my-journey__connector" />}
                </div>
                
                <div className="my-journey__phase-body">
                  <div className="my-journey__phase-top">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="my-journey__phase-title">{title}</span>
                      {duration && <span style={{ fontSize: 10, color: '#999', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 }}>{duration}</span>}
                    </div>
                    <StatusIcon status={status} />
                  </div>
                  
                  {desc && (
                    <p className="my-journey__phase-desc">
                      {Array.isArray(desc) ? desc.join(' · ') : String(desc)}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <span className={`my-journey__status-badge my-journey__status-badge--${status}`}>
                      {status === 'completed' && '✓ Completed'}
                      {status === 'in-progress' && '▶ In Progress'}
                      {status === 'locked' && '🔒 Locked'}
                    </span>

                    {phaseReflections.length > 0 && (
                       <span style={{ fontSize: 12, color: '#666', display:'flex', alignItems:'center', gap: 4 }}>
                          <MessageSquare size={12}/> {phaseReflections.length} Reflections
                       </span>
                    )}
                  </div>

                  {/* Reflection UI for Active Phase */}
                  {status === 'in-progress' && (
                    <div style={{ marginTop: 16 }}>
                      {!isReflecting ? (
                        <Button variant="secondary" onClick={() => setIsReflecting(true)} style={{ width: '100%', fontSize: 13, padding: '8px' }}>
                          <Edit3 size={14} style={{ marginRight: 6 }}/> Complete Phase & Reflect
                        </Button>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          style={{ background: '#fcfcfc', border: '1px solid #eee', padding: 12, borderRadius: 8 }}
                        >
                          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#333' }}>Daily Reflection (IKS)</p>
                          <textarea
                            placeholder="What did you learn today?"
                            value={learned}
                            onChange={(e) => setLearned(e.target.value)}
                            style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8, resize: 'none', height: 60 }}
                          />
                          <textarea
                            placeholder="What was difficult or challenging?"
                            value={difficult}
                            onChange={(e) => setDifficult(e.target.value)}
                            style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 6, border: '1px solid #ddd', marginBottom: 12, resize: 'none', height: 60 }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleSaveReflection} style={{ background: '#C8A951', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, fontSize: 13, flex: 1, cursor: 'pointer' }}>
                                Save & Advance
                            </button>
                            <button onClick={() => setIsReflecting(false)} style={{ background: '#eee', color: '#555', border: 'none', padding: '8px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                                Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Show Past Reflection if completed */}
                  {status === 'completed' && phaseReflections.length > 0 && (
                    <div style={{ marginTop: 12, padding: 10, background: '#f5fdf5', borderRadius: 6, borderLeft: '3px solid #4CAF50' }}>
                      <p style={{ fontSize: 12, color: '#333', fontStyle: 'italic' }}>
                        "{phaseReflections[0].learned}"
                      </p>
                    </div>
                  )}

                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {!loading && !error && phases.length === 0 && roadmapData && (
        <p className="my-journey__empty">No phases found in roadmap.</p>
      )}
    </div>
  );
};

export default MyJourney;
