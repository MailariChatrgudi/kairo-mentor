import logging
import json
import re
from utils.storage_logic import get_user_data, get_progress
from utils.common import load_json, STORAGE_DIR

logger = logging.getLogger(__name__)

def is_query_relevant(message: str) -> bool:
    """Basic keyword heuristic filter to reject queries before hitting AI."""
    lower_msg = message.lower()
    
    # Invalid off-topic queries
    invalid_keywords = [
        "joke", "pm", "prime minister", "president", "movie", "song", "weather",
        "sports", "cricket", "football", "who is", "tell me a story",
        "recipe", "food", "hobby", "hobbies", "entertainment",
        "capital of", "buy", "sell", "random general knowledge"
    ]
    
    for kw in invalid_keywords:
        if re.search(r'\b' + kw + r'\b', lower_msg):
            return False
            
    return True

def build_student_context(user_id: str) -> dict:
    """Constructs the structured context from storage per PART 1."""
    user_data = get_user_data(user_id)
    profile = user_data.get("profile", {})
    
    progress = get_progress(user_id)
    
    roadmap_data = load_json(f"roadmap_{user_id}.json", STORAGE_DIR) or {} 
    
    context = {
        "name": profile.get("name", "Student"),
        "student_type": profile.get("student_type", ""),
        "interest": profile.get("interest", ""),
        "goal": profile.get("goal", ""),
        "financial_background": profile.get("financial_background", ""),
        "career": progress.get("career", profile.get("career", "Unknown")),
        "current_phase": progress.get("current_day", 1),
        "progress": progress.get("completion_percentage", 0),
        "streak": progress.get("streak", 0),
        "completed_tasks": progress.get("completed_tasks", []),
        "weak_areas": user_data.get("weak_areas", ["Needs more practice"]),
        "roadmap": list(roadmap_data.get("phases", []))[:3], # Truncate to limit overhead
        "style_mode": "MENTOR MODE (DEFAULT)"
    }
    return context

def chat_with_mentor(user_id: str, message: str, history: list) -> str:
    """Wrapper for AI mentor chat logic fulfilling PARTS 1-8."""
    from utils.ai_helper import generate_mentor_response
    
    # PART 4: CONTEXT FILTER
    if not is_query_relevant(message):
        context = build_student_context(user_id)
        career = context.get('career') or 'your chosen career'
        return f"I’m focused on being your career mentor. Let's get back to your {career} goals so we can keep your momentum going!"

    try:
        # PART 1: CONTEXT BUILDING
        context = build_student_context(user_id)
        
        # Adding prompt for IKS part 4: Explain why each task matters (if context relates to tasks)
        iks_system_note = "If advising on tasks or skills, explicitly explain *why* it matters and its real-world benefit to help build confidence."
        
        # PART 3: COMBINE SYSTEM PROMPT + CONTEXT + USER MESSAGE
        context_str = json.dumps(context) + f" | SYSTEM_NOTE: {iks_system_note}"
        
        # Call AI
        return generate_mentor_response(message, history, {"system": context_str, "career": context.get('career')})
    except Exception as e:
        logger.error(f"Mentor AI Failed: {e}")
        # PART 8: FALLBACK SYSTEM
        return "Focus on completing today's tasks. You're progressing well."
