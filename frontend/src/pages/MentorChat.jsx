import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Mic, MicOff, Menu, Plus, Search, MessageSquare, X, Trash2, Edit2, Check } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { useAppContext } from '../context/AppContext';
import './MentorChat.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const initialMessages = [];

const suggestionCards = [
  "Best colleges for CS?",
  "Management fees?",
  "How to build skills?",
  "Career roadmap for IT?",
];

const processBold = (text) => {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('---')) return <hr key={i} className="my-4 border-gray-100" />;
    
    if (trimmedLine.startsWith('##')) {
      return <h2 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-2">{processBold(trimmedLine.replace('##', '').trim())}</h2>;
    }
    
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const content = trimmedLine.substring(2).trim();
      return (
        <div key={i} className="flex gap-2 mb-1 items-start">
          <span className="text-amber-500 mt-1.5 shrink-0" style={{ fontSize: '8px' }}>●</span>
          <span className="text-gray-700">{processBold(content)}</span>
        </div>
      );
    }
    
    if (trimmedLine === '') return <div key={i} className="h-2" />;
    return <p key={i} className="text-gray-700 leading-relaxed mb-2">{processBold(line)}</p>;
  });
};

const MentorChat = () => {
  const { userProfile } = useAppContext();
  const userId = (userProfile?.name || 'Student').toLowerCase().replace(/\s+/g, '_') || 'demo_user';

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentChatId, setCurrentChatId] = useState(Date.now());
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ── History Management ──
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/get_chat_history/${userId}`);
      const data = await res.json();
      if (data.success) setChatHistory(data.history);
    } catch (err) { console.error("History fetch error:", err); }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const saveCurrentChat = async (msgs, title = chatTitle) => {
    try {
      await fetch(`${API_BASE}/api/save_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          chat_id: currentChatId,
          title: title,
          messages: msgs,
          timestamp: new Date().toISOString()
        })
      });
      fetchHistory();
    } catch (err) { console.error("Save chat error:", err); }
  };

  const startNewChat = () => {
    setMessages(initialMessages);
    setCurrentChatId(Date.now());
    setChatTitle('New Chat');
    setSidebarOpen(false);
  };

  const loadChat = (chat) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
    setChatTitle(chat.title);
    setSidebarOpen(false);
  };

  const filteredHistory = useMemo(() => {
    return chatHistory.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chatHistory, searchQuery]);

  const deleteChat = async (id) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/delete_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, chat_id: id })
      });
      if (res.ok) {
        fetchHistory();
        if (id === currentChatId) startNewChat();
      }
    } catch (err) { console.error("Delete error:", err); }
  };

  const saveNewTitle = async (id) => {
    if (!editingTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/edit_chat_title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, chat_id: id, title: editingTitle })
      });
      if (res.ok) {
        setEditingChatId(null);
        fetchHistory();
        if (id === currentChatId) setChatTitle(editingTitle);
      }
    } catch (err) { console.error("Edit title error:", err); }
  };

  // ── Speech Recognition ──
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessage(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    const userMsg = { id: Date.now(), role: 'user', text: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Auto-naming on first user message
    let updatedTitle = chatTitle;
    if (messages.length === 0) {
      try {
        const titleRes = await fetch(`${API_BASE}/api/generate_chat_title`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msgText })
        });
        const titleData = await titleRes.json();
        if (titleData.success) {
          updatedTitle = titleData.title;
          setChatTitle(updatedTitle);
        }
      } catch (err) { console.error("Title gen error:", err); }
    }

    try {
      const response = await fetch(`${API_BASE}/api/ai_mentor_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: msgText,
          history: messages.map(m => ({ role: m.role, text: m.text }))
        })
      });

      const data = await response.json();
      const aiMsg = {
        id: Date.now() + 1,
        role: 'mentor',
        text: data.success ? data.response : (data.error || "Focus on your goals!")
      };
      
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      saveCurrentChat(finalMessages, updatedTitle);
    } catch (err) {
      console.error("Mentor chat error:", err);
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
      <TopBar 
        title="AI Mentor" 
        showBack 
        leftAction={
          <button className="mentor-chat__hamburger" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
        }
      />

      {/* ── Slide-Over Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              className="mentor-chat__sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div 
              className="mentor-chat__sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="mentor-chat__sidebar-header">
                <button className="mentor-chat__new-chat" onClick={startNewChat}>
                  <Plus size={18} /> New Chat
                </button>
                <button className="mentor-chat__close-sidebar" onClick={() => setSidebarOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="mentor-chat__search-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search history..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="mentor-chat__history-list">
                <p className="history-label">Previous Chats</p>
                {filteredHistory.map(chat => (
                  <div key={chat.id} className="history-item-container group">
                    {editingChatId === chat.id ? (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl w-full">
                        <input 
                          autoFocus
                          className="bg-transparent border-none outline-none text-sm flex-1"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveNewTitle(chat.id)}
                        />
                        <button onClick={() => saveNewTitle(chat.id)} className="text-green-600">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingChatId(null)} className="text-gray-400">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className={`history-item ${chat.id === currentChatId ? 'active' : ''}`}
                        onClick={() => loadChat(chat)}
                      >
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <MessageSquare size={16} className="shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </div>
                        <div className="history-actions flex items-center gap-1 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat.id);
                              setEditingTitle(chat.title);
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="mentor-chat__messages max-w-4xl mx-auto flex-1 w-full" style={{ paddingBottom: 120 }}>
        {messages.length === 0 && (
          <div className="mentor-chat__empty-state">
            {/* AI Avatar Section */}
            <div className="mentor-chat__avatar-section">
              <div className="mentor-chat__avatar">
                <div className="mentor-chat__avatar-ring">
                  <div className="mentor-chat__avatar-inner" style={{ overflow: 'hidden' }}>
                    <img src="/kairo_avatar.png" alt="Kairo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
                <div className="mentor-chat__avatar-pulse" />
              </div>
              <p className="mentor-chat__avatar-label">Kairo AI</p>
              <h2 className="empty-title">How can I help you today?</h2>
            </div>

            <div className="mentor-chat__suggestions">
              {suggestionCards.map((suggestion) => (
                <button 
                  key={suggestion} 
                  className="suggestion-card"
                  onClick={() => sendMessage(suggestion)}
                >
                  <Sparkles size={16} className="text-amber-500" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`mentor-chat__bubble mentor-chat__bubble--${msg.role}`}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {/* Simple manual markdown-like rendering for overhaul requirements */}
                <div className="bubble-content">
                  {renderMarkdown(msg.text)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isTyping && (
          <div className="mentor-chat__bubble mentor-chat__bubble--mentor">
            <div className="mentor-chat__typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="mentor-chat__input-bar">
        <div className="max-w-4xl mx-auto flex items-center w-full gap-2 px-2">
          <input
            className="mentor-chat__input"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className={`mentor-chat__mic ${isListening ? 'mentor-chat__mic--active' : ''}`}
            onClick={toggleListening}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
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
