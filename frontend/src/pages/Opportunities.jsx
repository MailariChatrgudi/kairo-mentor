import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Calendar } from 'lucide-react';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import BottomNav from '../components/BottomNav';
import './Opportunities.css';

const filters = ['All', 'Internship', 'Job', 'Hackathon', 'Scholarship'];

const opportunities = [
  { title: 'SDE Intern – Google', type: 'Internship', location: 'Bangalore', deadline: 'May 15, 2026', tags: ['Remote', 'Paid'], color: '#C8A951' },
  { title: 'Frontend Developer – Razorpay', type: 'Job', location: 'Bangalore', deadline: 'Jun 1, 2026', tags: ['Onsite', 'Full-time'], color: '#B0A878' },
  { title: 'Smart India Hackathon', type: 'Hackathon', location: 'Pan India', deadline: 'May 30, 2026', tags: ['Team', 'Free'], color: '#A89848' },
  { title: 'AICTE Scholarship', type: 'Scholarship', location: 'India', deadline: 'Apr 30, 2026', tags: ['Merit', 'UG'], color: '#8B8040' },
  { title: 'ML Research Intern – Microsoft', type: 'Internship', location: 'Hyderabad', deadline: 'May 20, 2026', tags: ['Hybrid', 'Stipend'], color: '#C8A951' },
  { title: 'Full Stack – Flipkart', type: 'Job', location: 'Bangalore', deadline: 'Jun 10, 2026', tags: ['Onsite', 'Full-time'], color: '#B0A878' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const Opportunities = () => {
  const [active, setActive] = useState('All');

  const filtered = active === 'All'
    ? opportunities
    : opportunities.filter(o => o.type === active);

  return (
    <div className="opportunities lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <TopBar title="Opportunities" showBack />

      <div className="max-w-4xl mx-auto">
        <div className="opportunities__filters">
        {filters.map(f => (
          <button
            key={f}
            className={`opportunities__filter ${active === f ? 'opportunities__filter--active' : ''}`}
            onClick={() => setActive(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <motion.div
        className="opportunities__list"
        variants={container}
        initial="hidden"
        animate="show"
        key={active}
      >
        {filtered.map((opp, i) => (
          <motion.div key={opp.title + i} variants={item}>
            <Card className="opportunities__card">
              <div className="opportunities__card-header">
                <div>
                  <span className="opportunities__type" style={{ color: opp.color }}>{opp.type}</span>
                  <h3 className="opportunities__title">{opp.title}</h3>
                </div>
                <ExternalLink size={18} color="#CCCCCC" strokeWidth={1.5} />
              </div>
              <div className="opportunities__meta">
                <div className="opportunities__meta-item">
                  <MapPin size={13} strokeWidth={1.5} />
                  <span>{opp.location}</span>
                </div>
                <div className="opportunities__meta-item">
                  <Calendar size={13} strokeWidth={1.5} />
                  <span>{opp.deadline}</span>
                </div>
              </div>
              <div className="opportunities__tags">
                {opp.tags.map(t => (
                  <span key={t} className="opportunities__tag">{t}</span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Opportunities;
