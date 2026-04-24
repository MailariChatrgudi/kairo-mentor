from flask import Blueprint, request, jsonify
from utils.mentor_logic import chat_with_mentor

mentor_bp = Blueprint("mentor", __name__)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/ai_mentor
# Input : { "message": "user text", "history": [...], "context": {...} }
# Output: AI response text
# ─────────────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────────────
@mentor_bp.route("/ai_mentor", methods=["POST"])
@mentor_bp.route("/ai_mentor_chat", methods=["POST"])
def ai_mentor():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    message = data.get("message", "").strip()
    history = data.get("history", [])
    user_id = data.get("user_id", "").strip()

    if not message:
        return jsonify({"error": "'message' field is required in request"}), 400
    if not user_id:
        return jsonify({"error": "'user_id' field is required in request"}), 400

    try:
        response_text = chat_with_mentor(user_id, message, history)
        return jsonify({
            "success": True,
            "response": response_text
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
