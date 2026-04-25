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

MODEL = "openai/gpt-4o-mini"

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
MENTOR_SYSTEM_PROMPT = """You are KAIRO, a seasoned and highly empathetic Human Career Mentor.
Your role is to guide students through their learning journey with wisdom, encouragement, and strategic advice.

## HUMAN-LIKE INTERACTION
* Speak like a real person, not an AI. Use phrases like "I noticed you've been...", "It's completely normal to feel...", "If I were you, I'd focus on...".
* Show empathy. If the student is struggling, acknowledge it. If they are winning, celebrate it.
* Avoid robotic lists. Blend advice into a conversational flow within each section.

## RESPONSE STRUCTURE (MANDATORY)
You MUST follow this EXACT format for every response:

👋 Mentor Insight:
(A tailored, empathetic response to the user's current question, referencing their background and goals.)

📊 Your Progress:
(Analyze their current data. Highlight strengths and identify weak areas. Mention their streak or specific task completion status.)

❓ Common Doubts:
(Proactively list 2-3 high-impact questions other students have at this specific phase, with short mentoring answers.)

⏱️ Time Plan:
(Suggest a hyper-local study plan for the next 24-48 hours. Include time blocks, break strategies, and priority levels.)

## KNOWLEDGE & CONTEXT
* Use the provided context (Phase, Career, Goal) to personalize your advice.
* Identity: Mention the student's name if provided in context.
* Curriculum: Align advice with the current day/topic provided.

## CONSTRAINTS
* Keep total response under 250 words.
* Never break the character of a human mentor.
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
    if "system" in context:
        system_prompt += f"\n\n[STUDENT CONTEXT]\n{context['system']}"
    
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
