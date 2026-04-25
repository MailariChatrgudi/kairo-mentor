import json
import os
from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.storage_logic import (
    get_user, save_user, update_streak,
    USERS_DIR, normalize_user_id
)
from utils.task_logic import (
    get_all_video_ids_for_day, is_day_completed,
    _get_completed_videos, _get_completed_days,
    resolve_course_id
)

progress_bp = Blueprint("progress", __name__)


# ── SYSTEM 4: Central Day Completion Engine ───────────────────────────────────
def check_day_completion(user, day):
    """
    Returns True if all videos done AND assignment submitted for this day.
    If True: advances journey.day and updates streak to full (status=2).
    (Pure logic – caller must call save_user after this.)
    """
    all_ids = get_all_video_ids_for_day(day)
    completed_vids = _get_completed_videos(user)
    all_videos_done = all(vid in completed_vids for vid in all_ids) if all_ids else False

    day_key = f"day_{day}"
    assignment_done = user.get("assignment_progress", {}).get(day_key, {}).get("status") == "completed"

    return all_videos_done and assignment_done


# ── SYSTEM 3: Video Completion ────────────────────────────────────────────────
@progress_bp.route('/complete_video', methods=['POST'])
def complete_video():
    """
    Marks a single video as complete.
    LOAD → MODIFY → SAVE (atomic).
    Updates streak with partial activity (status=1).
    Returns all_videos_done + next_unlocked info.
    """
    body = request.get_json()
    user_id = body.get('user_id', 'demo')
    video_id = body.get('video_id')
    day = int(body.get('day', 1))

    if not video_id:
        return jsonify({"success": False, "error": "video_id required"}), 400

    # LOAD
    user = get_user(user_id)

    day_key = f"day_{day}"
    if "video_progress" not in user:
        user["video_progress"] = {}
    if day_key not in user["video_progress"]:
        user["video_progress"][day_key] = {}

    # MODIFY
    user["video_progress"][day_key][video_id] = True

    # SAVE
    save_user(user_id, user)

    # Update streak (partial work = status 1)
    update_streak(user_id, status=1)

    # Determine next unlock info
    completed_videos = _get_completed_videos(user)
    all_ids = get_all_video_ids_for_day(day)
    all_done = all(vid in completed_videos for vid in all_ids)

    next_unlocked = None
    for vid in all_ids:
        if vid not in completed_videos:
            next_unlocked = vid
            break

    return jsonify({
        "success": True,
        "all_videos_done": all_done,
        "next_unlocked": next_unlocked,
        "video_id": video_id
    })


# ── Quiz Completion ───────────────────────────────────────────────────────────
@progress_bp.route('/api/complete_quiz', methods=['POST'])
@progress_bp.route('/complete_quiz', methods=['POST'])
def complete_quiz():
    body = request.get_json()
    user_id = body.get('user_id', 'demo')
    day = int(body.get('day', 1))
    score = int(body.get('score', 0))

    # LOAD
    user = get_user(user_id)
    if 'quiz_progress' not in user:
        user['quiz_progress'] = {}

    # MODIFY
    user['quiz_progress'][f'day_{day}'] = {
        "score": score,
        "completed_at": datetime.utcnow().isoformat()
    }

    # SAVE
    save_user(user_id, user)

    return jsonify({"success": True, "day": day, "score": score})


# ── SYSTEM 4: Assignment Submission + Day Completion Engine ───────────────────
@progress_bp.route('/save_submission', methods=['POST'])
def save_submission_route():
    """
    Submits the daily assignment.
    Gate: all videos for that day MUST be done.
    On success → marks assignment complete → checks day complete →
    advances journey.day → updates streak to status 2 (full).
    """
    body = request.get_json()
    user_id = body.get('user_id', 'demo')
    task_id = body.get('task_id', '')
    submission_text = body.get('submission_text', '')

    try:
        day = int(task_id.split('_')[1])
    except (IndexError, ValueError):
        return jsonify({"success": False, "error": "Invalid task_id format. Expected 'day_N'"}), 400

    # LOAD
    user = get_user(user_id)

    # Gate: all videos must be completed first
    all_ids = get_all_video_ids_for_day(day)
    completed_vids = _get_completed_videos(user)
    all_done = all(vid in completed_vids for vid in all_ids) if all_ids else True

    if not all_done:
        return jsonify({
            "success": False,
            "error": "Complete all videos for this day before submitting the assignment."
        }), 400

    day_key = f"day_{day}"

    # MODIFY: mark assignment as completed
    if day_key not in user["assignment_progress"]:
        user["assignment_progress"][day_key] = {
            "status": "completed",
            "proof_link": submission_text,
            "submitted_at": datetime.utcnow().isoformat()
        }
    else:
        # Allow re-submission
        user["assignment_progress"][day_key]["status"] = "completed"
        user["assignment_progress"][day_key]["proof_link"] = submission_text
        user["assignment_progress"][day_key]["submitted_at"] = datetime.utcnow().isoformat()

    # SYSTEM 4: check_day_completion → advance journey.day
    if check_day_completion(user, day):
        current_day = user["journey"].get("day", 1)
        if day >= current_day:
            user["journey"]["day"] = day + 1

    # SAVE
    save_user(user_id, user)

    # Update streak to full activity (status=2)
    update_streak(user_id, status=2)

    # Re-read updated user for response
    updated_user = get_user(user_id)

    return jsonify({
        "success": True,
        "message": f"Day {day} complete! Day {day + 1} unlocked.",
        "unlocked_day": day + 1,
        "new_journey_day": updated_user["journey"]["day"],
        "streak": updated_user["progress"]["streak"]
    })


