import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { useAppContext } from '../context/AppContext';
import './CareerSelect.css';

const CAREER_DESC = {
  'Web Developer':        'Build websites and web apps using HTML, CSS, JavaScript, and frameworks.',
  'Data Analyst':         'Analyse datasets to extract insights using Python, SQL, and visualisation tools.',
  'Software Engineer':    'Design, build, and maintain robust software systems for real-world use.',
  'UI/UX Designer':       'Create intuitive user interfaces and delightful digital experiences.',
  'Cloud Engineer':       'Architect and manage scalable cloud infrastructure on AWS / Azure / GCP.',
  'Govt Exams':           'Prepare for IAS, KAS, SSC, UPSC, and other government competitive exams.',
  'Data Scientist':       'Develop machine-learning models to solve complex business problems.',
  'DevOps Engineer':      'Automate CI/CD pipelines and manage infrastructure-as-code at scale.',
  'Embedded Systems':     'Work on hardware-software integration for IoT and real-time systems.',
  'Mechanical Engineer':  'Design and analyse mechanical systems, machines, and thermal processes.',
  'Startup Founder':      'Ideate, build, and launch your own product or service from the ground up.',
};

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

const CareerSelect = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { setSelectedCareer, setUserProfile, setIsLoggedIn } = useAppContext();

  const careers   = location.state?.careers  || [];
  const profile   = location.state?.profile  || {};
  const whySuited = location.state?.whySuited || "This aligns with your strengths and goals.";

  const [chosen, setChosen] = useState('');
  const [showConfidence, setShowConfidence] = useState(false);

  const handleStartJourney = () => {
    if (!chosen) return;
    setShowConfidence(true);
  };

  const confirm = () => {
    setSelectedCareer(chosen);

    const updatedProfile = { ...profile, career: chosen };
    setUserProfile(updatedProfile);

    // Save to backend — career_path is resolved server-side to a course_id
    const userId = (updatedProfile.name || 'Student').toLowerCase().replace(/\s+/g, '_') || 'demo_user';
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/create_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           user_id:     userId,
           profile:     updatedProfile,
           career_path: chosen,            // server resolves → course_id
        })
    }).catch(console.error);

    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  const handleAlternatives = () => {
    setShowConfidence(false);
  };

  const displayCareers = careers.length > 0
    ? careers
    : ['Web Developer', 'Data Analyst', 'Software Engineer'];

  return (
    <div className="career-select min-h-screen flex flex-col items-center bg-[#F8F8F8]">
      <AnimatePresence mode="wait">
        {!showConfidence ? (
          <motion.div
            key="list"
            className="career-select__content w-full max-w-5xl px-4 md:px-8 flex flex-col mt-6"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <div className="career-select__header text-center md:text-left">
              <p className="career-select__step-label text-sm md:text-base">Career Suggestions</p>
              <h1 className="text-3xl md:text-4xl">Choose your path</h1>
              <p className="career-select__subtitle mt-2 text-base md:text-lg">
                Based on your profile, here are the best-fit careers for you.
              </p>
            </div>
            
            <div className="career-select__why-box">
              <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4}}>
                <Sparkles size={16} color="#C8A951" />
                <span style={{fontWeight: 600, color: '#C8A951', fontSize: 14}}>Why these fit you</span>
              </div>
              <p style={{fontSize: 14, color: '#555', lineHeight: 1.5}}>{whySuited}</p>
            </div>

            <motion.div
              className="career-select__list grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pb-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {displayCareers.map((career) => {
                const isActive = chosen === career;
                const desc = CAREER_DESC[career] || 'Explore this career path with AI-powered guidance.';
                return (
                  <motion.button
                    key={career}
                    type="button"
                    className={`career-select__card ${isActive ? 'career-select__card--active' : ''}`}
                    style={{ justifySelf: 'center', width: '100%', maxWidth: '100%' }}
                    variants={cardAnim}
                    onClick={() => setChosen(career)}
                  >
                    <div className="career-select__card-left">
                      <div className="career-select__icon-wrap">
                        <Briefcase size={20} strokeWidth={1.5} color={isActive ? '#C8A951' : '#6B6B6B'} />
                      </div>
                      <div className="career-select__card-text">
                        <span className="career-select__card-title">{career}</span>
                        <span className="career-select__card-desc">{desc}</span>
                      </div>
                    </div>
                    {isActive
                      ? <CheckCircle2 size={20} color="#C8A951" strokeWidth={1.8} />
                      : <ChevronRight size={20} color="#D0D0D0" strokeWidth={1.5} />}
                  </motion.button>
                );
              })}
            </motion.div>

            <div className="career-select__footer">
              <Button
                fullWidth
                onClick={handleStartJourney}
                disabled={!chosen}
                variant={chosen ? 'primary' : 'secondary'}
              >
                Proceed with {chosen || 'Selection'} →
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="confidence-check"
            className="career-select__content w-full max-w-5xl px-4 md:px-8 mt-6"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <div className="career-select__header" style={{ textAlign: 'center', marginBottom: 32, maxWidth: 600 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ padding: 16, background: '#F8F4E6', borderRadius: '50%' }}>
                  <AlertCircle size={40} color="#C8A951" />
                </div>
              </div>
              <p className="career-select__step-label">Confidence Check</p>
              <h1 style={{ fontSize: 24, marginBottom: 16 }}>Are you sure?</h1>
              <p className="career-select__subtitle" style={{ fontSize: 16 }}>
                Do you feel confident committing to <b>{chosen}</b>? Your personalized roadmap and daily setup will prioritize this path.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 'auto', marginBottom: 24, width: '100%', maxWidth: 400 }}>
              <Button fullWidth onClick={confirm} variant="primary">
                Yes, let's do this! 🚀
              </Button>
              <Button fullWidth onClick={handleAlternatives} variant="secondary">
                No, show alternatives
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerSelect;
