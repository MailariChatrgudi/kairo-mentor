from flask import Blueprint, request, jsonify
import json
from utils.storage_logic import get_user
from utils.task_logic import get_day_data, _get_completed_videos, _get_completed_days
from utils.ai_helper import generate_mentor_response, generate_chat_title
from utils.mentor_logic import is_query_relevant
from utils.storage_logic import get_user, save_user

def _identify_weak_areas(user):
    """Analyze scores to identify specific learning gaps."""
    weak = []
    quizzes = user.get("quiz_progress", {})
    for topic, data in quizzes.items():
        score = data.get("score") if isinstance(data, dict) else data
        if isinstance(score, (int, float)) and score < 70:
            weak.append(f"{topic} (Quiz: {score}%)")
    
    assignments = user.get("assignment_progress", {})
    for task, data in assignments.items():
        score = data.get("score") if isinstance(data, dict) else data
        if isinstance(score, (int, float)) and score < 70:
            weak.append(f"{task} (Assignment: {score}%)")
    
    return weak if weak else ["None identified yet! Keep it up."]

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
    user = get_user(user_id)
    career = user.get("career", {}).get("selected", "Technology")
    current_day = user["journey"].get("day", 1)
    day_data = get_day_data(current_day, user)
    topic = day_data.get("title", "current tasks")

    if not is_query_relevant(message):
         return jsonify({
            "success": True, 
            "response": f"I’m focused on being your career mentor. Let's get back to your {career} goals so we can keep your momentum going!"
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
                "videos_finished": vids_done,
                "milestones_reached": days_done,
                "last_active": user["progress"].get("last_active_date"),
                "weak_areas": _identify_weak_areas(user),
                "task_completion": user.get("task_progress", {}),
                "assignment_scores": user.get("assignment_progress", {}),
                "quiz_scores": user.get("quiz_progress", {})
            },
            "curriculum_peek": {
                "current_day_tasks": day_data.get("tasks", []),
                "assignment_focus": day_data.get("assignment", {}).get("description", ""),
                "next_day_topic": get_day_data(current_day + 1, user).get("title", "Advanced Concepts") if current_day < 30 else "Completion"
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

@mentor_bp.route("/generate_chat_title", methods=["POST"])
def generate_title():
    data = request.get_json()
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Message is required"}), 400
    
    title = generate_chat_title(message)
    return jsonify({"success": True, "title": title}), 200

@mentor_bp.route("/save_chat", methods=["POST"])
def save_chat_to_history():
    data = request.get_json()
    user_id = data.get("user_id")
    chat_id = data.get("chat_id")
    title = data.get("title")
    messages = data.get("messages")

    if not all([user_id, chat_id, title, messages]):
        return jsonify({"error": "Missing fields"}), 400

    user = get_user(user_id)
    history = user.get("chat_history", [])
    
    # Check if chat already exists
    existing = next((c for c in history if c["id"] == chat_id), None)
    if existing:
        existing["messages"] = messages
        existing["title"] = title
    else:
        history.append({
            "id": chat_id,
            "title": title,
            "messages": messages,
            "timestamp": request.json.get("timestamp")
        })
    
    user["chat_history"] = history
    save_user(user_id, user)
    return jsonify({"success": True}), 200

@mentor_bp.route("/get_chat_history/<user_id>", methods=["GET"])
def get_history(user_id):
    user = get_user(user_id)
    return jsonify({"success": True, "history": user.get("chat_history", [])}), 200

@mentor_bp.route("/delete_chat", methods=["POST"])
def delete_chat():
    data = request.get_json()
    user_id = data.get("user_id")
    chat_id = data.get("chat_id")
    
    if not user_id or not chat_id:
        return jsonify({"error": "Missing user_id or chat_id"}), 400
        
    user = get_user(user_id)
    history = user.get("chat_history", [])
    user["chat_history"] = [c for c in history if c["id"] != chat_id]
    save_user(user_id, user)
    return jsonify({"success": True}), 200

@mentor_bp.route("/edit_chat_title", methods=["POST"])
def edit_chat_title():
    data = request.get_json()
    user_id = data.get("user_id")
    chat_id = data.get("chat_id")
    new_title = data.get("title")
    
    if not all([user_id, chat_id, new_title]):
        return jsonify({"error": "Missing fields"}), 400
        
    user = get_user(user_id)
    history = user.get("chat_history", [])
    for chat in history:
        if chat["id"] == chat_id:
            chat["title"] = new_title
            break
            
    user["chat_history"] = history
    save_user(user_id, user)
    return jsonify({"success": True}), 200
