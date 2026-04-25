from flask import Blueprint, request, jsonify
import json
from utils.storage_logic import get_user
from utils.task_logic import get_day_data, _get_completed_videos, _get_completed_days
from utils.ai_helper import generate_mentor_response
from utils.mentor_logic import is_query_relevant

mentor_bp = Blueprint("mentor", __name__)

@mentor_bp.route("/ai_mentor", methods=["POST"])
@mentor_bp.route("/ai_mentor_chat", methods=["POST"])
def ai_mentor_v2():
    """
    Enhanced AI Chat Mentor Route (v2.0)
    Implements: Human-like interaction, Progress Analysis, Preemptive Doubts, and Time Management.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    message = data.get("message", "").strip()
    history = data.get("history", [])
    user_id = data.get("user_id", "").strip()

    if not message:
        return jsonify({"error": "'message' field is required"}), 400
    if not user_id:
        return jsonify({"error": "'user_id' field is required"}), 400

    # 1. Human-like Sensitivity & Relevance Filter
    if not is_query_relevant(message):
         return jsonify({
            "success": True, 
            "response": "👋 Hey! I noticed that might be a bit off-topic. I'm here to make sure you reach your career goals as a professional. Let's get back to your learning journey—how can I help you with your current tasks?"
         })

    try:
        # 2. Deep Context Gathering (Requirement 2: Progress Tracking)
        user = get_user(user_id)
        current_day = user["journey"].get("day", 1)
        
        # Get active curriculum context
        day_data = get_day_data(current_day, user)
        topic = day_data.get("title", "Foundations")
        
        vids_done = _get_completed_videos(user)
        days_done = _get_completed_days(user)
        streak = user["progress"].get("streak", 0)
        
        # Build structured context for the AI
        deep_context = {
            "identity": user.get("profile", {}),
            "career_goal": user.get("career", {}).get("selected", "Technology"),
            "current_status": {
                "day": current_day,
                "topic": topic,
                "streak": streak,
                "total_videos_finished": len(vids_done),
                "total_milestones_reached": len(days_done),
                "last_active": user["progress"].get("last_active_date")
            },
            "curriculum_peek": {
                "tasks": day_data.get("tasks", []),
                "assignment_focus": day_data.get("assignment", {}).get("description", "")
            }
        }

        # 3. Generate Structured, Human-like Mentor Response (ai_helper handles prompts)
        response_text = generate_mentor_response(
            message, 
            history, 
            {"system": json.dumps(deep_context, indent=2)}
        )
        
        return jsonify({
            "success": True,
            "response": response_text
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": True,
            "response": "👋 I'm currently reflecting on your progress and having a small technical hiccup. Feel free to continue with your current lesson, and I'll be back to guide you in a moment!"
        }), 200
