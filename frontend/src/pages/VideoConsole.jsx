import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles, Loader2, ExternalLink, ChevronRight, Book, Code, MessageSquare, Files, CheckCircle2, Trophy, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../context/AppContext';
import './VideoConsole.css';

const VideoConsole = () => {
    const { videoTitle } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile, selectedCareer } = useAppContext();
    const queryParams = new URLSearchParams(location.search);
    const videoUrl = queryParams.get('url');
    const videoDay = queryParams.get('day') || 1;
    const videoId = queryParams.get('videoId') || 'v1';

    const toEmbedUrl = (url) => {
      if (!url) return '';
      if (url.includes('/embed/')) return url; // already embed
      const match = url.match(/[?&]v=([^&]+)/);
      if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
      // Handle youtu.be short links
      const short = url.match(/youtu\.be\/([^?]+)/);
      if (short) return `https://www.youtube.com/embed/${short[1]}?rel=0&modestbranding=1`;
      return url;
    };

    const [loading, setLoading] = useState(true);
    const [aiNotes, setAiNotes] = useState(null);
    const [activeTab, setActiveTab] = useState('notes');
    const [isCompleted, setIsCompleted] = useState(false);
    const [completing, setCompleting] = useState(false);

    // Quiz state variables
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizIndex, setQuizIndex]         = useState(0);
    const [quizScore, setQuizScore]         = useState(0);
    const [quizDone, setQuizDone]           = useState(false);
    const [quizAnswer, setQuizAnswer]       = useState(null); // selected option
    const [quizSubmitted, setQuizSubmitted] = useState(false); // answered this Q

    // Check initial completion status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const userId  = userProfile?.name || 'demo';
                const res     = await fetch(`${apiBase}/api/get_progress/${encodeURIComponent(userId)}`);
                const data    = await res.json();
                if (data.success && data.progress?.completed_videos?.includes(videoId)) {
                    setIsCompleted(true);
                }
            } catch (err) {
                console.error("Status check failed:", err);
            }
        };
        fetchStatus();
    }, [videoId, userProfile]);

    // Fetch quiz questions
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiBase}/api/get_today_plan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userProfile?.name || 'demo',
                        day: parseInt(videoDay)
                    })
                });
                const data = await res.json();
                if (data.success && data.quiz) {
                    setQuizQuestions(data.quiz);
                }
            } catch(e) { console.error('Quiz fetch failed', e); }
        };
        fetchQuiz();
    }, [videoDay, userProfile]);

    const tabs = [
        { id: 'notes', label: 'AI Notes', icon: <Sparkles size={16} /> },
        { id: 'quiz', label: 'Day Quiz', icon: <Trophy size={16} /> },
        { id: 'resources', label: 'Resources', icon: <Files size={16} /> },
        { id: 'practice', label: 'Playground', icon: <Code size={16} /> },
        { id: 'discussions', label: 'Community', icon: <MessageSquare size={16} /> }
    ];

    useEffect(() => {
        if (videoTitle) {
            setLoading(true);
            const decodedTitle = decodeURIComponent(videoTitle);
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/generate_video_notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_title: decodedTitle })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAiNotes(data.notes);
                }
            })
            .finally(() => setLoading(false));
        }
    }, [videoTitle]);

    const handleComplete = async () => {
        if (isCompleted || completing) return;
        
        setCompleting(true);
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/complete_video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userProfile?.name || 'demo',
                    video_id: videoId,
                    day: parseInt(videoDay)
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsCompleted(true);
                localStorage.setItem('kairo_video_completed', videoId);
            }
        } catch (error) {
            console.error("Failed to update progress:", error);
        } finally {
            setCompleting(false);
        }
    };

    return (
        <div className="learning-console">
            {/* Header / Nav */}
            <header className="console-header">
                <button 
                    onClick={() => {
                        console.log("Back button clicked");
                        navigate('/dashboard'); // Explicit fallback for mobile sync stability
                    }} 
                    className="back-btn"
                >
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </button>
                <div className="console-header-actions">
                </div>
            </header>

            <main className="console-main">
                {/* Left Side: Video Player */}
                <section className="video-section">
                    <div className="video-container">
                        <iframe 
                            src={toEmbedUrl(videoUrl)} 
                            title={videoTitle}
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>

                    <div className="video-info-area">
                        <div className="video-meta-top">
                            {isCompleted ? (
                                <div className="status-badge completed">
                                    <CheckCircle2 size={14} />
                                    <span>Completed</span>
                                </div>
                            ) : (
                                <div className="status-badge pending">
                                    <div className="pulse-dot"></div>
                                    <span>In Progress</span>
                                </div>
                            )}
                            <div className="video-day-info">
                                Day {videoDay} • Interactive Module
                            </div>
                        </div>

                        <h1 className="video-main-title">
                            {decodeURIComponent(videoTitle)}
                        </h1>

                        <div className="video-action-row">
                             <button 
                                className={`mobile-complete-btn ${isCompleted ? 'is-done' : ''}`} 
                                onClick={handleComplete}
                                disabled={completing}
                             >
                                {completing ? (
                                    <Loader2 size={18} className="spin" />
                                ) : isCompleted ? (
                                    <><CheckCircle2 size={18} /> <span>Done</span></>
                                ) : (
                                    <><Play size={18} fill="currentColor" /> <span>Mark Done</span></>
                                )}
                             </button>

                             <div className="video-author-info">
                                <div className="author-avatar">
                                    <img src="https://yt3.ggpht.com/ytc/AIdro_mK_WpX9X1X9Z1X9Z1X9Z1X9Z1X9Z1X9Z1X9Z1X=s88-c-k-c0x00ffffff-no-rj" alt="Author" />
                                </div>
                                <div className="author-details">
                                    <span className="author-name">CodeWithHarry</span>
                                    <span className="author-sub">Mentor</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </section>

                {/* Right Side: Learning Tools */}
                <section className="tools-section">
                    <nav className="tabs-nav">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                className={`tab-link ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="tab-content scroll-area">
                        {activeTab === 'notes' && (
                            <div className="notes-pane">
                                {loading ? (
                                    <div className="console-loader flex flex-col items-center justify-center gap-3 py-10">
                                        <Loader2 size={32} className="spin text-indigo-600" />
                                        <p className="text-sm text-gray-500 font-medium">Synthesizing high-fidelity notes...</p>
                                    </div>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="md-content"
                                    >
                                        <ReactMarkdown>{aiNotes}</ReactMarkdown>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {activeTab === 'quiz' && (
                            <div className="quiz-pane">
                                {quizQuestions.length === 0 ? (
                                    <div className="empty-quiz py-10 flex flex-col items-center justify-center text-gray-500">
                                        <Trophy size={48} className="opacity-20 mb-4" />
                                        <p>No quiz for this lesson yet.</p>
                                    </div>
                                ) : quizDone ? (
                                    <div className="quiz-result-card animate-in fade-in zoom-in duration-300">
                                        <div className="flex flex-col items-center py-8">
                                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                                <Trophy size={40} className="text-indigo-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete! 🎉</h2>
                                            <div className="bg-gray-50 border border-gray-100 px-6 py-3 rounded-2xl mb-6">
                                                <span className="text-gray-600 font-medium">Score: </span>
                                                <span className="text-2xl font-black text-indigo-600">{quizScore} / {quizQuestions.length}</span>
                                            </div>
                                            
                                            <div style={{color: quizScore >= quizQuestions.length * 0.7 ? '#10b981' : '#ef4444', fontWeight:600}} className="mb-8">
                                                {quizScore >= quizQuestions.length * 0.7 ? '✓ Passed! You are on fire! 🔥' : 'Try again to improve your score'}
                                            </div>

                                            <button 
                                                onClick={() => { setQuizIndex(0); setQuizScore(0); setQuizDone(false); setQuizAnswer(null); setQuizSubmitted(false); }}
                                                className="retake-btn px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                                            >
                                                Retake Quiz
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="quiz-question-card">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question {quizIndex + 1} of {quizQuestions.length}</span>
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">Score: {quizScore}</div>
                                        </div>

                                        <div className="question-content mb-8">
                                            <p className="text-lg font-bold text-gray-800 leading-relaxed">
                                                {quizQuestions[quizIndex]?.q}
                                            </p>
                                        </div>

                                        <div className="options-grid grid grid-cols-1 gap-3 mb-8">
                                            {quizQuestions[quizIndex]?.options.map((opt, i) => {
                                                const isCorrect = opt === quizQuestions[quizIndex].answer;
                                                const isSelected = opt === quizAnswer;
                                                let bg = '#ffffff', border = '#e5e7eb', color = '#374151';
                                                if (quizSubmitted) {
                                                    if (isCorrect) { bg='#d1fae5'; border='#10b981'; color='#065f46'; }
                                                    else if (isSelected && !isCorrect) { bg='#fee2e2'; border='#ef4444'; color='#991b1b'; }
                                                } else if (isSelected) {
                                                    bg='#eef2ff'; border='#6366f1'; color='#4338ca';
                                                }
                                                return (
                                                    <button 
                                                        key={i}
                                                        disabled={quizSubmitted}
                                                        onClick={() => setQuizAnswer(opt)}
                                                        className="option-btn"
                                                        style={{
                                                            padding:'16px 20px', borderRadius:14, border:`1.5px solid ${border}`,
                                                            background:bg, color, textAlign:'left', cursor: quizSubmitted?'default':'pointer',
                                                            fontSize:14, fontWeight: isSelected?600:400, transition:'all 0.2s',
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                        }}
                                                    >
                                                        <span>{opt}</span>
                                                        {quizSubmitted && isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                                                        {quizSubmitted && isSelected && !isCorrect && <span className="text-red-500 font-bold">✗</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {!quizSubmitted ? (
                                            <button 
                                                disabled={!quizAnswer}
                                                onClick={() => {
                                                    setQuizSubmitted(true);
                                                    if (quizAnswer === quizQuestions[quizIndex].answer) setQuizScore(s => s+1);
                                                }}
                                                className={`submit-ans-btn w-full py-4 rounded-2xl font-bold transition-all shadow-md ${quizAnswer ? 'bg-indigo-600 text-white active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                Submit Answer
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    if (quizIndex + 1 >= quizQuestions.length) {
                                                        setQuizDone(true);
                                                        // Save quiz completion to backend
                                                        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                                        fetch(`${apiBase}/api/complete_quiz`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                user_id: userProfile?.name || 'demo',
                                                                day: parseInt(videoDay),
                                                                score: quizScore + (quizAnswer === quizQuestions[quizIndex].answer ? 1 : 0)
                                                            })
                                                        }).catch(console.error);
                                                    } else {
                                                        setQuizIndex(i => i+1);
                                                        setQuizAnswer(null);
                                                        setQuizSubmitted(false);
                                                    }
                                                }}
                                                className="next-q-btn w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold active:scale-95 transition-all shadow-md"
                                            >
                                                {quizIndex + 1 >= quizQuestions.length ? 'Finish Quiz 🏆' : 'Next Question →'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'practice' && (
                            <div className="practice-pane">
                                <div className="warning-card">
                                    <h3>💻 Desktop Required</h3>
                                    <p>The Interactive Code Playground requires a keyboard and professional IDE environment. Please switch to a laptop or PC to practice coding tasks.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'resources' && (
                            <div className="resources-pane">
                                <h3>Lesson Assets</h3>
                                <p className="text-gray-500 mb-6">Download source code and cheatsheets for this module.</p>
                                <div className="resource-list">
                                    <div className="empty-resource">
                                        <Files size={32} className="opacity-20 mb-2" />
                                        <span>No extra resources for this lesson yet.</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'discussions' && (
                            <div className="discussions-pane">
                                <div className="coming-soon">
                                    <MessageSquare size={32} className="opacity-20 mb-2" />
                                    <h3>Student Lounge</h3>
                                    <p>Coming Soon in Phase 2. Connect with thousands of other students learning this concept.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default VideoConsole;
