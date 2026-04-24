import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import './SplashScreen.css';

// Build-safe logo path
const logoPath = '/logo.jpeg';
const placeholderLogo = 'https://ui-avatars.com/api/?name=KAIRO&background=C8A951&color=fff&size=256';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAppContext();
  const [phase, setPhase] = useState(0); // 0=logo, 1=tagline, 2=exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => {
      navigate(isLoggedIn ? '/dashboard' : '/onboarding');
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate, isLoggedIn]);

  return (
    <div className="splash">
      <div className="splash__gradient" />
      <AnimatePresence>
        {phase < 2 && (
          <motion.div
            className="splash__content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="splash__logo">
              <img 
                src={logoPath} 
                alt="KAIRO Logo" 
                className="splash__logo-img" 
                onError={(e) => e.target.src = placeholderLogo}
              />
            </div>
            {phase >= 1 && (
              <motion.p
                className="splash__tagline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Your AI Career Mentor
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
