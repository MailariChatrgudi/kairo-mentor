import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, ChevronRight, GraduationCap, Cpu, Zap, Cog, FlaskConical, Building2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import BottomNav from '../components/BottomNav';
import './CollegePredictor.css';

const branches = [
  { name: 'Computer Science', icon: Cpu, seats: '120', cutoff: '1500', color: '#C8A951' },
  { name: 'Electronics & Comm.', icon: Zap, seats: '90', cutoff: '5000', color: '#B0A878' },
  { name: 'Mechanical', icon: Cog, seats: '60', cutoff: '12000', color: '#A89848' },
  { name: 'Chemical', icon: FlaskConical, seats: '45', cutoff: '18000', color: '#8B8040' },
  { name: 'Civil', icon: Building2, seats: '60', cutoff: '15000', color: '#9A9060' },
];

const colleges = [
  { name: 'IIT Bombay', location: 'Mumbai', rating: 4.9, branch: 'Computer Science', cutoff: '120' },
  { name: 'IIT Delhi', location: 'New Delhi', rating: 4.8, branch: 'Computer Science', cutoff: '180' },
  { name: 'NIT Trichy', location: 'Tiruchirappalli', rating: 4.6, branch: 'Computer Science', cutoff: '1200' },
  { name: 'BITS Pilani', location: 'Pilani', rating: 4.7, branch: 'Computer Science', cutoff: '950' },
  { name: 'IIIT Hyderabad', location: 'Hyderabad', rating: 4.7, branch: 'Computer Science', cutoff: '800' },
  { name: 'VIT Vellore', location: 'Vellore', rating: 4.3, branch: 'Computer Science', cutoff: '5000' },
];

const CollegePredictor = () => {
  const [tab, setTab] = useState('branches');
  const [rank, setRank] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const handlePredict = () => {
    if (rank.trim()) setShowResults(true);
  };

  const filteredColleges = colleges.filter(
    c => !rank || parseInt(rank) <= parseInt(c.cutoff) * 1.5
  );

  return (
    <div className="college-predictor">
      <TopBar title="College & Branches" showBack />

      <div className="college-predictor__tabs">
        <button
          className={`college-predictor__tab ${tab === 'branches' ? 'college-predictor__tab--active' : ''}`}
          onClick={() => { setTab('branches'); setShowResults(false); }}
        >
          Branches
        </button>
        <button
          className={`college-predictor__tab ${tab === 'predict' ? 'college-predictor__tab--active' : ''}`}
          onClick={() => { setTab('predict'); setSelectedBranch(null); }}
        >
          Predict College
        </button>
      </div>

      <div className="college-predictor__content">
        <AnimatePresence mode="wait">
          {tab === 'branches' && !selectedBranch && (
            <motion.div
              key="branches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="college-predictor__branches"
            >
              <p className="college-predictor__hint">Tap a branch to explore details</p>
              {branches.map((b) => {
                const Icon = b.icon;
                return (
                  <Card key={b.name} className="college-predictor__branch-card" onClick={() => setSelectedBranch(b)}>
                    <div className="college-predictor__branch-row">
                      <div className="college-predictor__branch-icon" style={{ background: `${b.color}14` }}>
                        <Icon size={22} color={b.color} strokeWidth={1.5} />
                      </div>
                      <div className="college-predictor__branch-info">
                        <h3>{b.name}</h3>
                        <p>Avg. Cutoff: {b.cutoff} · Seats: {b.seats}</p>
                      </div>
                      <ChevronRight size={18} color="#CCCCCC" />
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          )}

          {tab === 'branches' && selectedBranch && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="college-predictor__detail"
            >
              <button className="college-predictor__back-link" onClick={() => setSelectedBranch(null)}>
                ← All Branches
              </button>
              <div className="college-predictor__detail-header">
                <div className="college-predictor__detail-icon" style={{ background: `${selectedBranch.color}14` }}>
                  {React.createElement(selectedBranch.icon, { size: 32, color: selectedBranch.color, strokeWidth: 1.5 })}
                </div>
                <h2>{selectedBranch.name}</h2>
              </div>
              <div className="college-predictor__detail-stats">
                <div className="college-predictor__stat">
                  <span className="college-predictor__stat-value">{selectedBranch.seats}</span>
                  <span className="college-predictor__stat-label">Avg Seats</span>
                </div>
                <div className="college-predictor__stat">
                  <span className="college-predictor__stat-value">{selectedBranch.cutoff}</span>
                  <span className="college-predictor__stat-label">Avg Cutoff</span>
                </div>
                <div className="college-predictor__stat">
                  <span className="college-predictor__stat-value">8.2L</span>
                  <span className="college-predictor__stat-label">Avg Package</span>
                </div>
              </div>
              <h3 style={{ marginBottom: 12, marginTop: 8 }}>Key Subjects</h3>
              <div className="college-predictor__chips">
                {['Data Structures', 'Algorithms', 'OS', 'DBMS', 'Networks'].map(s => (
                  <span key={s} className="college-predictor__chip">{s}</span>
                ))}
              </div>
            </motion.div>
          )}

          {tab === 'predict' && (
            <motion.div
              key="predict"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="college-predictor__form">
                <Input
                  label="Enter your rank"
                  placeholder="e.g. 5000"
                  type="number"
                  value={rank}
                  onChange={(e) => { setRank(e.target.value); setShowResults(false); }}
                  icon={<Search size={18} strokeWidth={1.5} />}
                />
                <div style={{ marginTop: 16 }}>
                  <Button fullWidth onClick={handlePredict}>Predict Colleges</Button>
                </div>
              </div>

              {showResults && (
                <motion.div
                  className="college-predictor__results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="college-predictor__results-title">
                    {filteredColleges.length} colleges found
                  </h3>
                  {filteredColleges.map((c) => (
                    <Card key={c.name} className="college-predictor__college-card">
                      <div className="college-predictor__college-top">
                        <div>
                          <h3>{c.name}</h3>
                          <div className="college-predictor__college-location">
                            <MapPin size={13} strokeWidth={1.5} />
                            <span>{c.location}</span>
                          </div>
                        </div>
                        <div className="college-predictor__rating">
                          <Star size={14} fill="#C8A951" color="#C8A951" />
                          <span>{c.rating}</span>
                        </div>
                      </div>
                      <div className="college-predictor__college-meta">
                        <span className="college-predictor__chip">{c.branch}</span>
                        <span className="college-predictor__chip">Cutoff: {c.cutoff}</span>
                      </div>
                    </Card>
                  ))}
                </motion.div>
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
