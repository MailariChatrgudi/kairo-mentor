import logging
from utils.common import load_json

logger = logging.getLogger(__name__)

def suggest_career(
    interest: str,
    goal: str,
    rank: int,
    student_type: str = "",
    financial_background: str = "",
    preferred_language: str = "English",
    current_year: str = "",
    iks_answers: dict = None
) -> dict:
    """
    Match student interest + goal to a career category using AI (with keyword fallback).
    Includes IKS answers to generate "Why this career suits you".
    Returns suggested career, branch, rank tier, and related data.
    """
    from utils.ai_helper import generate_career_suggestion

    if iks_answers is None:
        iks_answers = {}

    # 1. Try AI-powered suggestion
    try:
        ai_data = generate_career_suggestion(interest, goal, iks_answers)
        if ai_data:
            best_category = ai_data.get("suggested_category", "IT")
            valid_categories = ["IT", "Core", "Govt", "Startup", "Business"]
            if best_category not in valid_categories:
                best_category = "IT"

            rank_tier = classify_rank(rank)
            recommended_branch = ai_data.get("recommended_branch", "Computer Science")

            return {
                "suggested_category": best_category,
                "suggested_careers": ai_data.get("suggested_careers", []),
                "recommended_branch": recommended_branch,
                "all_branches": [recommended_branch],
                "description": ai_data.get("reason", ""),
                "why_suited": ai_data.get("why_suited", "This career aligns with your goals and interests."),
                "pros": ai_data.get("pros", []),
                "cons": ai_data.get("cons", []),
                "avg_package": ai_data.get("avg_package", ""),
                "top_companies": ai_data.get("top_companies", []),
                "rank_tier": rank_tier,
                "score_breakdown": {"AI_Powered": True}
            }
    except Exception as e:
        logger.error(f"AI Career Suggestion Failed: {e}")

    # 2. Fallback to Keyword Scoring Mode (if AI fails logic)
    return get_fallback_career(interest, goal, rank)


def get_fallback_career(interest: str, goal: str, rank: int) -> dict:
    """Provides a safe predefined fallback career if AI fails."""
    career_paths = load_json("career_paths.json")
    if not career_paths: 
        # Ultimate fallback to prevent crashes if JSON files are missing
        career_paths = {
            "IT": {
                "careers": ["Software Engineer", "Data Analyst", "Web Developer"],
                "branches": ["Computer Science", "Information Technology"],
                "description": "Information Technology fallback",
                "avg_package": "6-12 LPA",
                "top_companies": ["TCS", "Infosys", "Wipro"]
            }
        }

    interest_lower = interest.lower()
    goal_lower = goal.lower()

    scores = {}
    for category, data in career_paths.items():
        score = 0
        for kw in data.get("interest_keywords", []):
            if kw in interest_lower:
                score += 2
        for kw in data.get("goal_keywords", []):
            if kw in goal_lower:
                score += 3
        scores[category] = score

    best_category = max(scores, key=scores.get) if scores else "IT"
    if scores.get(best_category, 0) == 0:
        best_category = "IT"

    career_data = career_paths.get(best_category, career_paths.get(list(career_paths.keys())[0]))
    branches = career_data.get("branches", ["Computer Science"])
    rank_tier = classify_rank(rank)
    
    if rank and rank > 50000 and len(branches) > 1:
        recommended_branch = branches[-1]
    else:
        recommended_branch = branches[0]

    return {
        "suggested_category": best_category,
        "suggested_careers": career_data.get("careers", ["Software Engineer", "Data Analyst"])[:3],
        "recommended_branch": recommended_branch,
        "all_branches": branches,
        "description": career_data.get("description", "Fallback description"),
        "why_suited": "Based on our fallback keyword matching, this industry fits your input profile.",
        "avg_package": career_data.get("avg_package", ""),
        "top_companies": career_data.get("top_companies", []),
        "rank_tier": rank_tier,
        "score_breakdown": scores
    }


def classify_rank(rank: int) -> str:
    """Classify JEE rank into admission tier."""
    if not rank or rank <= 0:
        return "Rank not provided"
    if rank <= 1000:
        return "Excellent — IIT (Top) eligible"
    elif rank <= 5000:
        return "Very Good — IIT / NIT Top eligible"
    elif rank <= 25000:
        return "Good — NIT / IIIT eligible"
    elif rank <= 75000:
        return "Average — Good State Colleges eligible"
    else:
        return "Below Average — Private Colleges / Lateral entry"


def get_colleges_for_rank(rank: int, branch: str) -> list:
    """Filter colleges by rank cutoff and branch availability."""
    colleges = load_json("colleges.json")
    if not colleges: return []
    
    branch_lower = branch.lower()
    results = []

    for college in colleges:
        cutoff = college.get("rank_cutoff", {})
        general_cutoff = cutoff.get("general", 999999)
        rank_matches = (rank <= general_cutoff * 1.25)
        branch_matches = any(
            branch_lower in b.lower() or b.lower() in branch_lower
            for b in college.get("branches", [])
        )
        if rank_matches and branch_matches:
            results.append(college)

    results.sort(key=lambda x: x.get("rating", 0), reverse=True)
    return results[:10]
