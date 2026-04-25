import os
import json
import time
import sys

# Add parent directory to path to allow importing from utils
sys.path.append(os.getcwd())

from utils.ai_helper import generate_video_notes
from utils.common import load_json, DATA_DIR

def bulk_generate():
    tasks_path = os.path.join(DATA_DIR, 'tasks.json')
    tasks = load_json('tasks.json', DATA_DIR)
    
    if not tasks or 'roadmap' not in tasks:
        print("Tasks not found or invalid.")
        return

    titles = []
    for day in tasks['roadmap']:
        for video in day.get('playlist_videos', []):
            titles.append(video['title'])
    
    unique_titles = list(dict.fromkeys(titles))
    print(f"Found {len(unique_titles)} unique videos.")

    # Process ALL videos
    for i, title in enumerate(unique_titles):
        print(f"[{i+1}/{len(unique_titles)}] Generating/Checking notes for: {title}")
        generate_video_notes(title)
        # Small delay to avoid rate limits
        time.sleep(0.5)

if __name__ == "__main__":
    bulk_generate()
