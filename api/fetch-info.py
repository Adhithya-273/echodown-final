# File: api/fetch-info.py (Diagnostic Test)
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Send a successful response with a simple message
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*') # Add CORS header
        self.end_headers()
        
        response_data = {
            "success": True,
            "message": "Hello from the Python backend! The routing is working."
        }
        
        self.wfile.write(json.dumps(response_data).encode('utf-8'))
        return
