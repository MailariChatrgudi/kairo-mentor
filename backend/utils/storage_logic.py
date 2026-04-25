import json
import os
import logging
from datetime import datetime, date, timedelta

logger = logging.getLogger(__name__)

# Base storage directory
BASE_STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'storage')
# Specific users directory
USERS_DIR = os.path.join(BASE_STORAGE_DIR, 'users')

if not os.path.exists(USERS_DIR):
    os.makedirs(USERS_DIR, exist_ok=True)


def normalize_user_id(user_id):
    if not user_id:
        return "demo"
    return user_id.strip().lower().replace(" ", "_").replace(".", "_")


def get_default_user_schema(user_id):
    """
    STRICT DATABASE JSON SCHEMA
    All keys are always present. Missing keys are auto-initialized.
    """
    uid = normalize_user_id(user_id)
    today = str(date.today())
    return {
        "user_id": uid,
        "profile": {
            "name": user_id,
            "student_type": "12th",
            "interest": "",
            "goal": "",
            "financial_background": "",
            "rank_or_year": ""
        },
        "career": {
            "selected": "fullstack",
            "course_id": "fullstack",       # canonical course key
            "suggested": []
        },
        "journey": {
            "phase": 1,
            "day": 1
        },
        "progress": {
            "streak": 0,
            "start_date": today,
            "last_active_date": "",
            "activity": {}
        },
        "video_progress": {},
        "task_progress": {},
        "assignment_progress": {},
        "quiz_progress": {},
        # Per-course snapshot — preserves progress if user switches course
        "course_progress": {},
        "updated_at": datetime.utcnow().isoformat()
    }


def ensure_schema_integrity(data):
    """
    Guarantees all required fields exist. Initializes any missing fields
    without overwriting existing data. Safe to call on every load.
    """
    default = get_default_user_schema(data.get("user_id", "demo"))

    for key in default:
        if key not in data:
            data[key] = default[key]
        elif isinstance(default[key], dict) and isinstance(data.get(key), dict):
            for subkey in default[key]:
                if subkey not in data[key]:
                    data[key][subkey] = default[key][subkey]

    return data


def get_user(user_id):
    """
    LOAD: if file does not exist → create fresh user; return user JSON.
    Always runs schema integrity check on load.
    """
    uid = normalize_user_id(user_id)
    path = os.path.join(USERS_DIR, f"user_{uid}.json")

    if not os.path.exists(path):
        # Check for old layout migration
        old_path = os.path.join(BASE_STORAGE_DIR, f"user_{uid}.json")
        if os.path.exists(old_path):
            try:
                with open(old_path, 'r') as f:
                    old_data = json.load(f)
                new_data = migrate_old_user(old_data)
                save_user(uid, new_data)
                return new_data
            except Exception as e:
                logger.error(f"Migration failed for {uid}: {e}")

        # Truly new user
        new_data = get_default_user_schema(uid)
        save_user(uid, new_data)
        return new_data

    try:
        with open(path, 'r') as f:
            data = json.load(f)
        return ensure_schema_integrity(data)
    except Exception as e:
        logger.error(f"Failed to read user {uid}: {e}")
        return get_default_user_schema(uid)


def save_user(user_id, data):
    """
    SAVE: atomically overwrite the user's JSON file.
    """
    uid = normalize_user_id(user_id)
    path = os.path.join(USERS_DIR, f"user_{uid}.json")
    data["updated_at"] = datetime.utcnow().isoformat()

    try:
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(
            f"[SAVE] user={uid} | day={data.get('journey',{}).get('day',1)} "
            f"| streak={data.get('progress',{}).get('streak',0)}"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to save user {uid}: {e}")
        return False


def update_user(user_id, updates):
    """
    LOAD → MODIFY → SAVE with deep merge.
    """
    user_data = get_user(user_id)

    def deep_update(d, u):
        for k, v in u.items():
            if isinstance(v, dict) and k in d and isinstance(d[k], dict):
                deep_update(d[k], v)
            else:
                d[k] = v

    deep_update(user_data, updates)
    save_user(user_id, user_data)
    return user_data


def update_streak(user_id, status=1):
    """
    REAL DATE-BASED STREAK SYSTEM:
      - Same day  → only upgrade activity level if higher
      - Yesterday → streak++
      - Else       → reset streak to 1

    status: 1 = partial work, 2 = full day complete
    """
    today = str(date.today())
    yesterday = str(date.today() - timedelta(days=1))

    # LOAD
    user_data = get_user(user_id)
    prog = user_data["progress"]

    last_active = prog.get("last_active_date", "")

    if last_active == today:
        # Same day: only upgrade activity level, never downgrade
        current_val = prog["activity"].get(today, 0)
        if status > current_val:
            prog["activity"][today] = status
    elif last_active == yesterday:
        # Consecutive day: extend the streak
        prog["streak"] += 1
        prog["last_active_date"] = today
        prog["activity"][today] = status
    else:
        # Gap or first ever activity: reset
        prog["streak"] = 1
        prog["last_active_date"] = today
        prog["activity"][today] = status

    # SAVE
    save_user(user_id, user_data)
    return user_data


def migrate_old_user(old_data):
    """
    Migrates from old flat schema to new strict hierarchical schema.
    """
    new_data = get_default_user_schema(old_data.get("user_id", "demo"))

    new_data["journey"]["day"] = old_data.get("current_day", 1)
    new_data["career"]["selected"] = old_data.get("career_path", "Full Stack Developer")
    new_data["progress"]["streak"] = old_data.get("streak", 0)
    new_data["progress"]["last_active_date"] = old_data.get("last_active_date", "")
    new_data["progress"]["activity"] = old_data.get("activity", {})
    new_data["progress"]["start_date"] = old_data.get("start_date", str(date.today()))

    return new_data


# ── Backwards-compatible aliases ──────────────────────────────────────────────
def get_user_progress(user_id):
    return get_user(user_id)

def save_user_progress(user_id, data):
    return save_user(user_id, data)

def get_user_data(user_id):
    return get_user(user_id)

def load_user(user_id):
    return get_user(user_id)

def create_user(user_id, data=None):
    user = get_user(user_id)
    if data:
        if "profile" in data:
            user["profile"].update(data["profile"])
        if "career_path" in data:
            user["career"]["selected"] = data["career_path"]
        save_user(user_id, user)
    return user

def get_progress(user_id):
    return get_user(user_id)

def save_user_data(user_id, data):
    return save_user(user_id, data)
