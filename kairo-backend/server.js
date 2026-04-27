const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kairo';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema
const conversationSchema = new mongoose.Schema({
  userId: String,
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

const Conversation = mongoose.model('Conversation', conversationSchema);

// OpenRouter Config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'openai/gpt-3.5-turbo'; // Fast + Conversational

// ElevenLabs Config
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (Default)

// API Routes

// 1. Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { text, userId = 'default_user' } = req.body;

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    // Fetch History (Last 5 messages)
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      conversation = new Conversation({ userId, messages: [] });
    }

    const history = conversation.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Call OpenRouter
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You are KAIRO, a friendly and professional AI voice assistant. Keep responses concise and natural for speech.' },
        ...history,
        { role: 'user', content: text }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;

    // Save to DB
    conversation.messages.push({ role: 'user', content: text });
    conversation.messages.push({ role: 'assistant', content: aiResponse });
    await conversation.save();

    res.json({ text: aiResponse });
  } catch (error) {
    console.error('Chat Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// 2. TTS Endpoint (Proxy)
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (error) {
    console.error('TTS Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

app.listen(PORT, () => {
  console.log(`KAIRO Backend running on http://localhost:${PORT}`);
});
