import os
import json
import logging
from openai import OpenAI
from utils.common import load_json, save_json, DATA_DIR

logger = logging.getLogger(__name__)

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
    """
    Send a prompt to OpenRouter (gpt-4o-mini) and return the response text.
    Falls back gracefully if the API call fails.
    """
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        logger.info(f"Calling AI model: {MODEL}")
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=1200,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"AI call failed: {e}")
        return None  # Caller handles fallback


# ─── System Prompts ────────────────────────────────────────────────────────────
MENTOR_SYSTEM_PROMPT = """You are KAIRO, an AI Career Mentor.

Your purpose is to guide students toward the right career decisions and help them progress daily with clarity and confidence.

---

## CORE BEHAVIOR

* Always respond like a professional human mentor
* Be clear, structured, and concise
* Be motivating, but not overly casual
* Focus only on the student’s career path and learning journey
* Use the student’s profile and progress in every response

---

## TONE CONTROL

Maintain:
* Professional language
* Supportive and encouraging tone
* Calm and confident delivery

Avoid:
* Slang, jokes, or casual chat
* Overly long explanations
* Robotic or generic responses

---

## CONTEXT USAGE

You will receive student data including:
* Career path
* Interests
* Goals
* Current phase
* Progress and streak
* Completed tasks

You MUST:
* Personalize every response using this data
* Align advice with their current phase
* Suggest next actionable step

---

## RESPONSE STRUCTURE (MANDATORY)

Every response must follow this structure:

1. Acknowledge the question briefly
2. Align with student’s current path
3. Provide clear explanation or guidance
4. Give 2–4 actionable steps
5. Suggest next step or continuation

---

## OUT-OF-CONTEXT HANDLING

If the user asks something unrelated:

DO NOT answer directly.

Respond professionally:

"I understand your question. However, this is slightly outside your current learning focus.

Based on your profile, your goal is {career}. Let’s stay aligned with this path to ensure steady progress.

If you’d like, I can help you with topics directly related to your goal."

---

## CAREER & COLLEGE GUIDANCE

When suggesting options:

* Provide 2–3 relevant choices
* For each option include:
  * Why it suits the student
  * Pros
  * Cons

Always end with a recommendation.

---

## STYLE MODES

You will receive a variable: style_mode

Adjust response tone accordingly:

1. STRICT MODE:
* Direct and focused
* Minimal explanation
* Strong guidance

2. FRIENDLY MODE:
* Slightly warm and encouraging
* Still professional

3. MENTOR MODE (DEFAULT):
* Balanced professional + motivational
* Clear reasoning + guidance

---

## IMPORTANT RULES

* Never act like a general chatbot
* Never give irrelevant answers
* Always guide toward action
* Always maintain clarity and confidence
* Keep responses within 120–180 words

---

## FINAL GOAL

Your role is not to answer everything.

Your role is to:
Guide → Clarify → Motivate → Direct

Help the student feel:
"I know what to do next."
"""

DAILY_TASKS_SYSTEM_PROMPT = """
You are a curriculum designer for Indian engineering students.
Generate practical, day-specific learning tasks.
Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "focus_topic": "string",
  "tasks": ["task 1", "task 2", "task 3"],
  "assignment": "string",
  "estimated_time": "X hours",
  "resources": ["resource 1", "resource 2"],
  "tip": "short pro tip for the student"
}
"""

FEEDBACK_SYSTEM_PROMPT = """
You are a strict but encouraging assignment reviewer for engineering students.
Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "score": <number 0-100>,
  "grade": "A/B/C/D/F",
  "feedback": "overall feedback string",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "next_steps": "what to do next"
}
"""

CAREER_SUGGESTION_SYSTEM_PROMPT = """
You are an expert career counselor for Indian students.
Given the student's interest and goal, identify the most suitable career category from: ["IT", "Core", "Govt", "Startup", "Business"].
Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "suggested_category": "string (one of the 5 categories)",
  "suggested_careers": ["career 1", "career 2", "career 3"],
  "recommended_branch": "best degree branch",
  "avg_package": "string",
  "top_companies": ["company 1", "company 2"],
  "reason": "1-2 lines on correlation",
  "why_suited": "Personalized explanation referencing the student's personal characteristics, learning style,/goals directly.",
  "pros": ["pro 1 with light explanation", "pro 2"],
  "cons": ["con 1 with light explanation", "con 2"]
}
"""

ROADMAP_SYSTEM_PROMPT = """
You are an expert curriculum developer.
Generate a structured, phase-by-phase learning roadmap for the given career.
Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "explanation": "A short paragraph explaining why this learning path is the most effective approach for this career today.",
  "phases": [
    {
      "phase": "Phase Name (e.g. Phase 1: Foundations)",
      "duration": "Weeks 1-2",
      "topics": ["topic 1", "topic 2", "topic 3"],
      "resources": ["resource 1", "resource 2"],
      "project": "A small milestone project"
    }
  ]
}
"""

