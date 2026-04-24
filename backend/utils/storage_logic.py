import json
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'storage')

def normalize_user_id(user_ids):
    return user_ids.strip().lower().replace(" ", "_")

def get_user_progress(user_id):
    uid = normalize_user_id(user_id)
    path = os.path.join(STORAGE_DIR, f"user_{uid}.json")
    if not os.path.exists(path):
        default = {
            "user_id": uid,
            "career_path": "Full Stack Developer",
            "current_day": 1,
            "completed_days": [],
            "completed_videos": [],
            "last_activity": ""
        }
        save_user_progress(uid, default)
        return default
    with open(path, 'r') as f:
        data = json.load(f)
    # Migrate old schema if needed
    if "current_day" not in data:
        data["current_day"] = data.get("progress", {}).get("current_day", 1) or 1
    if "completed_days" not in data:
        data["completed_days"] = []
    if "completed_videos" not in data:
        data["completed_videos"] = []
    if data["current_day"] == 0:
        data["current_day"] = 1
    return data

def save_user_progress(user_id, data):
    uid = normalize_user_id(user_id)
    path = os.path.join(STORAGE_DIR, f"user_{uid}.json")
    data["updated_at"] = datetime.utcnow().isoformat()
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

# Compatibility Aliases
def get_user_data(user_id):
    return get_user_progress(user_id)

def get_progress(user_id):
    return get_user_progress(user_id)

def load_user(user_id):
    return get_user_progress(user_id)

def create_user(user_id, data):
    # For now, just return or initialize
    return get_user_progress(user_id)

def update_user(user_id, data):
    user_data = get_user_progress(user_id)
    user_data.update(data)
    save_user_progress(user_id, user_data)
    return user_data

def save_user_data(user_id, data):
    save_user_progress(user_id, data)
    return data
