import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAppContext } from '../context/AppContext';
import './MentorChat.css';

const initialMessages = [
  {
    id: 1,
    role: 'mentor',
    text: "Hello! I'm Kairo, your AI Career Mentor. 🎓 I'm here to help you navigate your career journey. What's on your mind today?",
  },
];

const quickReplies = [
  "Which branch suits me?",
  "GATE vs Job?",
  "Best colleges for CS?",
  "How to build skills?",
];

const MentorChat = () => {
  const { userProfile } = useAppContext();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    // Build the request early
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const userId = (userProfile?.name || 'Student').toLowerCase().replace(/\s+/g, '_') || 'demo_user';

    const userMsg = { id: Date.now(), role: 'user', text: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai_mentor_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: msgText,
          history: history
        })
      });

      const data = await response.json();
      
      const aiMsg = {
        id: Date.now() + 1,
        role: 'mentor',
        text: data.success ? data.response : (data.error || "Something went wrong locally.")
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Mentor chat error:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'mentor',
        text: "Focus on completing today's tasks. You're progressing well."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mentor-chat lg:pl-64 min-h-screen bg-[#F8F8F8]">
      <TopBar title="AI Mentor" showBack />

      <div className="mentor-chat__messages max-w-4xl mx-auto flex-1 w-full" style={{paddingBottom: 80}}>
        {/* AI Avatar Section */}
        <div className="mentor-chat__avatar-section">
          <div className="mentor-chat__avatar">
            <div className="mentor-chat__avatar-ring">
              <div className="mentor-chat__avatar-inner">
                <Sparkles size={28} color="#C8A951" strokeWidth={1.5} />
              </div>
            </div>
            <div className="mentor-chat__avatar-pulse" />
          </div>
          <p className="mentor-chat__avatar-label">Kairo AI</p>
        </div>

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`mentor-chat__bubble mentor-chat__bubble--${msg.role}`}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            className="mentor-chat__bubble mentor-chat__bubble--mentor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mentor-chat__typing">
              <span /><span /><span />
            </div>
          </motion.div>
        )}

        {/* Quick Replies */}
        {messages.length <= 1 && !isTyping && (
          <motion.div
            className="mentor-chat__quick-replies"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {quickReplies.map((reply) => (
              <button
                key={reply}
                className="mentor-chat__quick-btn"
                onClick={() => sendMessage(reply)}
              >
                {reply}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="mentor-chat__input-bar lg:pl-64">
        <div className="max-w-4xl mx-auto flex items-center w-full gap-2 px-2">
          <input
            className="mentor-chat__input"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className={`mentor-chat__send ${input.trim() ? 'mentor-chat__send--active' : ''}`}
            onClick={() => sendMessage()}
          >
            <Send size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MentorChat;
