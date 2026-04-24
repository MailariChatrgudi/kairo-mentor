import React from 'react';
import { motion } from 'framer-motion';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import MyJourney from '../components/MyJourney';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './SkillHub.css';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const SkillHub = () => {
  const { roadmapData, journeyProgress } = useAppContext();
  return (
    <div className="skill-hub lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <TopBar title="My Journey & Skills" showBack />

      <motion.div
        className="skill-hub__content max-w-4xl mx-auto p-4 lg:p-10" style={{paddingTop: 16}}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="mb-10">
          <MyJourney />
        </motion.div>

        <motion.div variants={item} className="skill-hub__skills">
           <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
             <Sparkles size={20} className="text-indigo-600" />
             Core Mastery Modules
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(roadmapData?.phases || []).map((phase, idx) => {
                const isDone = idx < (journeyProgress?.currentPhase || 1) - 1;
                const isActive = idx === (journeyProgress?.currentPhase || 1) - 1;
                
                return (
                  <div key={idx} className={`p-5 rounded-2xl border transition-all ${isDone ? 'bg-emerald-50 border-emerald-100' : isActive ? 'bg-white border-indigo-200 shadow-lg' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] uppercase font-bold tracking-widest ${isDone ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {isDone ? 'Mastered' : isActive ? 'In Training' : 'Upcoming'}
                      </span>
                      {isDone && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{phase.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{phase.description}</p>
                    
                    <div className="mt-4 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isDone ? 'w-full bg-emerald-500' : isActive ? 'w-1/3 bg-indigo-500' : 'w-0'}`}
                      ></div>
                    </div>
                  </div>
                );
              })}
           </div>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default SkillHub;
