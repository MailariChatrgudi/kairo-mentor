from flask import Blueprint, request, jsonify
from utils.task_logic import (
    get_day_data, get_week_data,
    _get_tasks, _get_completed_videos, _get_completed_days,
    get_course_id_for_user, get_course_meta, load_course_data
)
from utils.storage_logic import get_user
from utils.ai_helper import generate_ai_feedback, generate_video_notes

task_bp = Blueprint("task", __name__)

@task_bp.route('/get_today_plan', methods=['POST'])
def get_today_plan_route():
    body        = request.get_json()
    user_id     = body.get('user_id', 'demo')
    day_number  = int(body.get('day', 1))

    user = get_user(user_id)
    day_data = get_day_data(day_number, user)

    if not day_data:
        return jsonify({"success": False, "error": f"Day {day_number} not found"}), 404

    return jsonify({"success": True, **day_data})


@task_bp.route('/get_week_plan', methods=['POST'])
def get_week_plan_route():
    body        = request.get_json()
    user_id     = body.get('user_id', 'demo')

    user = get_user(user_id)
    week_data = get_week_data(user)

    return jsonify({"success": True, "week_plan": week_data})


@task_bp.route('/get_course_info', methods=['POST'])
def get_course_info_route():
    """
    Returns course_meta for the user's selected course, plus per-phase topic lists
    extracted from the roadmap entries (using their 'phase' field).
    """
    body    = request.get_json()
    user_id = body.get('user_id', 'demo')
    user    = get_user(user_id)

    course_id = get_course_id_for_user(user)
    data      = load_course_data(course_id)
    meta      = data.get('course_meta', {})
    roadmap   = data.get('roadmap', [])

    # Build phase_name → [day_titles] map from the roadmap
    phase_topics: dict = {}
    phase_days: dict   = {}
    for entry in roadmap:
        phase_name = entry.get('phase', '')
        day_num    = entry.get('day')
        day_title  = entry.get('title')
        if not phase_name or not day_title:
            continue
        if phase_name not in phase_topics:
            phase_topics[phase_name] = []
            phase_days[phase_name]   = []
        if day_title not in phase_topics[phase_name]:
            phase_topics[phase_name].append(day_title)
        if day_num:
            phase_days[phase_name].append(day_num)

    # Parse phase strings like "Phase 1 (Days 1–10): HTML Fundamentals"
    import re
    phases_raw = meta.get('phases', [])
    phases_structured = []
    for i, ph_str in enumerate(phases_raw):
        # Try to extract days range and short name from string
        m = re.search(r'\(Days?\s*([\d\s–\-]+)\)\s*[:\-]?\s*(.*)', ph_str, re.IGNORECASE)
        if m:
            days_range_str = m.group(1).strip()
            short_name     = m.group(2).strip()
        else:
            days_range_str = ''
            short_name     = ph_str

        # Find matching phase_topics key (fuzzy: phase number match)
        phase_num_str = f'Phase {i + 1}'
        matched_key   = next((k for k in phase_topics if k.startswith(phase_num_str)), None)
        topics        = phase_topics.get(matched_key, []) if matched_key else []
        days          = sorted(phase_days.get(matched_key, [])) if matched_key else []

        phases_structured.append({
            'index':      i,
            'title':      short_name,
            'full_label': ph_str,
            'days_range': days_range_str,
            'day_start':  days[0]  if days else None,
            'day_end':    days[-1] if days else None,
            'topics':     topics,
        })

    # Compute which phase the user is currently in
    current_day = user.get('journey', {}).get('day', 1)
    current_phase_index = 0
    for i, ph in enumerate(phases_structured):
        start = ph.get('day_start') or 1
        end   = ph.get('day_end')   or 9999
        if start <= current_day <= end:
            current_phase_index = i
            break
        if current_day > end:
            current_phase_index = i + 1

    # Completed day numbers
    from utils.task_logic import _get_completed_days
    completed_days = _get_completed_days(user)

    return jsonify({
        'success':             True,
        'course_id':           course_id,
        'course_title':        meta.get('title', ''),
        'current_day':         current_day,
        'current_phase_index': min(current_phase_index, len(phases_structured) - 1),
        'completed_days':      completed_days,
        'phases':              phases_structured,
    })


@task_bp.route('/get_progress/<user_id>', methods=['GET'])
def get_progress_route(user_id):
    user = get_user(user_id)
    return jsonify({
        "success": True,
        "progress": {
            "current_day":      user["journey"].get("day", 1),
            "completed_days":   _get_completed_days(user),
            "completed_videos": _get_completed_videos(user),
            "streak":           user["progress"].get("streak", 0),
            "activity":         user["progress"].get("activity", {}),
            "course_id":        get_course_id_for_user(user),
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
