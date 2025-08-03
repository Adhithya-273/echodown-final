# File: api/download-mp3.py
from flask import Flask, request, jsonify
from yt_dlp import YoutubeDL

app = Flask(__name__)

@app.route('/api/download-mp3', methods=['GET'])
def download_mp3():
    video_id = request.args.get('videoId')
    if not video_id:
        return jsonify({"success": False, "error": "Missing video ID."}), 400

    url = f"https://www.youtube.com/watch?v={video_id}"

    try:
        # yt-dlp options to get the best audio-only format
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]',
            'quiet': True,
        }

        with YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False)
            # The direct download URL is in the 'url' key of the extracted info
            download_url = info_dict.get("url")

            if not download_url:
                raise Exception("Could not find a suitable download link.")

            return jsonify({"success": True, "downloadUrl": download_url})

    except Exception as e:
        print(f"--- DETAILED DOWNLOAD ERROR --- \n{e}\n--- END ERROR ---")
        return jsonify({"success": False, "error": f"Failed to get download link: {str(e)}"}), 500

# This is the entry point for Vercel
def handler(request, context):
    return app(request, context)