"""Local player server: Firebase stays out, and the beta page is wired to its own data."""

from __future__ import annotations

import json
import sys
import threading
import unittest
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from local_server import SITE_ROOT, make_server  # noqa: E402

BETA = "/voicetrain/beta/voicetrain.html"


class LocalServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = make_server(0)
        cls.port = cls.server.server_address[1]
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()

    def get(self, path: str) -> tuple[str, object]:
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}{path}") as resp:
            return resp.read().decode("utf-8", "replace"), resp.headers

    def test_server_listens_only_on_this_machine(self) -> None:
        self.assertEqual(self.server.server_address[0], "127.0.0.1")

    def test_firebase_client_is_replaced_and_has_no_credentials(self) -> None:
        body, _ = self.get("/yout_pl2/yu2_global_var.js")
        self.assertIn("Local replacement", body)
        for word in ("password", "apiKey", "firebaseio", "googleapis"):
            self.assertNotIn(word, body)

    def test_pages_stay_on_this_server_and_block_outside_requests(self) -> None:
        for path in (BETA, "/voicetrain/voicetrain.html"):
            body, headers = self.get(path)
            self.assertIn('<base href="/voicetrain/" />', body)
            self.assertNotIn("nirsukrnet.github.io/voicetrain/\"", body)
            self.assertIn("connect-src 'self'", headers["Content-Security-Policy"])

    def test_catalog_lists_local_lessons(self) -> None:
        body, _ = self.get("/__local/catalog.json")
        doc = json.loads(body)
        self.assertIn("11", doc["lessons"])
        self.assertEqual(doc["lessons"]["11"]["tag"], "LOCAL")

    def test_beta_page_is_the_published_player_with_its_own_storage(self) -> None:
        html = (SITE_ROOT / BETA.lstrip("/")).read_text(encoding="utf-8")
        self.assertIn('<base href="https://nirsukrnet.github.io/voicetrain/" />', html)
        self.assertIn("const VT_VERSION", html)
        self.assertIn("IS_BETA ? '_beta' : ''", html)
        self.assertIn("ui_state/voicetrain${CHANNEL_SUFFIX}", html)
        self.assertIn('id="btnPause"', html)


if __name__ == "__main__":
    unittest.main()
