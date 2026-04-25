import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Building2, Briefcase, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';

const CollegeDetailsModal = ({ isOpen, onClose, college }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!college) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
            >
            {/* Header */}
            <div className="flex justify-between items-start p-6 bg-gray-50 border-b border-gray-100">
              <div className="pr-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{college.college_name}</h2>
                <div className="flex items-center text-gray-500 text-sm gap-2">
                  <MapPin size={16} />
                  <span>{college.location}</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Ratings */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-amber-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="text-amber-500 mb-1"><Star size={24} fill="currentColor" /></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Placement</span>
                  <span className="text-lg font-bold text-gray-900">{college.placement_rating}/5</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="text-blue-500 mb-1"><Building2 size={24} /></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Infrastructure</span>
                  <span className="text-lg font-bold text-gray-900">{college.infrastructure_rating}/5</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="text-emerald-500 mb-1"><GraduationCap size={24} /></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Academics</span>
                  <span className="text-lg font-bold text-gray-900">{college.academics_rating}/5</span>
                </div>
              </div>

              {/* Package & Top Companies */}
              <div className="bg-gray-50 p-5 rounded-2xl mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase">Avg Package</h3>
                      <p className="text-xl font-bold text-gray-900">{college.average_package}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Star size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase">Highest Package</h3>
                      <p className="text-xl font-bold text-gray-900">{college.highest_package || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Top Recruiters</h3>
                  <div className="flex flex-wrap gap-2">
                    {college.top_companies?.map((company, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-full shadow-sm">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cutoffs */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star size={20} className="text-amber-500" />
                  Cutoff Ranks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(college.cutoff_rank || {}).map(([exam, branches]) => (
                    <div key={exam} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="bg-gray-100 py-2 px-4 font-bold text-gray-700">{exam}</div>
                      <div className="p-4">
                        {Object.entries(branches).map(([branch, rank]) => (
                          <div key={branch} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <span className="text-sm font-semibold text-gray-600">{branch}</span>
                            <span className="text-sm font-bold text-gray-900">{rank}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Management Fees */}
              {college.management_fees && Object.keys(college.management_fees).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-indigo-500" />
                    Management Quota Fees
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(college.management_fees).map(([branch, fee]) => {
                      if (branch.toLowerCase() === 'note') return null; // Handle notes separately
                      return (
                        <div key={branch} className="bg-indigo-50 p-4 rounded-xl flex justify-between items-center">
                          <span className="text-sm font-bold text-indigo-900">{branch.replace('_', ' ')}</span>
                          <span className="text-sm font-bold text-indigo-700">{fee}</span>
                        </div>
                      );
                    })}
                  </div>
                  {college.management_fees.Note && (
                    <div className="mt-3 text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                      * {college.management_fees.Note}
                    </div>
                  )}
                </div>
              )}

              {/* Branches Available */}
              {college.branches_available?.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap size={20} className="text-blue-500" />
                    Branches Available
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {college.branches_available.map((branch, i) => (
                      <span key={i} className="px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-emerald-600 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={20} /> Pros
                  </h3>
                  <ul className="space-y-2">
                    {college.pros?.map((pro, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-500 mb-3 flex items-center gap-2">
                    <AlertCircle size={20} /> Cons
                  </h3>
                  <ul className="space-y-2">
                    {college.cons?.map((con, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-red-400 font-bold mt-0.5">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* YouTube Reviews */}
              {college.youtube_review_links && college.youtube_review_links.length > 0 && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Video Reviews</h3>
                  <div className="flex flex-wrap gap-3">
                    {college.youtube_review_links.map((link, i) => (
                      <a 
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors"
                      >
                        YouTube Review {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CollegeDetailsModal;
