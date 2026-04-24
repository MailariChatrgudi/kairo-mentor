import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, BarChart3, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import './Onboarding.css';

const slides = [
  {
    icon: Compass,
    title: 'Find your path',
    desc: 'Discover the right career direction with personalized AI guidance tailored just for you.',
    color: '#C8A951',
  },
  {
    icon: BarChart3,
    title: 'Make better decisions',
    desc: 'Compare branches, colleges, and opportunities with data-driven insights.',
    color: '#B8A060',
  },
  {
    icon: Sparkles,
    title: 'Grow with confidence',
    desc: 'Build skills, track progress, and step into your future with clarity.',
    color: '#A89848',
  },
];

const Onboarding = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate('/setup');
    }
  };

  const skip = () => navigate('/setup');

  return (
    <div className="onboarding min-h-screen flex flex-col items-center bg-[#F8F8F8]">
      <button className="onboarding__skip" onClick={skip}>Skip</button>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="onboarding__slide w-full max-w-5xl px-4 md:px-8 mt-12"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.35 }}
        >
          <div className="onboarding__icon-wrap" style={{ background: `${slides[current].color}15` }}>
            {React.createElement(slides[current].icon, {
              size: 56,
              strokeWidth: 1.5,
              color: slides[current].color,
            })}
          </div>
          <h1 className="onboarding__title">{slides[current].title}</h1>
          <p className="onboarding__desc">{slides[current].desc}</p>
        </motion.div>
      </AnimatePresence>

      <div className="onboarding__footer w-full max-w-lg mt-auto pb-10 mx-auto px-4 flex flex-col items-center gap-6">
        <div className="onboarding__dots">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`onboarding__dot ${i === current ? 'onboarding__dot--active' : ''}`}
            />
          ))}
        </div>
        <Button fullWidth onClick={next}>
          {current < slides.length - 1 ? 'Continue' : 'Get Started'}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
