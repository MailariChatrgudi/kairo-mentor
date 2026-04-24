import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, CheckCircle2, XCircle } from 'lucide-react';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import BottomNav from '../components/BottomNav';
import './DecisionEngine.css';

const comparisons = {
  'core-vs-it': {
    title: 'Core Branch vs IT Branch',
    optionA: { name: 'Core (Mech/Civil/Elec)', pros: ['Government job eligibility', 'PSU opportunities', 'Hands-on engineering', 'GATE relevance'], cons: ['Lower avg packages', 'Fewer startup opportunities', 'Less remote work'] },
    optionB: { name: 'IT / CS Branch', pros: ['High avg packages', 'Remote work options', 'Startup ecosystem', 'Global demand'], cons: ['Highly competitive', 'Constant upskilling needed', 'Screen-heavy work'] },
  },
  'gate-vs-job': {
    title: 'GATE Exam vs Direct Job',
    optionA: { name: 'GATE / Higher Studies', pros: ['IIT/NIT M.Tech access', 'PSU recruitment', 'Research opportunities', 'Higher long-term salary'], cons: ['2+ years more study', 'No immediate income', 'High competition'] },
    optionB: { name: 'Direct Job', pros: ['Immediate income', 'Real-world experience', 'Career head start', 'Financial independence'], cons: ['Lower starting salary possible', 'May need degree later', 'Less theoretical depth'] },
  },
};

const DecisionEngine = () => {
  const [activeTab, setActiveTab] = useState('core-vs-it');
  const data = comparisons[activeTab];

  return (
    <div className="decision-engine">
      <TopBar title="Decision Engine" showBack />

      <div className="decision-engine__tabs">
        {Object.entries(comparisons).map(([key, val]) => (
          <button
            key={key}
            className={`decision-engine__tab ${activeTab === key ? 'decision-engine__tab--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {key === 'core-vs-it' ? 'Core vs IT' : 'GATE vs Job'}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        className="decision-engine__content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="decision-engine__vs-header">
          <span className="decision-engine__option-name">{data.optionA.name}</span>
          <div className="decision-engine__vs-badge">
            <ArrowLeftRight size={16} color="#C8A951" />
          </div>
          <span className="decision-engine__option-name">{data.optionB.name}</span>
        </div>

        <div className="decision-engine__grid">
          {/* Option A */}
          <Card className="decision-engine__card">
            <h3 className="decision-engine__card-title">{data.optionA.name}</h3>
            <div className="decision-engine__list">
              {data.optionA.pros.map(p => (
                <div key={p} className="decision-engine__item decision-engine__item--pro">
                  <CheckCircle2 size={15} color="#5CB85C" strokeWidth={2} />
                  <span>{p}</span>
                </div>
              ))}
              {data.optionA.cons.map(c => (
                <div key={c} className="decision-engine__item decision-engine__item--con">
                  <XCircle size={15} color="#E88" strokeWidth={2} />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Option B */}
          <Card className="decision-engine__card">
            <h3 className="decision-engine__card-title">{data.optionB.name}</h3>
            <div className="decision-engine__list">
              {data.optionB.pros.map(p => (
                <div key={p} className="decision-engine__item decision-engine__item--pro">
                  <CheckCircle2 size={15} color="#5CB85C" strokeWidth={2} />
                  <span>{p}</span>
                </div>
              ))}
              {data.optionB.cons.map(c => (
                <div key={c} className="decision-engine__item decision-engine__item--con">
                  <XCircle size={15} color="#E88" strokeWidth={2} />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
};

export default DecisionEngine;
