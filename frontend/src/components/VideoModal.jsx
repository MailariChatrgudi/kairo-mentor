import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Maximize, ExternalLink, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './VideoModal.css';

const VideoModal = ({ isOpen, onClose, video }) => {
  const [loading, setLoading] = useState(true);
  const [aiNotes, setAiNotes] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');

  const tabs = [
    { id: 'notes', label: 'Notes' },
    { id: 'resources', label: 'Resources' },
    { id: 'practice', label: 'Code Playground' },
    { id: 'discussions', label: 'Discussions' }
  ];

  useEffect(() => {
    if (isOpen && video?.title) {
        setLoading(true);
        // Avoid regenerating if identical video
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/generate_video_notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_title: video.title })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setAiNotes(data.notes);
            }
        })
        .finally(() => setLoading(false));
    } else {
        setAiNotes(null);
    }
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="video-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="video-modal-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()} // stop click from closing
        >
            <div className="video-modal-header">
                <h3>{video.title}</h3>
                <button onClick={onClose} className="video-modal-close"><X size={20} /></button>
            </div>
            
            <div className="video-modal-body">
                <div className="video-modal-player-wrap">
                    <iframe 
                        className="video-modal-iframe"
                        src={video.url} 
                        title={video.title}
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                    <div className="video-modal-fallback">
                        <p>Video not loading? Embedding might be restricted.</p>
                        <a 
                            href={video.url.replace('youtube-nocookie.com/embed/', 'youtube.com/watch?v=').split('?')[0]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="youtube-fallback-btn"
                        >
                            <ExternalLink size={14} />
                            Open Tutorial on YouTube
                        </a>
                    </div>
                </div>

                <div className="video-modal-details">
                    <div className="video-modal-tabs">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                className={`video-modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="video-modal-tab-content">
                        {activeTab === 'notes' && (
                            <div className="video-modal-notes scroll-area">
                                <div className="video-modal-notes-header">
                                    <Sparkles size={16} color="#C8A951" />
                                    <h4>AI Study Guide</h4>
                                </div>
                                <div className="video-modal-notes-body md-content">
                                    {loading ? (
                                        <div className="video-modal-spinner">
                                            <Loader2 size={18} className="spin" color="#666" />
                                            <span>Synthesizing lecture...</span>
                                        </div>
                                    ) : (
                                        <ReactMarkdown>{aiNotes}</ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'practice' && (
                            <div className="video-modal-placeholder">
                                <div className="warning-box">
                                    <h4 className="text-amber-800 font-bold mb-2">Notice</h4>
                                    <p className="text-amber-700 text-sm">
                                        You cannot complete further steps using mobile phone. 
                                        You will need a laptop to access the Code Playground.
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'resources' && (
                            <div className="video-modal-placeholder p-6">
                                <div className="w-full">
                                    <h4 className="text-gray-800 font-bold mb-4">Lesson Resources</h4>
                                    {(video.resources && video.resources.length > 0) ? (
                                        <div className="flex flex-col gap-3">
                                            {video.resources.map((res, ridx) => (
                                                <a 
                                                    key={ridx}
                                                    href={res.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <ExternalLink size={18} className="text-indigo-600" />
                                                        <span className="font-medium text-gray-700">{res.label}</span>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-400" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center opacity-40 py-10">
                                            <p>No extra resources for this lesson.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'discussions' && (
                            <div className="video-modal-placeholder text-center py-10 opacity-40">
                                <p>Coming Soon in Version 2.0</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoModal;
