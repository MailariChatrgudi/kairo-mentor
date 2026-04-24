import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
STORAGE_DIR = BASE_DIR / "storage"

def load_json(filename: str, directory: Path = None) -> dict | list:
    """Load a JSON file and return its content."""
    directory = directory or DATA_DIR
    path = directory / filename
    if not path.exists():
        logger.warning(f"File not found: {path}")
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(filename: str, data: dict | list, directory: Path = None):
    """Save data to a JSON file."""
    directory = directory or STORAGE_DIR
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
