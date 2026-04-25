from flask import Blueprint, request, jsonify
from utils.career_logic import suggest_career, get_colleges_for_rank, filter_colleges

career_bp = Blueprint("career", __name__)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/get_career
# Input : {
#   "interest": "IT",
#   "goal": "Job",
#   "rank": 12000,                     (optional / KCET rank for 12th passout)
#   "student_type": "Engineering Student",
#   "financial_background": "Medium",
#   "preferred_language": "English",
#   "current_year": "2nd Year"        (optional, engineering students)
# }
# Output: { success, data: { suggested_careers: [...], ... } }
# ─────────────────────────────────────────────────────────────────────────────
@career_bp.route("/get_career", methods=["POST"])
def get_career():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    interest             = (data.get("interest") or "").strip()
    goal                 = (data.get("goal") or "").strip()
    rank                 = data.get("rank", 0)
    student_type         = (data.get("student_type") or "").strip()
    financial_background = (data.get("financial_background") or "").strip()
    preferred_language   = (data.get("preferred_language") or "English").strip()
    current_year         = (data.get("current_year") or "").strip()
    iks_answers          = data.get("iks_answers", {})

    if not interest:
        return jsonify({"error": "'interest' field is required"}), 400
    if not goal:
        return jsonify({"error": "'goal' field is required"}), 400

    try:
        rank = int(rank) if rank else 0
    except (ValueError, TypeError):
        return jsonify({"error": "'rank' must be a valid integer"}), 400

    try:
        result = suggest_career(
            interest=interest,
            goal=goal,
            rank=rank,
            student_type=student_type,
            financial_background=financial_background,
            preferred_language=preferred_language,
            current_year=current_year,
            iks_answers=iks_answers
        )

        # Ensure suggested_careers is always a non-empty list
        careers = result.get("suggested_careers", [])
        if not careers:
            careers = _fallback_careers(interest, goal)
        result["suggested_careers"] = careers

        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _fallback_careers(interest: str, goal: str) -> list:
    """Return a hardcoded list based on interest when AI is unavailable."""
    mapping = {
        "IT":      ["Web Developer", "Software Engineer", "Data Analyst"],
        "Core":    ["Mechanical Engineer", "Civil Engineer", "Embedded Systems"],
        "Govt":    ["Govt Exams", "Defence Services", "PSU Engineer"],
        "Startup": ["Startup Founder", "Product Manager", "Full-Stack Developer"],
    }
    for key, careers in mapping.items():
        if key.lower() in interest.lower():
            return careers
    return ["Software Engineer", "Data Analyst", "Web Developer"]


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/get_colleges
# Input : { "rank": 12000, "branch": "Computer Science" }
# Output: Filtered list of colleges with ratings, pros, cons, placement
# ─────────────────────────────────────────────────────────────────────────────
@career_bp.route("/get_colleges", methods=["POST"])
def get_colleges():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    rank   = data.get("rank", 0)
    branch = data.get("branch", "").strip()

    if not branch:
        return jsonify({"error": "'branch' field is required"}), 400

    try:
        rank = int(rank) if rank else 0
    except (ValueError, TypeError):
        return jsonify({"error": "'rank' must be a valid integer"}), 400

    try:
        colleges = get_colleges_for_rank(rank, branch)
        return jsonify({
            "success": True,
            "rank": rank,
            "branch": branch,
            "total_colleges_found": len(colleges),
            "colleges": colleges
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/get_college_suggestions
# Input : { "rank": 12000, "exam_type": "KCET" }
# Output: Filtered list of colleges with match scores
# ─────────────────────────────────────────────────────────────────────────────
@career_bp.route("/get_college_suggestions", methods=["POST"])
def get_college_suggestions():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    rank = data.get("rank", 0)
    exam_type = data.get("exam_type", "KCET").strip()
    is_explorer = data.get("is_explorer", False)

    try:
        rank = int(rank) if rank else 0
    except (ValueError, TypeError):
        return jsonify({"error": "'rank' must be a valid integer"}), 400

    try:
        colleges = filter_colleges(user_rank=rank, exam_type=exam_type, is_explorer=is_explorer)
        return jsonify({
            "success": True,
            "rank": rank,
            "exam_type": exam_type,
            "is_explorer": is_explorer,
            "total_colleges_found": len(colleges),
            "colleges": colleges
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# GET /api/get_all_colleges - returns all colleges without rank filtering
@career_bp.route("/get_all_colleges", methods=["GET"])
def get_all_colleges():
    try:
        from utils.career_logic import load_json
        colleges = load_json("colleges.json")
        return jsonify({"success": True, "colleges": colleges or []}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
