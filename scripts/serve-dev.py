"""Local static server with the fixed Vercel parcel rewrites (no arbitrary proxy)."""
import json
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from urllib.request import urlopen, Request

ROOT = Path(__file__).resolve().parents[1]
ROUTES = {r['source']: r['destination'] for r in json.loads((ROOT / 'vercel.json').read_text())['rewrites']}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_GET(self):
        path = urlsplit(self.path)
        if path.path.startswith('/parcel-service/'):
            dest = ROUTES.get(path.path)
            if not dest:
                self.send_error(404)
                return
            try:
                with urlopen(Request(dest + '?' + path.query, headers={'User-Agent': 'Anschluss1/1.0'}), timeout=25) as response:
                    body = response.read(5000001)
                    self.send_response(200)
                    self.send_header('Content-Type', response.headers.get('Content-Type', 'application/xml'))
                    self.end_headers()
                    self.wfile.write(body)
            except Exception:
                self.send_error(502)
            return
        super().do_GET()
if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 8788), Handler).serve_forever()
