import os
import json
import logging
import time
import sys
from openai import OpenAI
from dotenv import load_dotenv
from utils.common import load_json, save_json, DATA_DIR

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Add parent directory to path to allow importing from utils if run as script
sys.path.append(os.getcwd())

# ─── OpenRouter Client ─────────────────────────────────────────────────────────
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
    default_headers={
        "HTTP-Referer": "https://ai-mentor-app.com",
        "X-Title": "AI Career Mentor"
    }
)

MODEL = "google/gemini-2.0-flash-001"

# ─── Core AI Function ──────────────────────────────────────────────────────────
def generate_ai_response(prompt: str, system_prompt: str = None) -> str:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=1200,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"AI call failed: {e}")
        return None

# ─── System Prompts ────────────────────────────────────────────────────────────
MENTOR_SYSTEM_PROMPT = """You are KAIRO, an adaptive AI Career Mentor. You act as a natural conversation partner while strictly adhering to professional boundaries.

## 1. ADAPTIVE RESPONSE LOGIC (CRITICAL)
- **Short Greetings**: If the user provides a short greeting (e.g., "Hi", "Hello", "Hey"), reply with a brief, friendly greeting that includes their name.
  - Example: "Hi [User Name]! Ready to jump back into your career journey?"
- **Structured Guidance**: Trigger the structured layout ONLY when the user asks a career/study question, requests a progress update, or discusses a specific task/roadblock.

## 2. CONTEXT GUARDRAILS
- **Out-of-Context Questions**: If the user asks about topics unrelated to their career path (e.g., entertainment, food, unrelated hobbies, politics), reply formally: 
  "I’m focused on being your career mentor. Let's get back to your [Career Path] goals so we can keep your momentum going!"
  *(Replace [Career Path] with the user's actual career path from context)*.

## 3. STRICT RESPONSE FORMATTING (MANDATORY)
- **NO FILLER**: You are FORBIDDEN from writing long paragraphs or conversational "filler" at the beginning of responses.
- **START WITH HEADER**: Every structured response must start immediately with a Markdown Header (##).
- **POINT-WISE DELIVERY**: Use bullet points for every single piece of advice.
- **VISUAL SEPARATION**: Use horizontal rules (---) between sections.

## 4. STRUCTURED LAYOUT (For Career Queries Only)
Every response must follow this exact order and structure:

## 👋 Mentor Insight
(Empathetic guidance. Max 1-2 sentences. Use bullet points if providing tips.)

---
## 📊 Your Progress
(Short analysis of tasks/goals based on context. Max 2 sentences.)

---
## ❓ Common Doubts
(Proactive FAQs for the current topic. 2-3 bullet points.)

---
## ⏱️ Time Plan
(Daily/weekly actionable steps. 2-3 bullet points.)

## 5. FORMATTING RULES
- **PERSONALIZATION**: Always address the user by their first name (found in the "identity" context) at the beginning of the "Mentor Insight" section.
- Maintain a professional, encouraging, and human-like tone.
- Keep each section extremely concise.
"""

VIDEO_NOTES_SYSTEM_PROMPT = """You are an expert technical instructor. Summarize the core concepts of the provided instructional video topic in concise, highly readable notes. Use clean markdown lists and bolded keywords. Keep it under 150 words. Do NOT include JSON."""
DAILY_TASKS_SYSTEM_PROMPT = """You are a curriculum designer for Indian engineering students. Generate practical, day-specific learning tasks. Return ONLY valid JSON: {"focus_topic": "string", "tasks": [], "assignment": "string", "estimated_time": "X hours", "resources": [], "tip": "string"}"""
FEEDBACK_SYSTEM_PROMPT = """Reviewer for engineering students. Return ONLY valid JSON: {"score": 0, "grade": "X", "feedback": "X", "strengths": [], "improvements": [], "next_steps": "X"}"""
CAREER_SUGGESTION_SYSTEM_PROMPT = """Expert career counselor. Return ONLY valid JSON: {"suggested_category": "X", "suggested_careers": [], "recommended_branch": "X", "avg_package": "X", "top_companies": [], "reason": "X", "why_suited": "X", "pros": [], "cons": []}"""
ROADMAP_SYSTEM_PROMPT = """Expert curriculum developer. Return ONLY valid JSON: {"explanation": "X", "phases": [{"phase": "X", "duration": "X", "topics": [], "resources": [], "project": "X"}]}"""

