import json
import os
from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.storage_logic import get_user_progress, save_user_progress, normalize_user_id, STORAGE_DIR
from utils.task_logic import get_all_video_ids_for_day, is_day_completed

progress_bp = Blueprint("progress", __name__)

@progress_bp.route('/complete_video', methods=['POST'])
def complete_video():
    body     = request.get_json()
    user_id  = body.get('user_id', 'demo')
    video_id = body.get('video_id')   # must be "t1", "t2", "t3" format
    day      = int(body.get('day', 1))

    if not video_id:
        return jsonify({"success": False, "error": "video_id required"}), 400

    user_progress = get_user_progress(user_id)
    completed_videos = user_progress.get("completed_videos", [])

    if video_id not in completed_videos:
        completed_videos.append(video_id)
        user_progress["completed_videos"] = completed_videos
        user_progress["last_activity"] = datetime.utcnow().isoformat()
        save_user_progress(user_id, user_progress)

    # Check if all videos for this day are done
    all_ids      = get_all_video_ids_for_day(day)
    all_done     = all(vid in completed_videos for vid in all_ids)

    # Find next unlocked video
    next_unlocked = None
    for i, vid in enumerate(all_ids):
        if vid not in completed_videos:
            next_unlocked = vid
            break

    # If all videos for today are done, check if we should unlock next day 
    # (Note: Assignment submission usually handles this, but user requested progression 
    # after last video OR assignment)
    if all_done and day not in user_progress.get("completed_days", []):
        print(f"[DEBUG] Day {day} videos all done. Waiting for assignment.")

    return jsonify({
        "success":        True,
        "all_videos_done": all_done,
        "next_unlocked":  next_unlocked
    })

@progress_bp.route('/api/complete_quiz', methods=['POST'])
def complete_quiz():
    body    = request.get_json()
    user_id = body.get('user_id', 'demo')
    day     = int(body.get('day', 1))
    score   = int(body.get('score', 0))

    user_progress = get_user_progress(user_id)
    if 'quiz_scores' not in user_progress:
        user_progress['quiz_scores'] = {}
    user_progress['quiz_scores'][f'day_{day}'] = score
    save_user_progress(user_id, user_progress)

    return jsonify({ "success": True, "day": day, "score": score })


@progress_bp.route('/save_submission', methods=['POST'])
def save_submission_route():
    body            = request.get_json()
    user_id         = body.get('user_id', 'demo')
    task_id         = body.get('task_id', '')        # format: "day_1"
    submission_text = body.get('submission_text', '')

    # Parse day number from task_id
    try:
        day = int(task_id.split('_')[1])
    except (IndexError, ValueError):
        return jsonify({"success": False, "error": "Invalid task_id format. Use day_1, day_2 etc"}), 400

    user_progress    = get_user_progress(user_id)
    completed_videos = user_progress.get("completed_videos", [])
    completed_days   = user_progress.get("completed_days", [])

    # Gate: all videos must be done first
    all_ids  = get_all_video_ids_for_day(day)
    all_done = all(vid in completed_videos for vid in all_ids)
    if not all_done:
        return jsonify({
            "success": False,
            "error":   "Complete all videos for this day before submitting the assignment."
        }), 400

    # Idempotent: already submitted
    if day in completed_days:
        return jsonify({
            "success":      True,
            "message":      f"Day {day} already complete.",
            "unlocked_day": day + 1,
            "current_day":  user_progress.get("current_day", day + 1)
        })

    # Unlock next day
    if day not in completed_days:
        completed_days.append(day)
    
    user_progress["completed_days"] = completed_days
    
    # Verify Day Completion Logic
    if is_day_completed(user_progress, day):
        user_progress["current_day"] = day + 1
        print(f"[DEBUG] Unlocking Day {day + 1}. Current Day set to {user_progress['current_day']}")
    
    user_progress["last_activity"]  = datetime.utcnow().isoformat()
    save_user_progress(user_id, user_progress)

    # Save submission to submissions.json
    sub_path = os.path.join(STORAGE_DIR, 'submissions.json')
    try:
        if os.path.exists(sub_path):
            with open(sub_path, 'r') as f:
                subs = json.load(f)
        else:
            subs = []
    except (FileNotFoundError, json.JSONDecodeError):
        subs = []
    subs.append({
        "user_id":    normalize_user_id(user_id),
        "day":        day,
        "text":       submission_text,
        "submitted_at": datetime.utcnow().isoformat()
    })
    with open(sub_path, 'w') as f:
        json.dump(subs, f, indent=2)

    return jsonify({
        "success":      True,
        "message": f"Day {day} complete! Day {day + 1} is now unlocked!",
        "unlocked_day": day + 1,
        "current_day":  day + 1
    })

# Keeping other profile management routes
@progress_bp.route("/save_profile", methods=["POST"])
@progress_bp.route("/create_user", methods=["POST"])
def api_create_user():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    user_id = data.get("user_id", "").strip()

    if not user_id:
        return jsonify({"error": "'user_id' is required"}), 400

    try:
        from utils.storage_logic import create_user
        user_data = create_user(user_id, data)
        return jsonify({"success": True, "user": user_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@progress_bp.route("/get_user/<user_id>", methods=["GET"])
def api_get_user(user_id):
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        from utils.storage_logic import load_user
        user_data = load_user(user_id)
        return jsonify({"success": True, "user": user_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@progress_bp.route("/update_reflection", methods=["POST"])
def api_update_reflection():
    data = request.get_json()
    user_id = data.get("user_id")
    reflection = data.get("reflection")
    
    if not user_id or not reflection:
        return jsonify({"error": "user_id and reflection required"}), 400
        
    try:
        from utils.storage_logic import load_user, update_user
        from datetime import date
        user_data = load_user(user_id)
        reflections = user_data.get("reflection", [])
        reflections.append({
            "text": reflection,
            "date": str(date.today())
        })
        update_user(user_id, {"reflection": reflections})
        return jsonify({"success": True, "message": "Reflection saved"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
