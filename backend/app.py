import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# ─── Logging Setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ─── App Initialization ────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# ─── Register Blueprints ───────────────────────────────────────────────────────
from routes.career_routes import career_bp
from routes.roadmap_routes import roadmap_bp
from routes.task_routes import task_bp
from routes.mentor_routes import mentor_bp
from routes.progress_routes import progress_bp
from routes.tts_routes import tts_bp

app.register_blueprint(career_bp, url_prefix="/api")
app.register_blueprint(roadmap_bp, url_prefix="/api")
app.register_blueprint(task_bp, url_prefix="/api")
app.register_blueprint(mentor_bp, url_prefix="/api")
app.register_blueprint(progress_bp, url_prefix="/api")
app.register_blueprint(tts_bp, url_prefix="/api")


# ─── Health Check ──────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "message": "AI Mentor Career Backend is running 🚀",
        "version": "2.0",
        "endpoints": [
            "POST /api/get_career",
            "POST /api/get_colleges",
            "POST /api/get_roadmap",
            "POST /api/ai_daily_tasks",
            "POST /api/ai_mentor",
            "POST /api/submit_assignment",
            "POST /api/ai_feedback",
            "POST /api/update_progress",
            "GET  /api/get_progress/<user_id>"
        ]
    }), 200


# ─── Global Error Handlers ─────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found", "hint": "Check GET / for available endpoints"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed for this endpoint"}), 405


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500


# ─── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info(f"Starting AI Mentor Backend on port {port}")
    app.run(debug=True, port=port)
