import json
import os
from datetime import datetime

# ── Course Registry ────────────────────────────────────────────────────────────
# Add a new course: drop its JSON in data/courses/ and add an entry here.
COURSE_REGISTRY = {
    "fullstack": "courses/fullstack.json",
    "ai":        "courses/ai.json",
    "ml":        "courses/ml.json",
    "gate":      "courses/gate.json",
}

# Human-readable career name → canonical course_id
CAREER_TO_COURSE_ID = {
    # Fullstack / Web
    "full stack developer":     "fullstack",
    "full-stack developer":     "fullstack",
    "web developer":            "fullstack",
    "software engineer":        "fullstack",
    "fullstack":                "fullstack",
    "full stack web development": "fullstack",
    "fullstack developer":      "fullstack",

    # AI Engineering
    "ai engineering":           "ai",
    "ai engineer":              "ai",
    "ai engineers":             "ai",
    "ai/ml engineer":           "ai",
    "artificial intelligence":  "ai",
    "ai":                       "ai",

    # Machine Learning
    "machine learning":         "ml",
    "data scientist":           "ml",
    "data science":             "ml",
    "ml engineer":              "ml",
    "ml":                       "ml",

    # GATE
    "gate exam":                "gate",
    "gate da":                  "gate",
    "gate":                     "gate",
    "govt exams":               "gate",
}

DEFAULT_COURSE = "fullstack"

# ── In-memory cache: { course_id → data_dict } ────────────────────────────────
_COURSE_CACHE: dict = {}

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')


def resolve_course_id(raw: str) -> str:
    """
    Maps any career string (from user.career.selected) → canonical course_id.
    Normalises to lowercase, strips, then looks up CAREER_TO_COURSE_ID.
    Falls back to DEFAULT_COURSE ('fullstack') if unknown.
    """
    if not raw:
        return DEFAULT_COURSE
    key = raw.strip().lower()
    # Direct registry key match (e.g. "fullstack", "ml")
    if key in COURSE_REGISTRY:
        return key
    # Human-readable lookup
    course_id = CAREER_TO_COURSE_ID.get(key, DEFAULT_COURSE)
    return course_id if course_id in COURSE_REGISTRY else DEFAULT_COURSE


def load_course_data(course_id: str) -> dict:
    """
    Loads and caches a course JSON. Returns the full dict.
    On error falls back to fullstack gracefully.
    """
    cid = course_id if course_id in COURSE_REGISTRY else DEFAULT_COURSE
    if cid in _COURSE_CACHE:
        return _COURSE_CACHE[cid]

    path = os.path.join(DATA_DIR, COURSE_REGISTRY[cid])
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        _COURSE_CACHE[cid] = data
        return data
    except FileNotFoundError:
        if cid != DEFAULT_COURSE:
            # Graceful fallback
            return load_course_data(DEFAULT_COURSE)
        raise RuntimeError(f"Default course file not found: {path}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Malformed course JSON ({cid}): {e}")


def get_course_id_for_user(user: dict) -> str:
    """Extracts the user's course selection and resolves it.
    Prefers career.course_id if it's a known registry key;
    otherwise falls back to resolving career.selected.
    """
    stored_cid = user.get("career", {}).get("course_id", "")
    if stored_cid and stored_cid in COURSE_REGISTRY:
        return stored_cid
    # Stored course_id is stale or inconsistent (e.g. 'ai_engineer') — re-resolve
    raw = user.get("career", {}).get("selected", "")
    return resolve_course_id(raw)


def get_course_meta(course_id: str) -> dict:
    """Returns course_meta block (title, phases, total_days, etc.)."""
    return load_course_data(course_id).get("course_meta", {})


# ── Video / Day helpers ────────────────────────────────────────────────────────

def _get_completed_videos(user: dict) -> list:
    """Flat list of all completed video IDs across all days."""
    flat = []
    # Support legacy schema
    for vid_id in user.get("completed_videos", []):
        if vid_id not in flat:
            flat.append(vid_id)
    # New schema: video_progress[day_N][tXX] = True
    for day_key, vids in user.get("video_progress", {}).items():
        for vid_id, done in vids.items():
            if done and vid_id not in flat:
                flat.append(vid_id)
    return flat


def _get_completed_days(user: dict) -> list:
    """Flat list of completed day numbers (int)."""
    flat = []
    for d in user.get("completed_days", []):
        if d not in flat:
            flat.append(d)
    for day_key, data in user.get("assignment_progress", {}).items():
        if data.get("status") == "completed":
            try:
                d_num = int(day_key.split("_")[1])
                if d_num not in flat:
                    flat.append(d_num)
            except (IndexError, ValueError):
                pass
    return flat


