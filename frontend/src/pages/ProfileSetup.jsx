import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, GraduationCap, Target, Wallet, Globe,
  ChevronRight, Hash, BookOpen, Loader2, Sparkles, Brain, Compass
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAppContext } from '../context/AppContext';
import './ProfileSetup.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Option sets ─────────────────────────────────────────────────────────────── */
const INTERESTS  = ['IT', 'Core', 'Govt', 'Startup'];
const GOALS      = ['Job', 'Higher Studies', 'Startup', 'Govt'];
const FINANCES   = ['Low', 'Medium', 'High'];
const LANGUAGES  = ['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil'];
const YEARS      = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

/* IKS Sets */
const IKS_ENJOY    = ['Building things', 'Solving puzzles', 'Leading teams', 'Creative design'];
const IKS_LIFE     = ['High Salary', 'Work-Life Balance', 'Social Impact', 'Fame'];
const IKS_LEARNING = ['Hands-on project', 'Watching videos', 'Reading docs', 'Group study'];
const IKS_STRENGTH = ['Logical thinking', 'Creativity', 'Communication', 'Hard work'];
const IKS_RISK     = ['Safe (Job Security)', 'Moderate (Growth)', 'High (Startup/Business)'];

/* ── Chip helper ─────────────────────────────────────────────────────────────── */
const ChipGroup = ({ options, value, onChange, icon: Icon }) => (
  <div className="profile-setup__goals">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        className={`profile-setup__goal-chip ${value === opt ? 'profile-setup__goal-chip--active' : ''}`}
        onClick={() => onChange(opt)}
      >
        {Icon && <Icon size={14} strokeWidth={1.5} />}
        {opt}
      </button>
    ))}
  </div>
);

