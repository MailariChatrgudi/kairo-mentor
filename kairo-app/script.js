// KAIRO Frontend Logic
const statusEl = document.getElementById('status');
const chatDisplay = document.getElementById('chat-display');
const micBtn = document.getElementById('mic-btn');
const avatarContainer = document.getElementById('avatar-container');

const BACKEND_URL = 'http://localhost:5000/api';

let isListening = false;
let recognition;
let synth;

// 1. Initialize Web Speech API
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
        setAppState('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserSpeech(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        setAppState('idle');
        addChatMessage('AI', 'Sorry, I couldn\'t hear that clearly.');
    };

    recognition.onend = () => {
        if (isListening) {
            setAppState('thinking');
        }
    };
} else {
    alert('Speech recognition not supported in this browser.');
}

// 2. State Management
function setAppState(state) {
    avatarContainer.className = 'avatar-container state-' + state;
    switch(state) {
        case 'idle':
            statusEl.innerText = 'System Idle';
            statusEl.style.color = '#94a3b8';
            isListening = false;
            break;
        case 'listening':
            statusEl.innerText = 'Listening...';
            statusEl.style.color = '#0ea5e9';
            isListening = true;
            break;
        case 'thinking':
            statusEl.innerText = 'Thinking...';
            statusEl.style.color = '#818cf8';
            break;
        case 'speaking':
            statusEl.innerText = 'Speaking...';
            statusEl.style.color = '#4f46e5';
            break;
    }
}

// 3. User Speech Handling
async function handleUserSpeech(text) {
    if (!text) return;
    
    addChatMessage('User', text);
    setAppState('thinking');

    try {
        // Step 1: Get AI Response
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        const aiText = data.text;
        addChatMessage('AI', aiText);

        // Step 2: Get Audio (TTS)
        playSpeech(aiText);

    } catch (error) {
        console.error('Processing Error:', error);
        addChatMessage('AI', 'Something went wrong. Please try again.');
        setAppState('idle');
    }
}

// 4. TTS Playback
async function playSpeech(text) {
    setAppState('speaking');
    
    try {
        const response = await fetch(`${BACKEND_URL}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
            setAppState('idle');
        };

        audio.play();
    } catch (error) {
        console.error('TTS Error:', error);
        setAppState('idle');
    }
}

// 5. UI Helpers
function addChatMessage(role, text) {
    const p = document.createElement('p');
    p.className = role === 'User' ? 'user-msg' : 'ai-msg';
    p.innerText = text;
    
    // Clear display and add new message (keep it clean)
    chatDisplay.innerHTML = '';
    chatDisplay.appendChild(p);
}

// 6. Event Listeners
micBtn.addEventListener('click', () => {
    if (!isListening) {
        recognition.start();
    } else {
        recognition.stop();
    }
});

// Start in Idle
setAppState('idle');
