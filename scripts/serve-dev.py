"""Local static server with the fixed Vercel parcel rewrites (no arbitrary proxy)."""
import json
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from urllib.request import urlopen, Request

ROOT = Path(__file__).resolve().parents[1]
def routes():
    return {r['source']: r['destination'] for r in json.loads((ROOT / 'vercel.json').read_text())['rewrites']}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def do_POST(self):
        if self.path != '/operator-service':
            self.send_error(404)
            return
        size = int(self.headers.get('Content-Length', '0'))
        if size < 1 or size > 12000:
            self.send_error(400)
            return
        try:
            request = Request(routes()[self.path], data=self.rfile.read(size), headers={'Content-Type': 'application/json', 'User-Agent': 'Anschluss1/1.0'})
            with urlopen(request, timeout=20) as response:
                body = response.read(1000000)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(body)
        except Exception:
            self.send_error(502)

    def do_GET(self):
        path = urlsplit(self.path)
        if path.path.startswith('/parcel-service/'):
            dest = routes().get(path.path)
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
