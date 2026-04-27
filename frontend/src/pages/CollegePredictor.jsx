import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, ChevronRight, Cpu, Zap, Cog, FlaskConical,
  Building2, RefreshCw, CheckCircle2, GraduationCap, BookOpen
} from 'lucide-react';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import BottomNav from '../components/BottomNav';
import { useAppContext } from '../context/AppContext';
import './CollegePredictor.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Maps JSON short-codes → display name + icon + color + key subjects
const BRANCH_META = {
  CSE:        { label: 'Computer Science',     icon: Cpu,          color: '#C8A951', subjects: ['Data Structures', 'Algorithms', 'OS', 'DBMS', 'Networks'] },
  ISE:        { label: 'Info. Science',        icon: BookOpen,     color: '#B0A878', subjects: ['Software Engg.', 'Web Dev', 'Data Mining', 'Cloud', 'AI'] },
  ECE:        { label: 'Electronics & Comm.',  icon: Zap,          color: '#A89848', subjects: ['Signals', 'VLSI', 'Embedded', 'Microprocessors', 'Comm.'] },
  EEE:        { label: 'Electrical Engg.',     icon: Zap,          color: '#8B8040', subjects: ['Power Systems', 'Control', 'Machines', 'Electronics', 'PLC'] },
  Mechanical: { label: 'Mechanical',           icon: Cog,          color: '#9A9060', subjects: ['Thermodynamics', 'Fluid Mechanics', 'Manufacturing', 'CAD', 'Materials'] },
  Civil:      { label: 'Civil',                icon: Building2,    color: '#7A8050', subjects: ['Structures', 'Geotechnical', 'Transportation', 'Hydraulics', 'Construction'] },
  Chemical:   { label: 'Chemical',             icon: FlaskConical, color: '#6A7040', subjects: ['Heat Transfer', 'Mass Transfer', 'Reactor Design', 'Process Control', 'Thermodynamics'] },
  'AI & ML':  { label: 'AI & Machine Learning',icon: Cpu,          color: '#C8A951', subjects: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Science'] },
};

const CollegePredictor = ({ initialRank }) => {
  const navigate = useNavigate();
  const { userProfile, setUserProfile, setSelectedCareer, isExplorer } = useAppContext();

  // Tab: 'branches' | 'change'
  const [tab, setTab] = useState('branches');

  // Branch detail drill-down — internal navigation, does NOT use browser history
  const [selectedBranch, setSelectedBranch] = useState(null);

  // All eligible colleges fetched from API
  const [allColleges, setAllColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);

  // The current college object derived from allColleges + userProfile.career
  const selectedCollegeName = userProfile?.career || null;

  // Fetch all eligible colleges on mount so Branches tab has dynamic data right away
  useEffect(() => {
    if (allColleges.length === 0) {
      setLoadingColleges(true);
      const rank = userProfile?.kcet_rank || userProfile?.rank || initialRank || 0;
      fetch(`${API_BASE}/api/get_college_suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank, exam_type: 'KCET', is_explorer: isExplorer })
      })
        .then(r => r.json())
        .then(data => { if (data.success) setAllColleges(data.colleges || []); })
        .catch(console.error)
        .finally(() => setLoadingColleges(false));
    }
  }, []);

  // Resolve the full college object that is currently selected
  const currentCollege = useMemo(
    () => allColleges.find(c => c.college_name === selectedCollegeName) || null,
    [allColleges, selectedCollegeName]
  );

  // Build branch list dynamically from the selected college's JSON
  // Uses KCET cutoffs; falls back to "N/A" when a branch isn't offered
  const dynamicBranches = useMemo(() => {
    if (!currentCollege) {
      // No college selected yet → show static fallback list
      return Object.entries(BRANCH_META).map(([code, meta]) => ({
        code,
        ...meta,
        cutoff: 'N/A',
        seats: 'N/A',
      }));
    }

    const kcetCutoffs   = currentCollege.cutoff_rank?.KCET || {};
    const managementFee = currentCollege.management_fees || {};
    const available     = currentCollege.branches_available || [];

    return available
      .filter(code => BRANCH_META[code]) // only known branches
      .map(code => {
        const branchFee = managementFee[code] || managementFee['Note'] || 'Contact for details';
        return {
          code,
          ...BRANCH_META[code],
          cutoff: kcetCutoffs[code] || 'N/A',
          fee: branchFee,
          seats: 'N/A', // seat data not in JSON; show N/A
        };
      });
  }, [currentCollege]);

  // When a college is selected in "Change College"
  const handleSelectCollege = (college) => {
    const updatedProfile = { ...userProfile, career: college.college_name };
    setUserProfile(updatedProfile);
    setSelectedCareer(college.college_name);
    // Switch to Branches tab so user can immediately see updated branch data
    setTab('branches');
    setSelectedBranch(null);
  };
  
  const calculateMatchProb = (rank, cutoffStr) => {
    if (!rank || !cutoffStr || cutoffStr === 'N/A') return 'Unknown';
    const maxRank = parseInt(cutoffStr.split('-').pop().replace('+', ''));
    if (rank <= maxRank) return 'High';
    if (rank <= maxRank * 1.2) return 'Moderate';
    return 'Reach';
  };

  // Internal back handler — only close the branch detail; never go to browser history
  const handleBack = () => {
    if (selectedBranch) {
      setSelectedBranch(null);
    } else {
      navigate(-1);
    }
  };

  const otherColleges = allColleges.filter(c => c.college_name !== selectedCollegeName);

  return (
    <div className="college-predictor lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <TopBar
        title="College & Branches"
        showBack
        onBack={handleBack}
      />

      <div className="college-predictor__tabs">
        <button
          className={`college-predictor__tab ${tab === 'branches' ? 'college-predictor__tab--active' : ''}`}
          onClick={() => { setTab('branches'); setSelectedBranch(null); }}
        >
          Branches
        </button>
        <button
          className={`college-predictor__tab ${tab === 'change' ? 'college-predictor__tab--active' : ''}`}
          onClick={() => { setTab('change'); setSelectedBranch(null); }}
        >
          Change College
        </button>
      </div>

      <div className="college-predictor__content">
        <AnimatePresence mode="wait">

          {/* ── BRANCHES LIST ── */}
          {tab === 'branches' && !selectedBranch && (
            <motion.div
              key="branches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="college-predictor__branches"
            >
              {isExplorer && (
                <div className="college-predictor__explorer-badge mb-4">
                  <span className="text-sm font-bold">Explorer Mode: Viewing Management Estimates</span>
                </div>
              )}

              {currentCollege && (
                <p className="college-predictor__hint">
                  Showing branches for <strong>{currentCollege.college_name}</strong>
                </p>
              )}
              {!currentCollege && (
                <p className="college-predictor__hint">Tap a branch to explore details</p>
              )}

              {dynamicBranches.map((b) => {
                const Icon = b.icon;
                return (
                  <Card
                    key={b.code}
                    className="college-predictor__branch-card"
                    onClick={() => setSelectedBranch(b)}
                  >
                    <div className="college-predictor__branch-row">
                      <div className="college-predictor__branch-icon" style={{ background: `${b.color}14` }}>
                        <Icon size={22} color={b.color} strokeWidth={1.5} />
                      </div>
                      <div className="college-predictor__branch-info">
                        <h3>{b.label}</h3>
                        <div className="flex items-center gap-2">
                          <p>
                            {isExplorer ? `Mgmt Fee: ${b.fee}` : `KCET Cutoff: ${b.cutoff}`}
                            {!isExplorer && b.seats !== 'N/A' ? ` · Seats: ${b.seats}` : ''}
                          </p>
                          {!isExplorer && b.cutoff !== 'N/A' && (
                            <span className={`match-badge ${calculateMatchProb(userProfile?.kcet_rank, b.cutoff)}`}>
                              {calculateMatchProb(userProfile?.kcet_rank, b.cutoff)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} color="#CCCCCC" />
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}

          {/* ── BRANCH DETAIL ── */}
          {tab === 'branches' && selectedBranch && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="college-predictor__detail"
            >
              <button
                className="college-predictor__back-link"
                onClick={() => setSelectedBranch(null)}
              >
                ← All Branches
              </button>
              <div className="college-predictor__detail-header">
                <div
                  className="college-predictor__detail-icon"
                  style={{ background: `${selectedBranch.color}14` }}
                >
                  {React.createElement(selectedBranch.icon, {
                    size: 32, color: selectedBranch.color, strokeWidth: 1.5
                  })}
                </div>
                <h2>{selectedBranch.label}</h2>
              </div>

              {currentCollege && (
                <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                  Data for <strong>{currentCollege.college_name}</strong>
                </p>
              )}

              <div className="college-predictor__detail-stats">
                {isExplorer ? (
                  <div className="college-predictor__stat" style={{ flex: 1.5 }}>
                    <span className="college-predictor__stat-value" style={{ fontSize: 16 }}>
                      {selectedBranch.fee}
                    </span>
                    <span className="college-predictor__stat-label">Management Fee</span>
                  </div>
                ) : (
                  <div className="college-predictor__stat">
                    <span className="college-predictor__stat-value">
                      {selectedBranch.cutoff}
                    </span>
                    <span className="college-predictor__stat-label">KCET Cutoff</span>
                  </div>
                )}
                <div className="college-predictor__stat">
                  <span className="college-predictor__stat-value">
                    {currentCollege?.average_package || 'N/A'}
                  </span>
                  <span className="college-predictor__stat-label">Avg Package</span>
                </div>
                <div className="college-predictor__stat">
                  <span className="college-predictor__stat-value">
                    {currentCollege ? `${currentCollege.placement_rating}/5` : 'N/A'}
                  </span>
                  <span className="college-predictor__stat-label">Placement</span>
                </div>
              </div>

              <h3 style={{ marginBottom: 12, marginTop: 8 }}>Key Subjects</h3>
              <div className="college-predictor__chips">
                {selectedBranch.subjects.map(s => (
                  <span key={s} className="college-predictor__chip">{s}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── CHANGE COLLEGE ── */}
          {tab === 'change' && (
            <motion.div
              key="change"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {loadingColleges ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw size={28} className="animate-spin text-amber-500 mb-3" />
                  <p className="text-gray-500">Loading colleges for your rank…</p>
                </div>
              ) : (
                <>
                  {isExplorer && (
                    <div className="college-predictor__explorer-badge mb-4">
                      <span className="text-sm font-bold">Explorer Mode: Top Rated Colleges</span>
                    </div>
                  )}

                  {/* Currently selected college */}
                  {currentCollege && (
                    <div className="mb-6">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-3">Currently Selected</p>
                      <div className="bg-amber-50 border-2 border-[#C8A951] rounded-2xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                          <Building2 size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-900 text-base leading-snug">
                              {currentCollege.college_name}
                            </h3>
                            <CheckCircle2 size={20} className="text-[#C8A951] shrink-0 ml-2" />
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <MapPin size={13} /> {currentCollege.location}
                          </div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              <span className="font-semibold text-gray-800">{currentCollege.placement_rating}/5</span> Placement
                            </span>
                            <span className="text-gray-600">
                              <span className="font-semibold text-gray-800">{currentCollege.average_package}</span> Avg Pkg
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other eligible colleges */}
                  {otherColleges.length > 0 ? (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-3">Other Options for Your Rank</p>
                      <div className="flex flex-col gap-3">
                        {otherColleges.map(college => (
                          <motion.div
                            key={college.college_name}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectCollege(college)}
                            className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
                          >
                            <div className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                              <Building2 size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-900 text-base leading-snug">
                                  {college.college_name}
                                </h3>
                                <ChevronRight size={18} className="text-gray-300 shrink-0 ml-2" />
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                <MapPin size={13} /> {college.location}
                              </div>
                              <div className="flex gap-4 mt-2 text-sm">
                                <span className="text-gray-600">
                                  <span className="font-semibold text-gray-800">{college.placement_rating}/5</span> Placement
                                </span>
                                <span className="text-gray-600">
                                  <span className="font-semibold text-gray-800">{college.average_package}</span> Avg Pkg
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    !loadingColleges && (
                      <p className="text-gray-500 text-center mt-6">No other colleges found for your rank.</p>
                    )
                  )}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
};

export default CollegePredictor;
