import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronRight, CheckCircle2, Sparkles, AlertCircle, Building2, MapPin, Star, PlayCircle, Loader2, Info } from 'lucide-react';
import Button from '../components/Button';
import CollegeDetailsModal from '../components/CollegeDetailsModal';
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
  const [chosenCareer, setChosenCareer] = useState('');
  const [showConfidence, setShowConfidence] = useState(false);
  const [showCareerPath, setShowCareerPath] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [selectedCollegeDetails, setSelectedCollegeDetails] = useState(null);

  // If the user is an explorer (doesn't have a rank), treat them like a standard user here
  // so they skip the rank-based college selection and go straight to career paths.
  const is12thPassout = profile?.student_type === '12th Passout' && !profile?.is_explorer;

  useEffect(() => {
    if (is12thPassout) {
      setLoadingColleges(true);
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/get_college_suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank: profile.kcet_rank || profile.rank || 0, exam_type: 'KCET' })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setColleges(data.colleges || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingColleges(false));
    }
  }, [is12thPassout, profile]);
  const handleStartJourney = () => {
    if (!chosen) return;
    // For 12th passout with a college selected → show career path next
    if (is12thPassout && colleges.length > 0 && !showCareerPath) {
      setShowCareerPath(true);
      return;
    }
    setShowConfidence(true);
  };

  const confirm = (isSkip = false) => {
    const skipActive = isSkip === true; // explicitly check for boolean to avoid event objects
    // For 12th passout: career chosen separately; for others: chosen IS the career
    const finalCareer = skipActive ? '' : (is12thPassout ? (chosenCareer || chosen) : chosen);
    setSelectedCareer(finalCareer);

    const updatedProfile = { ...profile, career: chosen, careerPath: finalCareer };
    setUserProfile(updatedProfile);

    // Save to backend — career_path is resolved server-side to a course_id
    const userId = (updatedProfile.name || 'Student').toLowerCase().replace(/\s+/g, '_') || 'demo_user';
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/create_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           user_id:     userId,
           profile:     updatedProfile,
           career_path: finalCareer,            // server resolves → course_id
        })
    }).catch(console.error);

    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  const handleAlternatives = () => {
    if (is12thPassout && colleges.length > 0) {
      // Reset entirely back to college selection for within-rank students
      setShowConfidence(false);
      setShowCareerPath(false);
      setChosen('');
      setChosenCareer('');
    } else {
      setShowConfidence(false);
    }
  };

  const handleSkip = () => {
    if (is12thPassout && colleges.length > 0 && !showCareerPath) {
      // Skip college selection -> go to career selection
      setShowCareerPath(true);
    } else {
      // Skip career selection or confidence check -> go straight to dashboard with no career
      confirm(true);
    }
  };

  const displayCareers = careers.length > 0
    ? careers
    : ['Web Developer', 'Data Analyst', 'Software Engineer'];

  return (
    <div className="career-select min-h-screen flex flex-col items-center bg-[#F8F8F8] relative">
      <button 
        onClick={handleSkip} 
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, background: 'transparent', border: 'none', color: '#111', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        Skip <ChevronRight size={16} color="#111" />
      </button>
      <AnimatePresence mode="wait">
        {/* ── CAREER PATH SELECTION for 12th passout after college picked ── */}
        {showCareerPath && !showConfidence ? (
          <motion.div
            key="career-path"
            className="career-select__content w-full max-w-5xl px-4 md:px-8 flex flex-col mt-6"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
          >
            <div className="career-select__header text-center md:text-left mb-2">
              <p className="career-select__step-label text-sm">Career Suggestions</p>
              <h1 className="text-3xl md:text-4xl">Choose your path</h1>
              <p className="career-select__subtitle mt-2">Based on your profile, here are the best-fit careers for you.</p>
            </div>
            <div className="career-select__why-box">
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <Sparkles size={16} color="#C8A951" />
                <span style={{fontWeight:600,color:'#C8A951',fontSize:14}}>Why these fit you</span>
              </div>
              <p style={{fontSize:14,color:'#555',lineHeight:1.5}}>{whySuited}</p>
            </div>
            <motion.div
              className="career-select__list grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pb-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {displayCareers.map((career) => {
                const isActive = chosenCareer === career;
                const desc = CAREER_DESC[career] || 'Explore this career path with AI-powered guidance.';
                return (
                  <motion.button
                    key={career}
                    type="button"
                    className={`career-select__card ${isActive ? 'career-select__card--active' : ''}`}
                    style={{ justifySelf:'center', width:'100%', maxWidth:'100%' }}
                    variants={cardAnim}
                    onClick={() => setChosenCareer(career)}
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
                onClick={() => setShowConfidence(true)}
                disabled={!chosenCareer}
                variant={chosenCareer ? 'primary' : 'secondary'}
              >
                Proceed with {chosenCareer || 'Selection'} →
              </Button>
            </div>
          </motion.div>
        ) : !showConfidence ? (
          <motion.div
            key="list"
            className="career-select__content w-full max-w-5xl px-4 md:px-8 flex flex-col mt-6"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <div className="career-select__header text-center md:text-left">
              <p className="career-select__step-label text-sm md:text-base">
                {is12thPassout ? "College Recommendations" : "Career Suggestions"}
              </p>
              <h1 className="text-3xl md:text-4xl">
                {is12thPassout ? "Top Matches for Your Rank" : "Choose your path"}
              </h1>
              <p className="career-select__subtitle mt-2 text-base md:text-lg">
                {is12thPassout 
                  ? "Based on your rank and preferences, here are the best colleges for you."
                  : "Based on your profile, here are the best-fit careers for you."}
              </p>
            </div>
            
            <div className="career-select__why-box">
              <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4}}>
                <Sparkles size={16} color="#C8A951" />
                <span style={{fontWeight: 600, color: '#C8A951', fontSize: 14}}>Why these fit you</span>
              </div>
              <p style={{fontSize: 14, color: '#555', lineHeight: 1.5}}>{whySuited}</p>
            </div>

            {is12thPassout && colleges.length > 0 ? (
              <div className="mt-6 pb-6">
                {loadingColleges ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="spin mb-4" size={32} color="#C8A951" />
                    <p>Finding the best colleges for your rank...</p>
                  </div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={container}
                    initial="hidden"
                    animate="show"
                  >
                    {colleges.map((college) => {
                      const isActive = chosen === college.college_name;
                      return (
                        <motion.div
                          key={college.college_name}
                          className={`bg-white rounded-2xl p-5 cursor-pointer border-2 transition-all shadow-sm flex flex-col justify-between ${isActive ? 'border-[#C8A951] bg-[#FFFDF5] scale-[1.02] shadow-md' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}
                          variants={cardAnim}
                          onClick={() => setChosen(college.college_name)}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                  <Building2 size={24} />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{college.college_name}</h3>
                                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                    <MapPin size={14} /> {college.location}
                                  </div>
                                </div>
                              </div>
                              {isActive ? <CheckCircle2 size={24} className="text-[#C8A951] shrink-0" /> : <ChevronRight size={24} className="text-gray-300 shrink-0" />}
                            </div>
                            
                            <div className="flex gap-4 mb-4 mt-4 bg-gray-50 p-3 rounded-lg">
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Highest Pkg</span>
                                <div className="flex items-center gap-1 font-bold text-gray-800">
                                  <Star size={14} className="text-indigo-500" fill="currentColor" />
                                  {college.highest_package || 'N/A'}
                                </div>
                              </div>
                              <div className="flex flex-col border-l pl-4 border-gray-200">
                                <span className="text-xs text-gray-500 uppercase font-semibold">Avg Pkg</span>
                                <div className="font-bold text-gray-800 text-sm mt-0.5">
                                  {college.average_package || 'N/A'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              <div className="flex gap-2 items-start mb-1">
                                <span className="text-emerald-600 font-bold mt-0.5">+</span>
                                <span className="text-gray-600 line-clamp-1">{college.pros?.[0] || 'Good infrastructure'}</span>
                              </div>
                              <div className="flex gap-2 items-start">
                                <span className="text-red-500 font-bold mt-0.5">-</span>
                                <span className="text-gray-600 line-clamp-1">{college.cons?.[0] || 'Strict rules'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {(() => {
                            const reviewLink = college.youtube_review_links?.length > 0
                              ? college.youtube_review_links[0]
                              : `https://www.youtube.com/results?search_query=${encodeURIComponent(college.college_name + ' review')}`;
                            return (
                              <button 
                                onClick={(e) => { e.stopPropagation(); window.open(reviewLink, '_blank'); }}
                                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors"
                              >
                                <PlayCircle size={18} /> Watch Review
                              </button>
                            );
                          })()}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCollegeDetails(college); }}
                            className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                          >
                            <Info size={18} /> More Details
                          </button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            ) : null}

            {is12thPassout && loadingColleges && colleges.length === 0 ? (
              <div className="mt-6 pb-6 flex flex-col items-center justify-center p-12">
                <Loader2 className="spin mb-4" size={32} color="#C8A951" />
                <p>Finding the best colleges for your rank...</p>
              </div>
            ) : null}

            {is12thPassout && !loadingColleges && colleges.length === 0 ? (
              <>
                <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-10 bg-white border border-gray-200 shadow-sm rounded-3xl mb-8 mt-12 text-center">
                  <div className="p-5 bg-gray-50 text-gray-400 rounded-full mb-6 border border-gray-100">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">No Exact Matches Found</h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                    We were unable to find direct matches for your rank at the moment. This doesn't mean there are no opportunities available. You can explore alternative colleges, adjust your preferences, or continue to your dashboard to discover more options tailored to you.
                  </p>
                </div>
                {/* Career path for no-match students */}
                <div className="w-full max-w-2xl mx-auto mb-6">
                  <p className="career-select__step-label text-sm mb-1">Career Suggestions</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your path</h2>
                  <p className="text-gray-500 text-sm mb-4">Based on your profile, here are the best-fit careers for you.</p>
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
                          style={{ justifySelf:'center', width:'100%', maxWidth:'100%' }}
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
                </div>
              </>
            ) : null}

            {!is12thPassout && (
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
            )}

            <div className="career-select__footer">
              <Button
                fullWidth
                onClick={is12thPassout && colleges.length === 0 ? confirm : handleStartJourney}
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
              {is12thPassout && colleges.length > 0 ? (
                <p className="career-select__subtitle" style={{ fontSize: 16 }}>
                  You've selected <b>{chosen}</b> as your college and <b>{chosenCareer}</b> as your career path. If you're unsure about either choice, tap below to go back and reconsider.
                </p>
              ) : (
                <p className="career-select__subtitle" style={{ fontSize: 16 }}>
                  Do you feel confident committing to <b>{chosen}</b>? Your personalized roadmap and daily setup will prioritize this path.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 'auto', marginBottom: 24, width: '100%', maxWidth: 400 }}>
              <Button fullWidth onClick={confirm} variant="primary">
                Yes, let's do this! 🚀
              </Button>
              <Button fullWidth onClick={handleAlternatives} variant="secondary">
                {is12thPassout && colleges.length > 0 ? 'No, let me reconsider my choices' : 'No, show alternatives'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CollegeDetailsModal 
        isOpen={!!selectedCollegeDetails} 
        onClose={() => setSelectedCollegeDetails(null)} 
        college={selectedCollegeDetails} 
      />
    </div>
  );
};

export default CareerSelect;
