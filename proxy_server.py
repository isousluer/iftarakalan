#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import json
from urllib.parse import urlparse, parse_qs

PORT = 8081

class CORSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS başlıkları ekle
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Proxy endpoint'i kontrol et
        if self.path.startswith('/api/proxy?url='):
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            target_url = params.get('url', [''])[0]
            
            if target_url:
                try:
                    # Hedef URL'e istek yap
                    with urllib.request.urlopen(target_url) as response:
                        data = response.read()
                        
                    # Başarılı yanıt
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(data)
                    return
                except Exception as e:
                    # Hata durumu
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    error = json.dumps({'error': str(e)}).encode()
                    self.wfile.write(error)
                    return
        
        # Normal dosya servisi
        super().do_GET()

with socketserver.TCPServer(("", PORT), CORSProxyHandler) as httpd:
    print(f"🚀 Proxy server başlatıldı: http://localhost:{PORT}")
    print(f"📡 Proxy endpoint: http://localhost:{PORT}/api/proxy?url=TARGET_URL")
    httpd.serve_forever()
