from flask import Blueprint, request, jsonify
from utils.task_logic import get_day_data, get_week_data, _get_tasks
from utils.storage_logic import get_user_progress
from utils.ai_helper import generate_ai_feedback, generate_video_notes

task_bp = Blueprint("task", __name__)

@task_bp.route('/get_today_plan', methods=['POST'])
def get_today_plan_route():
    body        = request.get_json()
    user_id     = body.get('user_id', 'demo')
    day_number  = int(body.get('day', 1))

    user_progress = get_user_progress(user_id)
    day_data      = get_day_data(day_number, user_progress)

    if not day_data:
        return jsonify({"success": False, "error": f"Day {day_number} not found"}), 404

    return jsonify({"success": True, **day_data})


@task_bp.route('/get_week_plan', methods=['POST'])
def get_week_plan_route():
    body        = request.get_json()
    user_id     = body.get('user_id', 'demo')

    user_progress = get_user_progress(user_id)
    week_data     = get_week_data(user_progress)

    return jsonify({"success": True, "week_plan": week_data})


@task_bp.route('/get_progress/<user_id>', methods=['GET'])
def get_progress_route(user_id):
    user_progress = get_user_progress(user_id)
    return jsonify({
        "success": True,
        "progress": {
            "current_day":    user_progress.get("current_day", 1),
            "completed_days": user_progress.get("completed_days", []),
            "completed_videos": user_progress.get("completed_videos", []),
            "streak":         0,
            "activity":       {}
        }
    })

# Keeping existing AI routes
@task_bp.route("/ai_feedback", methods=["POST"])
def ai_feedback():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    task       = data.get("task", "").strip()
    submission = data.get("submission", "").strip()

    if not task:
        return jsonify({"error": "'task' description is required"}), 400
    if not submission:
        return jsonify({"error": "'submission' is required"}), 400

    try:
        feedback = generate_ai_feedback(task, submission)
        return jsonify({
            "success": True,
            "feedback": feedback
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@task_bp.route("/generate_video_notes", methods=["POST"])
def video_notes():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    video_title = data.get("video_title", "").strip()
    if not video_title:
        return jsonify({"error": "'video_title' is required"}), 400

    try:
        notes = generate_video_notes(video_title)
        return jsonify({
            "success": True,
            "notes": notes
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
