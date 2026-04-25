import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Star, PlayCircle, Info, Search, Loader2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import CollegeDetailsModal from '../components/CollegeDetailsModal';
import './CollegeInfo.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

const CollegeInfo = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCollege, setSelectedCollege] = useState(null);

  useEffect(() => {
    // Fetch all colleges with a very high rank so all are returned
    fetch(`${API_BASE}/api/get_all_colleges`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setColleges(data.colleges || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = colleges.filter(c =>
    c.college_name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="college-info lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <TopBar title="College Info" showBack />

      <div className="college-info__content max-w-5xl mx-auto px-4 md:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold text-[#C8A951] uppercase tracking-widest mb-1">College Database</p>
          <h1 className="text-3xl font-black text-gray-900 mb-1">All Colleges</h1>
          <p className="text-gray-500 text-sm">Browse all colleges in our database with full details</p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-8 shadow-sm">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
            placeholder="Search colleges or locations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#C8A951] mb-3" />
            <p className="text-gray-500">Loading college database…</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filtered.map((college) => (
              <motion.div
                key={college.college_name}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gray-200 transition-all"
                variants={cardAnim}
              >
                {/* College header */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{college.college_name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <MapPin size={13} /> {college.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 mb-4 mt-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 uppercase font-semibold">Highest Pkg</span>
                      <div className="flex items-center gap-1 font-bold text-gray-800 text-sm mt-0.5">
                        <Star size={13} className="text-indigo-500" fill="currentColor" />
                        {college.highest_package || 'N/A'}
                      </div>
                    </div>
                    <div className="flex flex-col border-l pl-4 border-gray-200">
                      <span className="text-xs text-gray-500 uppercase font-semibold">Avg Pkg</span>
                      <div className="font-bold text-gray-800 text-sm mt-0.5">
                        {college.average_package || 'N/A'}
                      </div>
                    </div>
                    <div className="flex flex-col border-l pl-4 border-gray-200">
                      <span className="text-xs text-gray-500 uppercase font-semibold">Placement</span>
                      <div className="flex items-center gap-1 font-bold text-gray-800 text-sm mt-0.5">
                        <Star size={13} className="text-amber-500" fill="currentColor" />
                        {college.placement_rating}/5
                      </div>
                    </div>
                  </div>

                  {/* Pros/Cons */}
                  <div className="text-sm mb-3">
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

                {/* Buttons */}
                <div className="mt-2">
                  <button
                    onClick={() => {
                      const link = college.youtube_review_links?.length > 0
                        ? college.youtube_review_links[0]
                        : `https://www.youtube.com/results?search_query=${encodeURIComponent(college.college_name + ' review')}`;
                      window.open(link, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors mb-2"
                  >
                    <PlayCircle size={16} /> Watch Review
                  </button>
                  <button
                    onClick={() => setSelectedCollege(college)}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Info size={16} /> More Details
                  </button>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="col-span-2 text-center py-16 text-gray-400">
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg font-semibold">No colleges found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <CollegeDetailsModal
        isOpen={!!selectedCollege}
        onClose={() => setSelectedCollege(null)}
        college={selectedCollege}
      />

      <BottomNav />
    </div>
  );
};

export default CollegeInfo;
