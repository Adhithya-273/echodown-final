# File: api/fetch-info.py
from flask import Flask, request, jsonify
from yt_dlp import YoutubeDL
import time

app = Flask(__name__)

# Helper function to format seconds into HH:MM:SS
def format_duration(seconds):
    if seconds is None:
        return 'N/A'
    return time.strftime('%H:%M:%S', time.gmtime(seconds))

@app.route('/api/fetch-info', methods=['GET'])
def fetch_info():
    url = request.args.get('url')
    if not url:
        return jsonify({"success": False, "error": "Missing YouTube URL."}), 400

    try:
        # Use yt-dlp to extract information
        with YoutubeDL({'quiet': True}) as ydl:
            info_dict = ydl.extract_info(url, download=False)
            
            response_data = {
                "type": "video",
                "id": info_dict.get("id"),
                "title": info_dict.get("title"),
                "thumbnail": info_dict.get("thumbnail"),
                "duration": format_duration(info_dict.get("duration")),
            }
            
            return jsonify({"success": True, "data": response_data})

    except Exception as e:
        print(f"--- DETAILED FETCH ERROR --- \n{e}\n--- END ERROR ---")
        return jsonify({"success": False, "error": f"Failed to get video info: {str(e)}"}), 500

# This is the entry point for Vercel
def handler(request, context):
    return app(request, context)