/* ── Steps config ────────────────────────────────────────────────────────────── */
const steps = [
  { title: "What's your name?",       subtitle: "Let's personalise your experience" },
  { title: 'What type of student?',   subtitle: 'Tell us where you are in your journey' },
  { title: 'Your interest & goal',    subtitle: 'We\'ll tailor career suggestions for you' },
  { title: 'Background & language',   subtitle: 'Helps us personalise recommendations' },
  { title: 'Self-Discovery (1/2)',    subtitle: 'What drives you?' },
  { title: 'Self-Discovery (2/2)',    subtitle: 'Your strengths and style' },
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { setUserProfile } = useAppContext();

  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Form fields
  const [name, setName]               = useState('');
  const [studentType, setStudentType] = useState('');
  const [kcetRank, setKcetRank]       = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [interest, setInterest]       = useState('');
  const [goal, setGoal]               = useState('');
  const [finance, setFinance]         = useState('');
  const [language, setLanguage]       = useState('English');
  
  // IKS Form fields
  const [iksEnjoy, setIksEnjoy]       = useState('');
  const [iksLife, setIksLife]         = useState('');
  const [iksLearning, setIksLearning] = useState('');
  const [iksStrength, setIksStrength] = useState('');
  const [iksRisk, setIksRisk]         = useState('');

  const progress = ((step + 1) / steps.length) * 100;

  /* ── Validation per step ─────────────────────────────────────────────────── */
  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) {
      if (!studentType) return false;
      if (studentType === '12th Passout') return kcetRank.trim().length > 0;
      if (studentType === 'Engineering Student') return currentYear.length > 0;
      return false;
    }
    if (step === 2) return interest.length > 0 && goal.length > 0;
    if (step === 3) return finance.length > 0 && language.length > 0;
    if (step === 4) return iksEnjoy.length > 0 && iksLife.length > 0;
    if (step === 5) return iksLearning.length > 0 && iksStrength.length > 0 && iksRisk.length > 0;
    return true;
  };

  /* ── Submit profile → POST /api/get_career ───────────────────────────────── */
  const submitProfile = async () => {
    setLoading(true);
    setError('');

    const iks_answers = {
      enjoy: iksEnjoy,
      life: iksLife,
      learning_style: iksLearning,
      strength: iksStrength,
      risk_level: iksRisk
    };

    const profile = {
      name,
      student_type: studentType,
      interest,
      goal,
      financial_background: finance,
      preferred_language: language,
      iks_answers,
      ...(studentType === '12th Passout'
        ? { kcet_rank: parseInt(kcetRank) || 0 }
        : { current_year: currentYear }),
    };

    try {
      const res = await fetch(`${API_BASE}/api/get_career`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest,
          goal,
          rank: studentType === '12th Passout' ? parseInt(kcetRank) || 0 : 0,
          student_type: studentType,
          financial_background: finance,
          preferred_language: language,
          current_year: currentYear || null,
          iks_answers
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to get career suggestions');
      }

      setUserProfile(profile);
      const careers = json.data?.suggested_careers || [];
      const whySuited = json.data?.why_suited || "Based on our analysis, this fits you perfectly.";
      
      // Navigate to CareerSelect with careers, profile, and IKS generated personalized explanation
      navigate('/career-select', { state: { careers, profile, whySuited, completeAIResponse: json.data } });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    setError('');
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      submitProfile();
    }
  };

  return (
    <div className="profile-setup min-h-screen flex flex-col items-center bg-[#F8F8F8]">
      {/* Progress bar */}
      <div className="profile-setup__progress-track">
        <motion.div
          className="profile-setup__progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="profile-setup__content w-full max-w-5xl px-4 md:px-8 mt-6"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
        >
          <div className="profile-setup__header text-center md:text-left">
            <p className="profile-setup__step-label text-sm">Step {step + 1} of {steps.length}</p>
            <h1 className="text-3xl md:text-4xl leading-tight mb-2">{steps[step].title}</h1>
            <p className="text-base text-gray-500">{steps[step].subtitle}</p>
          </div>


          <div className="profile-setup__body">
            {/* ── Step 0: Name ── */}
            {step === 0 && (
              <Input
                label="Your Name"
                placeholder="e.g. Arjun"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User size={20} strokeWidth={1.5} />}
              />
            )}

            {/* ── Step 1: Student Type + conditional field ── */}
            {step === 1 && (
              <div className="profile-setup__step-group">
                <p className="profile-setup__field-label">I am a…</p>
                <div className="profile-setup__type-cards grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {['12th Passout', 'Engineering Student'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`profile-setup__type-card p-6 ${studentType === type ? 'profile-setup__type-card--active' : ''}`}
                      onClick={() => { setStudentType(type); setKcetRank(''); setCurrentYear(''); }}
                    >
                      {type === '12th Passout'
                        ? <BookOpen size={24} strokeWidth={1.5} />
                        : <GraduationCap size={24} strokeWidth={1.5} />}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>

                {studentType === '12th Passout' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Input
                      label="KCET Rank"
                      placeholder="e.g. 12500"
                      type="number"
                      value={kcetRank}
                      onChange={(e) => setKcetRank(e.target.value)}
                      icon={<Hash size={20} strokeWidth={1.5} />}
                    />
                  </motion.div>
                )}

                {studentType === 'Engineering Student' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="profile-setup__field-label" style={{ marginTop: 20 }}>Current Year</p>
                    <ChipGroup
                      options={YEARS}
                      value={currentYear}
                      onChange={setCurrentYear}
                      icon={ChevronRight}
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* ── Step 2: Interest + Goal ── */}
            {step === 2 && (
              <div className="profile-setup__step-group">
                <p className="profile-setup__field-label">Area of Interest</p>
                <ChipGroup options={INTERESTS} value={interest} onChange={setInterest} icon={Target} />

                <p className="profile-setup__field-label" style={{ marginTop: 20 }}>My Goal</p>
                <ChipGroup options={GOALS} value={goal} onChange={setGoal} icon={ChevronRight} />
              </div>
            )}

            {/* ── Step 3: Finance + Language ── */}
            {step === 3 && (
              <div className="profile-setup__step-group">
                <p className="profile-setup__field-label">Financial Background</p>
                <ChipGroup options={FINANCES} value={finance} onChange={setFinance} icon={Wallet} />

                <p className="profile-setup__field-label" style={{ marginTop: 20 }}>Preferred Language</p>
                <ChipGroup options={LANGUAGES} value={language} onChange={setLanguage} icon={Globe} />
              </div>
            )}

            {/* ── Step 4: IKS Enjoy & Life ── */}
            {step === 4 && (
              <div className="profile-setup__step-group">
                <p className="profile-setup__field-label">What do you genuinely enjoy?</p>
                <ChipGroup options={IKS_ENJOY} value={iksEnjoy} onChange={setIksEnjoy} icon={Sparkles} />

                <p className="profile-setup__field-label" style={{ marginTop: 20 }}>What kind of life do you want?</p>
                <ChipGroup options={IKS_LIFE} value={iksLife} onChange={setIksLife} icon={Compass} />
              </div>
            )}

            {/* ── Step 5: IKS Learning, Strength, Risk ── */}
            {step === 5 && (
              <div className="profile-setup__step-group" style={{ paddingBottom: '40px' }}>
                <p className="profile-setup__field-label">Your preferred learning style</p>
                <ChipGroup options={IKS_LEARNING} value={iksLearning} onChange={setIksLearning} icon={BookOpen} />

                <p className="profile-setup__field-label" style={{ marginTop: 20 }}>Your biggest strength</p>
                <ChipGroup options={IKS_STRENGTH} value={iksStrength} onChange={setIksStrength} icon={Brain} />

                <p className="profile-setup__field-label" style={{ marginTop: 20 }}>Your risk tolerance level</p>
                <ChipGroup options={IKS_RISK} value={iksRisk} onChange={setIksRisk} icon={Target} />
              </div>
            )}

            {error && (
              <p className="profile-setup__error">{error}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="profile-setup__footer w-full max-w-lg mt-auto text-center mx-auto px-4 pb-8">
        <Button
          fullWidth
          onClick={next}
          disabled={!canProceed() || loading}
          variant={canProceed() && !loading ? 'primary' : 'secondary'}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Loader2 size={16} className="spin" />
              Analyzing with AI...
            </span>
          ) : step < steps.length - 1 ? 'Continue' : 'Get Career Options'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSetup;