# ─── Specific AI Generators ────────────────────────────────────────────────────
def generate_mentor_response(message: str, history: list, context: dict = None) -> str:
    if context is None: context = {}
    system_prompt = MENTOR_SYSTEM_PROMPT
    
    # Extract name for stronger personalization instruction
    user_name = "Student"
    if "system" in context:
        try:
            ctx_data = json.loads(context["system"])
            user_name = ctx_data.get("identity", {}).get("name", "Student")
            # Cleanup common name artifacts
            user_name = user_name.split('_')[0].capitalize()
        except: pass
        system_prompt += f"\n\n[USER NAME]: {user_name}\n[STUDENT CONTEXT]\n{context['system']}"
        system_prompt += f"\n\nIMPORTANT: You MUST start your reply by addressing {user_name} by name in the Mentor Insight section."
    
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-8:]:
        role = "assistant" if h.get("role") == "mentor" else "user"
        messages.append({"role": role, "content": h.get("text", "")})
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(model=MODEL, messages=messages, max_tokens=1000, temperature=0.7)
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Mentor AI call failed: {e}")
        return "👋 Mentor Insight: I'm currently reflecting on your progress and having a small technical hiccup. Feel free to continue with your current lesson, and I'll be back to guide you in a moment!"

def generate_daily_tasks(career: str, level: str, day: int, time_available: str) -> dict:
    prompt = f"Career: {career}\nDay: {day}\nTime: {time_available}"
    result = generate_ai_response(prompt, DAILY_TASKS_SYSTEM_PROMPT)
    if result:
        try:
            return json.loads(result.strip().strip("```json").strip("```").strip())
        except: pass
    return {"focus_topic": "General Study", "tasks": ["Study current topic"], "assignment": "Summary", "estimated_time": "2 hours", "resources": [], "tip": "Focus."}

def generate_ai_feedback(task: str, submission: str) -> dict:
    prompt = f"Task: {task}\nSubmission: {submission}"
    result = generate_ai_response(prompt, FEEDBACK_SYSTEM_PROMPT)
    if result:
        try:
            return json.loads(result.strip().strip("```json").strip("```").strip())
        except: pass
    return {"score": 80, "grade": "B", "feedback": "Good attempt.", "strengths": ["Completed task"], "improvements": [], "next_steps": "Continue."}

def generate_career_suggestion(interest: str, goal: str, iks_answers: dict = None) -> dict:
    prompt = f"Interest: {interest}\nGoal: {goal}"
    if iks_answers: prompt += f"\nIKS: {json.dumps(iks_answers)}"
    result = generate_ai_response(prompt, CAREER_SUGGESTION_SYSTEM_PROMPT)
    if result:
        try:
            return json.loads(result.strip().strip("```json").strip("```").strip())
        except: pass
    return None

def generate_ai_roadmap(career: str) -> dict:
    prompt = f"Career: {career}"
    result = generate_ai_response(prompt, ROADMAP_SYSTEM_PROMPT)
    if result:
        try:
            return json.loads(result.strip().strip("```json").strip("```").strip())
        except: pass
    return None

def generate_video_notes(video_title: str) -> str:
    cache_file = "notes_cache.json"
    cache = load_json(cache_file, DATA_DIR) or {}
    if video_title in cache: return cache[video_title]
    prompt = f"Topic: {video_title}"
    result = generate_ai_response(prompt, VIDEO_NOTES_SYSTEM_PROMPT)
    if result:
        cache[video_title] = result
        save_json(cache_file, cache, DATA_DIR)
        return result
    return "Notes unavailable."

def generate_chat_title(message: str) -> str:
    """Generate a 3-5 word title for the chat session."""
    prompt = f"Generate a short, descriptive 3-5 word title for a chat that starts with: '{message}'. Return ONLY the title, no quotes or punctuation."
    title = generate_ai_response(prompt, "You are a helpful assistant that generates concise titles.")
    return title or "New Career Chat"
