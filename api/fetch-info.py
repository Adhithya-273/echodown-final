# File: api/fetch-info.py (Flask-less version)
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
from yt_dlp import YoutubeDL
import time

# Helper function to format seconds into HH:MM:SS
def format_duration(seconds):
    if seconds is None:
        return 'N/A'
    return time.strftime('%H:%M:%S', time.gmtime(seconds))

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Manually parse query parameters from the URL path
        query_components = parse_qs(urlparse(self.path).query)
        url = query_components.get('url', [None])[0]

        if not url:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "Missing YouTube URL."}).encode('utf-8'))
            return

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
                
                # Send a successful response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "data": response_data}).encode('utf-8'))

        except Exception as e:
            print(f"--- DETAILED FETCH ERROR --- \n{e}\n--- END ERROR ---")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": f"Failed to get video info: {str(e)}"}).encode('utf-8'))
        
        return