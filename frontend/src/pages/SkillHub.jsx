import React from 'react';
import { motion } from 'framer-motion';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import MyJourney from '../components/MyJourney';
import './SkillHub.css';

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0 },
};

const SkillHub = () => {
  return (
    <div className="skill-hub lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <TopBar title="My Journey & Skills" showBack />

      <motion.div
        className="skill-hub__content max-w-4xl mx-auto p-4 lg:p-10"
        style={{ paddingTop: 16 }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="mb-10">
          <MyJourney />
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default SkillHub;
