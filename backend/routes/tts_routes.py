import os
import httpx
from flask import Blueprint, request, Response, jsonify
from dotenv import load_dotenv

load_dotenv()

tts_bp = Blueprint("tts", __name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "2zRM7PkgwBPiau2jvVXc")

@tts_bp.route("/tts", methods=["POST"])
def text_to_speech():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Text is required"}), 400

    text = data["text"]

    if not ELEVENLABS_API_KEY:
        return jsonify({"error": "ElevenLabs API Key is missing. Please add it to your .env file."}), 401

    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                return jsonify({"error": f"ElevenLabs API error: {response.text}"}), response.status_code

            return Response(response.content, mimetype="audio/mpeg")

    except Exception as e:
        return jsonify({"error": str(e)}), 500
