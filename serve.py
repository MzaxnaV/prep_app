import http.server
import os
import posixpath
import sys
from urllib.parse import unquote, urlsplit

PORT = 5173
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

# Never let the browser hold onto these: index.html points at the current build's
# hashed assets, and sw.js is what evicts a bad cache. A stale copy of either
# leaves the app wedged on an old build with no way to recover.
NO_STORE = {'/index.html', '/sw.js', '/manifest.json'}


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    # Keep-alive so the browser's parallel asset requests aren't serialised
    protocol_version = 'HTTP/1.1'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def _resolve(self):
        """Rewrite the path to /index.html for SPA routes only.

        Falling back for *every* missing path means a stale /assets/*.js request
        gets index.html back with a 200 and Content-Type: text/html. The module
        script then fails silently and the service worker caches the HTML under
        the .js URL. Only routes -- extensionless paths -- get the fallback;
        anything that looks like a file is allowed to 404.
        """
        path = unquote(urlsplit(self.path).path)
        rel = posixpath.normpath(path).lstrip('/')
        target = os.path.join(DIST, rel.replace('/', os.sep))

        if os.path.isfile(target):
            return

        # An extension means a real file was expected -- let it 404.
        if posixpath.splitext(posixpath.basename(path))[1]:
            return

        self.path = '/index.html'

    def do_GET(self):
        self._resolve()
        super().do_GET()

    def do_HEAD(self):
        self._resolve()
        super().do_HEAD()

    def end_headers(self):
        if self.path in NO_STORE:
            self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        pass  # Suppress request logs to keep the process quiet


if __name__ == '__main__':
    if len(sys.argv) > 1:
        PORT = int(sys.argv[1])
    server = http.server.ThreadingHTTPServer(('', PORT), SPAHandler)
    print(f'Serving on http://localhost:{PORT}')
    server.serve_forever()
