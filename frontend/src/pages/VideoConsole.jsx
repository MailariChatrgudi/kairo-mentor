import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Sparkles, Loader2, ExternalLink, ChevronRight,
    Book, Code, MessageSquare, Files, CheckCircle2, Trophy, Play
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../context/AppContext';
import './VideoConsole.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VideoConsole = () => {
    const { videoTitle } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile } = useAppContext();

    const queryParams = new URLSearchParams(location.search);
    const videoUrl = queryParams.get('url');
    const videoDay = parseInt(queryParams.get('day') || '1', 10);
    const videoId  = queryParams.get('videoId') || 'v1';

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getUserId = () =>
        (userProfile?.name || 'demo').toLowerCase().replace(/\s+/g, '_');

    const toEmbedUrl = (url) => {
        if (!url) return '';
        if (url.includes('/embed/')) return url;
        const full = url.match(/[?&]v=([^&]+)/);
        if (full) return `https://www.youtube-nocookie.com/embed/${full[1]}`;
        const short = url.match(/youtu\.be\/([^?]+)/);
        if (short) return `https://www.youtube-nocookie.com/embed/${short[1]}`;
        return url;
    };

    // ── State ─────────────────────────────────────────────────────────────────
    const [loading, setLoading]         = useState(true);
    const [aiNotes, setAiNotes]         = useState(null);
    const [activeTab, setActiveTab]     = useState('notes');
    const [isCompleted, setIsCompleted] = useState(false);
    const [completing, setCompleting]   = useState(false);
    const [currentResource, setCurrentResource] = useState(null);

    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizIndex, setQuizIndex]         = useState(0);
    const [quizScore, setQuizScore]         = useState(0);
    const [quizDone, setQuizDone]           = useState(false);
    const [quizAnswer, setQuizAnswer]       = useState(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    // ── SYSTEM 7: Fetch user data to check completion & resources ──────────────
    useEffect(() => {
        const fetchDayData = async () => {
            try {
                const userId = getUserId();

                // Fetch full user to check video_progress[day_N][videoId]
                const userRes  = await fetch(`${API_BASE}/api/get_user/${encodeURIComponent(userId)}`);
                const userData = await userRes.json();
                if (userData.success && userData.user) {
                    const dayKey   = `day_${videoDay}`;
                    const vProg    = userData.user.video_progress || {};
                    const dayProg  = vProg[dayKey] || {};
                    setIsCompleted(dayProg[videoId] === true);
                }

                // Fetch day data for quiz & resource link
                const dayRes  = await fetch(`${API_BASE}/api/get_today_plan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, day: videoDay })
                });
                const dayData = await dayRes.json();
                if (dayData.success) {
                    if (dayData.quiz) setQuizQuestions(dayData.quiz);
                    const vid = dayData.videos?.find(
                        v => v.id === videoId || v.id === `t${videoId}`
                    );
                    if (vid?.resource) setCurrentResource(vid.resource);
                }
            } catch (err) {
                console.error('VideoConsole init fetch failed:', err);
            }
        };
        fetchDayData();
    }, [videoId, videoDay, userProfile]);

    // ── AI Notes fetch ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!videoTitle) return;
        setLoading(true);
        const decodedTitle = decodeURIComponent(videoTitle);
        fetch(`${API_BASE}/api/generate_video_notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_title: decodedTitle })
        })
        .then(r => r.json())
        .then(data => { if (data.success) setAiNotes(data.notes); })
        .finally(() => setLoading(false));
    }, [videoTitle]);

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'notes',       label: 'AI Notes',    icon: <Sparkles size={16} /> },
        { id: 'quiz',        label: 'Day Quiz',    icon: <Trophy size={16} /> },
        { id: 'resources',   label: 'Resources',   icon: <Files size={16} /> },
    ];

    // ── SYSTEM 3: Mark Complete ───────────────────────────────────────────────
    const handleComplete = async () => {
        if (isCompleted || completing) return;
        setCompleting(true);
        try {
            const res = await fetch(`${API_BASE}/api/complete_video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: getUserId(),
                    video_id: videoId,
                    day: videoDay
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsCompleted(true);
            }
        } catch (error) {
            console.error('Failed to mark video complete:', error);
        } finally {
            setCompleting(false);
        }
    };

    return (
        <div className="learning-console">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <header className="console-header">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="back-btn"
                >
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </button>
                <div className="console-header-actions" />
            </header>

            <main className="console-main">
                {/* ── Left: Video Player ───────────────────────────────────── */}
                <section className="video-section">
                    <div className="video-container">
                        <iframe
                            src={toEmbedUrl(videoUrl)}
                            title={videoTitle}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>

                    {/* ── SYSTEM 3: Visible Mark-Complete Button ─────────── */}
                    <div className="video-minimal-actions">
                        <button
                            className={`mark-complete-btn ${isCompleted ? 'is-done' : ''}`}
                            onClick={handleComplete}
                            disabled={isCompleted || completing}
                            title={isCompleted ? 'Lesson Completed' : 'Mark as Completed'}
                        >
                            {completing ? (
                                <><Loader2 size={15} className="spin" /> Saving...</>
                            ) : isCompleted ? (
                                <><CheckCircle2 size={15} /> Completed ✓</>
                            ) : (
                                <><Play size={15} fill="currentColor" /> Mark Complete</>
                            )}
                        </button>
                    </div>
                </section>

                {/* ── Right: Learning Tools ─────────────────────────────────── */}
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
                        {/* ── AI Notes ─────────────────────────────────────── */}
                        {activeTab === 'notes' && (
                            <div className="notes-pane">
                                {loading ? (
                                    <div className="console-loader">
                                        <Loader2 size={32} className="spin text-indigo-600" />
                                        <p>Synthesising high-fidelity notes...</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="md-content"
                                    >
                                        {aiNotes ? (
                                            <div className="prose prose-invert max-w-none">
                                                <ReactMarkdown>{aiNotes}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <div className="p-4 bg-orange-50 rounded-full mb-4 animate-pulse">
                                                    <Sparkles className="w-8 h-8 text-orange-500" />
                                                </div>
                                                <h3>Generating AI Notes…</h3>
                                                <p>Our AI mentor is summarizing this video. It will appear here shortly.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* ── Quiz ─────────────────────────────────────────── */}
                        {activeTab === 'quiz' && (
                            <div className="quiz-pane">
                                {quizQuestions.length === 0 ? (
                                    <div className="empty-quiz">
                                        <Trophy size={48} className="opacity-20 mb-4" />
                                        <p>No quiz for this lesson yet.</p>
                                    </div>
                                ) : quizDone ? (
                                    <div className="quiz-result-card">
                                        <div className="flex flex-col items-center py-8">
                                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                                <Trophy size={40} className="text-indigo-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete! 🎉</h2>
                                            <div className="bg-gray-50 border border-gray-100 px-6 py-3 rounded-2xl mb-6">
                                                <span className="text-gray-600 font-medium">Score: </span>
                                                <span className="text-2xl font-black text-indigo-600">
                                                    {quizScore} / {quizQuestions.length}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    color: quizScore >= quizQuestions.length * 0.7 ? '#10b981' : '#ef4444',
                                                    fontWeight: 600
                                                }}
                                                className="mb-8"
                                            >
                                                {quizScore >= quizQuestions.length * 0.7
                                                    ? '✓ Passed! You are on fire! 🔥'
                                                    : 'Try again to improve your score'}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setQuizIndex(0); setQuizScore(0); setQuizDone(false);
                                                    setQuizAnswer(null); setQuizSubmitted(false);
                                                }}
                                                className="retake-btn px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold"
                                            >
                                                Retake Quiz
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="quiz-question-card">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                Question {quizIndex + 1} of {quizQuestions.length}
                                            </span>
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                                                Score: {quizScore}
                                            </div>
                                        </div>

                                        <p className="text-lg font-bold text-gray-800 leading-relaxed mb-8">
                                            {quizQuestions[quizIndex]?.q}
                                        </p>

                                        <div className="options-grid grid grid-cols-1 gap-3 mb-8">
                                            {quizQuestions[quizIndex]?.options.map((opt, i) => {
                                                const isCorrect  = opt === quizQuestions[quizIndex].answer;
                                                const isSelected = opt === quizAnswer;
                                                let bg = '#ffffff', border = '#e5e7eb', color = '#374151';
                                                if (quizSubmitted) {
                                                    if (isCorrect) { bg = '#d1fae5'; border = '#10b981'; color = '#065f46'; }
                                                    else if (isSelected) { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; }
                                                } else if (isSelected) {
                                                    bg = '#eef2ff'; border = '#6366f1'; color = '#4338ca';
                                                }
                                                return (
                                                    <button
                                                        key={i}
                                                        disabled={quizSubmitted}
                                                        onClick={() => setQuizAnswer(opt)}
                                                        style={{
                                                            padding: '16px 20px', borderRadius: 14,
                                                            border: `1.5px solid ${border}`,
                                                            background: bg, color,
                                                            textAlign: 'left',
                                                            cursor: quizSubmitted ? 'default' : 'pointer',
                                                            fontSize: 14, fontWeight: isSelected ? 600 : 400,
                                                            transition: 'all 0.2s',
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
                                                    if (quizAnswer === quizQuestions[quizIndex].answer)
                                                        setQuizScore(s => s + 1);
                                                }}
                                                className={`submit-ans-btn w-full py-4 rounded-2xl font-bold transition-all shadow-md 
                                                    ${quizAnswer ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                Submit Answer
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (quizIndex + 1 >= quizQuestions.length) {
                                                        setQuizDone(true);
                                                        const finalScore = quizScore + (quizAnswer === quizQuestions[quizIndex].answer ? 1 : 0);
                                                        fetch(`${API_BASE}/api/complete_quiz`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                user_id: getUserId(),
                                                                day: videoDay,
                                                                score: finalScore
                                                            })
                                                        }).catch(console.error);
                                                    } else {
                                                        setQuizIndex(i => i + 1);
                                                        setQuizAnswer(null);
                                                        setQuizSubmitted(false);
                                                    }
                                                }}
                                                className="next-q-btn w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold transition-all"
                                            >
                                                {quizIndex + 1 >= quizQuestions.length ? 'Finish Quiz 🏆' : 'Next Question →'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Practice ──────────────────────────────────────── */}
                        {activeTab === 'practice' && (
                            <div className="practice-pane">
                                <div className="warning-card">
                                    <h3>💻 Desktop Required</h3>
                                    <p>The Interactive Code Playground requires a keyboard and professional IDE. Please switch to a laptop or PC to practice coding tasks.</p>
                                </div>
                            </div>
                        )}

                        {/* ── Resources ─────────────────────────────────────── */}
                        {activeTab === 'resources' && (
                            <div className="resources-pane">
                                <h3 className="text-xl font-bold mb-2">Lesson Assets</h3>
                                <p className="text-gray-500 mb-6 text-sm">Access source code, templates, and cheatsheets.</p>
                                <div className="resource-list space-y-3">
                                    {currentResource ? (
                                        <a
                                            href={currentResource}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="resource-card block p-4 bg-gray-50 border border-gray-100 rounded-xl
                                                       hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Code size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-600">Source Code & Resources</h4>
                                                    <p className="text-xs text-gray-500">View on GitHub • Official Course Material</p>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600" />
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="empty-resource">
                                            <Files size={40} className="mb-2 opacity-40" />
                                            <span className="text-sm font-medium text-gray-400">No assets for this specific video.</span>
                                        </div>
                                    )}
                                    <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <div className="flex gap-3">
                                            <Sparkles size={18} className="text-indigo-600 flex-shrink-0" />
                                            <div>
                                                <h5 className="text-sm font-bold text-indigo-900">Mentor Tip</h5>
                                                <p className="text-xs text-indigo-700 leading-relaxed mt-1">
                                                    Check the GitHub link for "Exercise" folders. Implementing these is the fastest way to master this topic.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Discussions ───────────────────────────────────── */}
                        {activeTab === 'discussions' && (
                            <div className="discussions-pane">
                                <div className="coming-soon">
                                    <MessageSquare size={32} className="opacity-20 mb-2" />
                                    <h3>Student Lounge</h3>
                                    <p>Coming Soon in Phase 2. Connect with thousands of students learning this concept.</p>
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
