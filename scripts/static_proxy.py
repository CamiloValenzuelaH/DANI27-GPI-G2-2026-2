#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import urllib.parse
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5174
BACKEND = sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:8001'
DIST = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Serve static files from dist
        if path.startswith('/api/'):
            return ''
        p = path.split('?',1)[0]
        p = p.split('#',1)[0]
        full = os.path.join(DIST, p.lstrip('/'))
        if os.path.isdir(full):
            for index in ("index.html", "index.htm"):
                index_file = os.path.join(full, index)
                if os.path.exists(index_file):
                    return index_file
        if os.path.exists(full):
            return full
        # fallback to index.html for SPA
        return os.path.join(DIST, 'index.html')

    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_proxy()
            return
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def handle_proxy(self):
        target = BACKEND.rstrip('/') + self.path
        try:
            req = urllib.request.Request(target, headers=self.headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                self.send_response(resp.getcode())
                for k, v in resp.getheaders():
                    if k.lower() == 'transfer-encoding':
                        continue
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(resp.read())
        except Exception as e:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

if __name__ == '__main__':
    os.chdir(DIST)
    handler = ProxyHandler
    with socketserver.ThreadingTCPServer(('', PORT), handler) as httpd:
        print(f"Serving {DIST} on port {PORT}, proxying /api to {BACKEND}")
        httpd.serve_forever()
