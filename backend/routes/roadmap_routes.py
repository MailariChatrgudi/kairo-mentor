from flask import Blueprint, request, jsonify
from utils.roadmap_logic import get_roadmap

roadmap_bp = Blueprint("roadmap", __name__)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/get_roadmap
# Input : { "career": "Software Engineer" }
# Output: Structured week-by-week roadmap with phases, resources, milestones
# ─────────────────────────────────────────────────────────────────────────────
@roadmap_bp.route("/get_roadmap", methods=["POST"])
def get_career_roadmap():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    career = data.get("career", "").strip()
    if not career:
        return jsonify({"error": "'career' field is required"}), 400

    try:
        roadmap = get_roadmap(career)

        if "error" in roadmap:
            return jsonify({"success": False, **roadmap}), 404

        return jsonify({
            "success": True,
            "career": career,
            "roadmap": roadmap
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
