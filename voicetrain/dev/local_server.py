#!/usr/bin/env python3
"""Run the voicetrain player locally with Firebase replaced, so real data cannot change.

Usage: python3 voicetrain/dev/local_server.py [port]
Open:  http://127.0.0.1:7072/voicetrain/beta/voicetrain.html
"""

from __future__ import annotations

import json
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = SITE_ROOT / "voicetrain" / "audio" / "lessons"
DEFAULT_PORT = 7072
FIREBASE_STUB = "/yout_pl2/yu2_global_var.js"
CATALOG_URL = "/__local/catalog.json"
# Blocks every request that leaves this server, including Firebase.
CSP = "default-src 'self' 'unsafe-inline' data: blob:; connect-src 'self'; base-uri 'self'"
_BASE_TAG = re.compile(rb"<base\s+href=\"[^\"]*\"\s*/?>")

STUB_JS = """// Local replacement for the Firebase client. State lives in this browser tab only.
class GlobalVars {
  constructor() {
    this.URL_DS = {
      idToken: 'local',
      GetObjForRequest: () => ({}),
      requestData_By_URL_Path: (req) => handle(req),
    };
  }
  SignIn_User() { return Promise.resolve(); }
}
function handle(req) {
  const path = String(req.addUrl);
  if (req.ametod === 'GET' && /ref_voice_(lessons|tags)$/.test(path)) {
    fetch('%s').then((r) => r.json()).then((doc) => req.CallBackFunction(doc), req.ErrorCallback);
    return;
  }
  const key = 'local_db:' + path;
  if (req.ametod === 'PUT') sessionStorage.setItem(key, JSON.stringify(req.vobj));
  req.CallBackFunction(JSON.parse(sessionStorage.getItem(key) || 'null'));
}
""" % CATALOG_URL


def lesson_catalog(lessons_dir: Path = LESSONS_DIR) -> dict:
    ids = sorted((p.parent.name for p in lessons_dir.glob("*/marks.json") if p.parent.name.isdigit()), key=int)
    lessons = {
        lesson_id: {
            "lesson_id": lesson_id,
            "short": f"Урок {lesson_id}",
            "title": "",
            "tag": "LOCAL",
            "order": int(lesson_id),
            "kind": "auto",
        }
        for lesson_id in ids
    }
    return {"lessons": lessons, "tags": {"LOCAL": {"label": "LOCAL", "order": 0}}}


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send(self, body: bytes, content_type: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path == FIREBASE_STUB:
            self._send(STUB_JS.encode("utf-8"), "text/javascript; charset=utf-8")
        elif path == CATALOG_URL:
            self._send(json.dumps(lesson_catalog()).encode("utf-8"), "application/json")
        elif path.startswith("/voicetrain/") and path.endswith(".html"):
            file = (SITE_ROOT / path.lstrip("/")).resolve()
            if not file.is_relative_to(SITE_ROOT) or not file.is_file():
                self.send_error(404)
                return
            # The published pages point <base> at the live site; keep them on this server.
            html = _BASE_TAG.sub(b'<base href="/voicetrain/" />', file.read_bytes())
            self._send(html, "text/html; charset=utf-8")
        else:
            super().do_GET()


def make_server(port: int = DEFAULT_PORT) -> ThreadingHTTPServer:
    handler = partial(Handler, directory=str(SITE_ROOT))
    return ThreadingHTTPServer(("127.0.0.1", port), handler)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    print(f"http://127.0.0.1:{port}/voicetrain/beta/voicetrain.html")
    make_server(port).serve_forever()
