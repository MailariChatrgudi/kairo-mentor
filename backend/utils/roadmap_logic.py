import logging
from utils.common import load_json

logger = logging.getLogger(__name__)

def get_roadmap(career: str) -> dict | list:
    """Fetch structured roadmap for a given career, powered by AI with local fallback."""
    from utils.ai_helper import generate_ai_roadmap
    from utils.task_logic import _get_tasks_data

    # 1. NEW: Check tasks.json for standardized course phases
    try:
        tasks_data = _get_tasks_data()
        raw_phases = tasks_data.get("course_meta", {}).get("phases", [])
        if raw_phases:
            logger.info(f"Found {len(raw_phases)} phases in tasks.json")
            roadmap_phases = []
            for p in raw_phases:
                if ":" in p:
                    prefix, name = p.split(":", 1)
                    # Extract duration like "Days 1–10" from "Phase 1 (Days 1–10)"
                    duration = ""
                    if "(" in prefix and ")" in prefix:
                        duration = prefix[prefix.find("(")+1 : prefix.find(")")]
                    
                    roadmap_phases.append({
                        "title": name.strip(), 
                        "duration": duration,
                        "description": f"Focus on {name.strip()}"
                    })
                else:
                    roadmap_phases.append({"title": p, "description": "", "duration": ""})
            return {"phases": roadmap_phases}
        else:
            logger.warning("No phases found in tasks.json course_meta")
    except Exception as e:
        logger.error(f"Failed to load phases from tasks.json: {e}")

    # 2. Try AI-powered personalized roadmap
    try:
        ai_roadmap = generate_ai_roadmap(career)
        if ai_roadmap and ("phases" in ai_roadmap or isinstance(ai_roadmap, list)):
            return ai_roadmap
    except Exception as e:
        logger.error(f"AI Roadmap Failed: {e}")

    # 3. Fallback to local roadmap.json
    return get_fallback_roadmap(career)


def get_fallback_roadmap(career: str) -> dict | list:
    """Provides a safe predefined fallback roadmap if AI fails."""
    roadmaps = load_json("roadmap.json")
    if not roadmaps:
        # Ultimate fallback
        return {
            "phases": [
                {"title": "Phase 1: Basics", "description": "Learn the foundational concepts."},
                {"title": "Phase 2: Intermediate", "description": "Build small projects to understand tools."},
                {"title": "Phase 3: Advanced", "description": "Deep dive into architecture and performance."}
            ]
        }

    career_lower = career.lower()
    if career in roadmaps:
        return roadmaps[career]

    for key, val in roadmaps.items():
        if career_lower in key.lower() or key.lower() in career_lower:
            return val

    # If nothing matched, assign the first item or the ultimate fallback
    first_val = list(roadmaps.values())[0] if roadmaps else None
    if first_val:
        return first_val

    return {"error": f"Roadmap not found for '{career}'. Available: {list(roadmaps.keys())}"}