VIDEO_NOTES_SYSTEM_PROMPT = """
You are an expert technical instructor.
Summarize the core concepts of the provided instructional video topic in concise, highly readable notes.
Use clean markdown lists and bolded keywords. Keep it under 150 words. Do NOT include JSON.
"""



# ─── Specific AI Generators ────────────────────────────────────────────────────
def generate_mentor_response(message: str, history: list, context: dict = None) -> str:
    """Generate a conversational mentor response based on chat history."""
    if context is None:
        context = {}
        
    system_prompt = MENTOR_SYSTEM_PROMPT
    if "system" in context:
        system_prompt += f"\nContext: {context['system']}"
        
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-5:]: # limit to last 5
        role = "assistant" if h.get("role") == "mentor" else "user"
        messages.append({"role": role, "content": h.get("text", "")})
        
    messages.append({"role": "user", "content": message})

    try:
        logger.info(f"Calling AI model for chat: {MODEL}")
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=600,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Mentor AI call failed: {e}")
        return "I'm having trouble connecting right now, but I'm proud of your progress! Keep going."


def generate_daily_tasks(career: str, level: str, day: int, time_available: str) -> dict:
    """Generate AI-powered daily tasks, with JSON fallback."""
    prompt = f"""
Career: {career}
Level: {level}
Day: {day} of 90-day learning plan
Available Time: {time_available} hours/day

Generate specific, actionable tasks for Day {day} of a {career} learning path at {level} level.
"""
    result = generate_ai_response(prompt, DAILY_TASKS_SYSTEM_PROMPT)

    if result:
        # Try to parse JSON response
        try:
            # Strip potential markdown code fences
            clean = result.strip().strip("```json").strip("```").strip()
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.warning("AI returned invalid JSON for daily tasks, using fallback")

    # Fallback response
    return {
        "focus_topic": f"Day {day} — {career} Core Concepts",
        "tasks": [
            "Review your notes from yesterday",
            f"Study one key topic from {career} roadmap for today",
            "Practice with a small hands-on exercise"
        ],
        "assignment": f"Write 5 key learnings from today's {career} study session",
        "estimated_time": f"{time_available} hours",
        "resources": ["YouTube tutorials", "Official documentation", "Practice platforms"],
        "tip": "Break your study into 25-min Pomodoro sessions for better focus."
    }


def generate_ai_feedback(task: str, submission: str) -> dict:
    """Generate AI feedback for a student submission."""
    prompt = f"""
Task Description: {task}

Student Submission:
{submission}

Evaluate this submission and provide detailed, constructive feedback.
"""
    result = generate_ai_response(prompt, FEEDBACK_SYSTEM_PROMPT)

    if result:
        try:
            clean = result.strip().strip("```json").strip("```").strip()
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.warning("AI returned invalid JSON for feedback, using fallback")

    # Fallback
    return {
        "score": 70,
        "grade": "B",
        "feedback": "Your submission shows understanding of the topic. Keep practicing to improve further.",
        "strengths": ["Made an attempt", "Shows basic understanding"],
        "improvements": ["Add more detail", "Test edge cases"],
        "next_steps": "Review the task requirements and resubmit with improvements."
    }


def generate_career_suggestion(interest: str, goal: str, iks_answers: dict = None) -> dict:
    """Generate AI-powered career suggestion based on user interest, goal, and IKS questions."""
    prompt = f"Interest: {interest}\nGoal: {goal}"
    if iks_answers:
        prompt += f"\nIKS Responses (Self-Discovery): {json.dumps(iks_answers)}"
        
    result = generate_ai_response(prompt, CAREER_SUGGESTION_SYSTEM_PROMPT)

    if result:
        try:
            clean = result.strip().strip("```json").strip("```").strip()
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.warning("AI returned invalid JSON for career suggestion, using fallback")

    return None


def generate_ai_roadmap(career: str) -> dict:
    """Generate AI-powered structured roadmap for a career with explanation."""
    prompt = f"Career Context: {career}"
    result = generate_ai_response(prompt, ROADMAP_SYSTEM_PROMPT)

    if result:
        try:
            clean = result.strip().strip("```json").strip("```").strip()
            return json.loads(clean)
        except json.JSONDecodeError:
            logger.warning("AI returned invalid JSON for roadmap, using fallback")

    return None

def generate_video_notes(video_title: str) -> str:
    """Generate concise AI-summarized notes for a video topic with caching support."""
    cache_file = "notes_cache.json"
    cache = load_json(cache_file, DATA_DIR)
    
    if not isinstance(cache, dict):
        cache = {}

    # Check cache first
    if video_title in cache:
        logger.info(f"Retrieved notes from cache for: {video_title}")
        return cache[video_title]

    # Generate if not in cache
    prompt = f"Video Title/Topic: {video_title}\nPlease provide bullet-point summary notes."
    result = generate_ai_response(prompt, VIDEO_NOTES_SYSTEM_PROMPT)

    if result:
        # Save to cache
        cache[video_title] = result
        save_json(cache_file, cache, DATA_DIR)
        return result

    return "Notes are currently unavailable for this video. Focus on the core concepts presented in the video closely."