# ── Profile / User Creation ───────────────────────────────────────────────────
@progress_bp.route("/save_profile", methods=["POST"])
@progress_bp.route("/create_user", methods=["POST"])
def api_create_user():
    """
    Onboarding → saves user profile.
    Also resolves career_path → course_id (canonical key for data loading).
    If the user switches course, journey.day resets to 1 to avoid invalid day refs.
    LOAD → MODIFY → SAVE pattern ensures no data loss.
    """
    data    = request.get_json()
    user_id = data.get("user_id", "").strip()
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    # LOAD
    user = get_user(user_id)

    # MODIFY: profile fields
    p = user["profile"]
    p["name"]                 = data.get("name",                p.get("name", user_id))
    p["student_type"]         = data.get("student_type",        p.get("student_type", "12th"))
    p["interest"]             = data.get("interest",            p.get("interest", ""))
    p["goal"]                 = data.get("goal",                p.get("goal", ""))
    p["financial_background"] = data.get("financial_background", p.get("financial_background", ""))
    p["rank_or_year"]         = data.get("rank_or_year",        p.get("rank_or_year", ""))

    # MODIFY: career selection → resolve canonical course_id
    raw_career = data.get("career_path") or data.get("career") or ""
    if raw_career:
        new_course_id = resolve_course_id(raw_career)
        old_course_id = user["career"].get("course_id", "")

        user["career"]["selected"]  = raw_career      # preserve original label
        user["career"]["course_id"] = new_course_id   # canonical key

        # If the user switches course → reset journey so Day 1 loads correctly
        if old_course_id and old_course_id != new_course_id:
            # Snapshot current progress into course_progress[old_course_id]
            if "course_progress" not in user:
                user["course_progress"] = {}
            user["course_progress"][old_course_id] = {
                "journey":             user.get("journey", {}),
                "video_progress":      user.get("video_progress", {}),
                "assignment_progress": user.get("assignment_progress", {}),
                "quiz_progress":       user.get("quiz_progress", {}),
            }
            # Restore progress for new course if it exists, else start fresh
            saved = user["course_progress"].get(new_course_id)
            if saved:
                user["journey"]             = saved.get("journey", {"phase": 1, "day": 1})
                user["video_progress"]      = saved.get("video_progress", {})
                user["assignment_progress"] = saved.get("assignment_progress", {})
                user["quiz_progress"]       = saved.get("quiz_progress", {})
            else:
                user["journey"]             = {"phase": 1, "day": 1}
                user["video_progress"]      = {}
                user["assignment_progress"] = {}
                user["quiz_progress"]       = {}
    elif "course_id" not in user.get("career", {}):
        # Ensure course_id is always set even on old user records
        user["career"]["course_id"] = resolve_course_id(user["career"].get("selected", ""))

    # SAVE
    save_user(user_id, user)
    return jsonify({"success": True, "user": user})



# ── Get User ──────────────────────────────────────────────────────────────────
@progress_bp.route("/get_user/<user_id>", methods=["GET"])
def api_get_user(user_id):
    user = get_user(user_id)
    return jsonify({"success": True, "user": user})


# ── Reflection ────────────────────────────────────────────────────────────────
@progress_bp.route("/update_reflection", methods=["POST"])
def api_update_reflection():
    data = request.get_json()
    user_id = data.get("user_id")
    reflection = data.get("reflection")

    if not user_id or not reflection:
        return jsonify({"error": "missing data"}), 400

    # LOAD
    user = get_user(user_id)
    if "reflections" not in user:
        user["reflections"] = []

    # MODIFY
    user["reflections"].append({
        "text": reflection,
        "date": str(datetime.now().date())
    })

    # SAVE
    save_user(user_id, user)
    return jsonify({"success": True})
