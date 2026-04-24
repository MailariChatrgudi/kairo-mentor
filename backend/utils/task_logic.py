import json, os
from datetime import datetime

_TASKS_CACHE = None

def normalize_user_id(user_id):
    return user_id.strip().lower().replace(" ", "_")

def _get_tasks():
    global _TASKS_CACHE
    if _TASKS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), '..', 'data', 'tasks.json')
        with open(path, 'r') as f:
            _TASKS_CACHE = json.load(f)
    return _TASKS_CACHE

_get_tasks_data = _get_tasks

def is_day_completed(user_progress, day_number):
    """
    Check if a day is completed:
    1. All videos for the day are in completed_videos
    2. Day is in completed_days (assignment submitted)
    """
    completed_videos = user_progress.get("completed_videos", [])
    completed_days   = user_progress.get("completed_days", [])
    
    day_video_ids = get_all_video_ids_for_day(day_number)
    if not day_video_ids: return False
        
    all_videos_done = all(vid in completed_videos for vid in day_video_ids)
    assignment_done = day_number in completed_days
    
    # Debug logs requested by user
    print(f"Current Day: {user_progress.get('current_day')}")
    print(f"Day {day_number} Completed: {all_videos_done and assignment_done}")
    
    return all_videos_done and assignment_done

def is_day_locked(user_progress, day_number):
    """
    Day 1 always unlocked. Day N locked if Day N-1 not completed.
    """
    if day_number <= 1: return False
    
    prev_day_done = is_day_completed(user_progress, day_number - 1)
    current_day = user_progress.get("current_day", 1)
    
    # Locked if previous day is not done AND it's beyond current_day progression
    locked = not prev_day_done and day_number > current_day
    return locked

def get_day_data(day_number, user_progress):
    tasks = _get_tasks()
    day_entry = next((d for d in tasks["roadmap"] if d["day"] == day_number), None)
    if not day_entry: return None

    completed_videos = user_progress.get("completed_videos", [])
    completed_days   = user_progress.get("completed_days", [])
    
    day_locked = is_day_locked(user_progress, day_number)

    videos = []
    for idx, v in enumerate(day_entry["playlist_videos"]):
        vid_id = f"t{v['tutorial_no']}"
        if idx == 0:
            locked = day_locked
        else:
            prev_id = f"t{day_entry['playlist_videos'][idx-1]['tutorial_no']}"
            locked = prev_id not in completed_videos
        videos.append({
            "id":        vid_id,
            "title":     v["title"],
            "url":       v["url"],
            "resource":  v.get("github_resource", ""),
            "locked":    locked,
            "completed": vid_id in completed_videos
        })

    all_videos_done = all(v["completed"] for v in videos)

    return {
        "day":                 day_number,
        "phase":               day_entry.get("phase", ""),
        "title":               day_entry.get("title", ""),
        "topic":               day_entry.get("title", ""),
        "is_locked":           day_locked,
        "videos":              videos,
        "assignment": {
            "title":       "Daily Practice Task",
            "description": day_entry.get("practice_task", "")
        },
        "quiz":                day_entry.get("quiz", []),
        "all_videos_done":     all_videos_done,
        "assignment_submitted": day_number in completed_days,
        "day_complete":        is_day_completed(user_progress, day_number)
    }

def get_all_video_ids_for_day(day_number):
    tasks = _get_tasks()
    day_entry = next((d for d in tasks["roadmap"] if d["day"] == day_number), None)
    if not day_entry: return []
    return [f"t{v['tutorial_no']}" for v in day_entry["playlist_videos"]]

def get_week_data(user_progress):
    """
    Generate week overview with correct lock and completion status.
    """
    tasks = _get_tasks()
    result = []
    for day_entry in tasks["roadmap"]:
        d = day_entry["day"]
        locked = is_day_locked(user_progress, d)
        completed = is_day_completed(user_progress, d)
        result.append({
            "day":       d,
            "title":     day_entry.get("title", ""),
            "locked":    locked,
            "completed": completed,
            "videos":    [{"id": f"t{v['tutorial_no']}", "completed": f"t{v['tutorial_no']}" in user_progress.get("completed_videos", [])}
                          for v in day_entry["playlist_videos"]]
        })
    return result

def get_today_plan(career, level, day, language, user_id=None):
    from utils.storage_logic import get_user_progress
    user_progress = get_user_progress(user_id or "demo")
    return get_day_data(int(day), user_progress)