def get_all_video_ids_for_day(day_number: int, course_id: str = None,
                               user: dict = None) -> list:
    """
    Returns list of video IDs (e.g. ['t1', 't2']) for a given day.
    course_id is resolved from user if not provided.
    """
    if course_id is None:
        course_id = get_course_id_for_user(user) if user else DEFAULT_COURSE
    data = load_course_data(course_id)
    day_entry = next((d for d in data["roadmap"] if d["day"] == day_number), None)
    if not day_entry or not day_entry.get("playlist_videos"):
        return []
    return [f"t{v['tutorial_no']}" for v in day_entry["playlist_videos"]]


def is_day_completed(user: dict, day_number: int) -> bool:
    course_id = get_course_id_for_user(user)
    completed_videos = _get_completed_videos(user)
    completed_days   = _get_completed_days(user)

    day_video_ids = get_all_video_ids_for_day(day_number, course_id=course_id)
    if not day_video_ids:
        return False

    all_videos_done = all(vid in completed_videos for vid in day_video_ids)
    assignment_done = day_number in completed_days
    return all_videos_done and assignment_done


def is_day_locked(user: dict, day_number: int) -> bool:
    if day_number <= 1:
        return False
    prev_done    = is_day_completed(user, day_number - 1)
    current_day  = user.get("journey", {}).get("day", 1)
    return not prev_done and day_number > current_day


def get_day_data(day_number: int, user: dict) -> dict | None:
    """
    Full day data payload for API responses.
    Dynamically selects the correct course based on user.career.selected.
    """
    course_id = get_course_id_for_user(user)
    data      = load_course_data(course_id)

    day_entry = next((d for d in data["roadmap"] if d["day"] == day_number), None)
    if not day_entry or day_entry.get("title") is None:
        return None

    completed_videos = _get_completed_videos(user)
    completed_days   = _get_completed_days(user)
    day_locked       = is_day_locked(user, day_number)

    # Build video list with serial lock (each video locked until previous done)
    videos = []
    playlist = day_entry.get("playlist_videos") or []
    for idx, v in enumerate(playlist):
        vid_id = f"t{v['tutorial_no']}"
        if idx == 0:
            locked = day_locked
        else:
            prev_id = f"t{playlist[idx - 1]['tutorial_no']}"
            locked  = day_locked or (prev_id not in completed_videos)
        videos.append({
            "id":        vid_id,
            "title":     v.get("title", ""),
            "url":       v.get("url", ""),
            "resource":  v.get("github_resource") or "",
            "locked":    locked,
            "completed": vid_id in completed_videos,
        })

    all_videos_done = all(v["completed"] for v in videos)

    return {
        "day":                  day_number,
        "course_id":            course_id,
        "phase":                day_entry.get("phase", ""),
        "title":                day_entry.get("title", ""),
        "topic":                day_entry.get("title", ""),
        "is_locked":            day_locked,
        "videos":               videos,
        "assignment": {
            "title":       "Daily Practice Task",
            "description": day_entry.get("practice_task", "")
        },
        "quiz":                 day_entry.get("quiz") or [],
        "all_videos_done":      all_videos_done,
        "assignment_submitted": day_number in completed_days,
        "day_complete":         is_day_completed(user, day_number),
    }


def get_week_data(user: dict) -> list:
    """Full roadmap week view (all days) for the user's selected course."""
    course_id      = get_course_id_for_user(user)
    data           = load_course_data(course_id)
    completed_vids = _get_completed_videos(user)
    result         = []

    for day_entry in data["roadmap"]:
        d = day_entry["day"]
        # Skip null-placeholder days (gate.json days 11-30 are null stubs)
        if day_entry.get("title") is None:
            continue
        playlist = day_entry.get("playlist_videos") or []
        locked    = is_day_locked(user, d)
        completed = is_day_completed(user, d)
        result.append({
            "day":       d,
            "title":     day_entry.get("title", ""),
            "locked":    locked,
            "completed": completed,
            "videos": [
                {
                    "id":        f"t{v['tutorial_no']}",
                    "title":     v.get("title", ""),
                    "completed": f"t{v['tutorial_no']}" in completed_vids,
                }
                for v in playlist
            ],
        })
    return result


def get_today_plan(career: str, level: str, day: int,
                   language: str, user_id: str = None) -> dict | None:
    """Backwards-compatible wrapper used by some older callers."""
    from utils.storage_logic import get_user
    user = get_user(user_id or "demo")
    return get_day_data(int(day), user)


# ── Backwards-compatible alias ─────────────────────────────────────────────────
def _get_tasks():
    """Legacy shim — loads the fullstack course. Avoid using in new code."""
    return load_course_data(DEFAULT_COURSE)

_get_tasks_data = _get_tasks
normalize_user_id = lambda uid: uid.strip().lower().replace(" ", "_") if uid else "demo"
