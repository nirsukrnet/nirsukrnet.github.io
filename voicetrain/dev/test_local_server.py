"""Local player server: Firebase stays out, and the beta page is wired to its own data."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import threading
import unittest
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from local_server import LESSONS_DIR, SITE_ROOT, make_server  # noqa: E402

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

    def test_byte_range_returns_206_with_the_exact_slice(self) -> None:
        path = "/voicetrain/audio/lessons/2/marks.json"
        whole = (SITE_ROOT / path.lstrip("/")).read_bytes()
        req = urllib.request.Request(f"http://127.0.0.1:{self.port}{path}", headers={"Range": "bytes=10-19"})
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 206)
            self.assertEqual(resp.headers["Content-Range"], f"bytes 10-19/{len(whole)}")
            self.assertEqual(resp.read(), whole[10:20])

    def test_byte_range_past_the_end_is_416(self) -> None:
        req = urllib.request.Request(
            f"http://127.0.0.1:{self.port}/voicetrain/audio/lessons/2/marks.json",
            headers={"Range": "bytes=999999999-"},
        )
        with self.assertRaises(urllib.error.HTTPError) as err:
            urllib.request.urlopen(req)
        self.assertEqual(err.exception.code, 416)

    def test_beta_page_is_the_published_player_with_its_own_storage(self) -> None:
        html = (SITE_ROOT / BETA.lstrip("/")).read_text(encoding="utf-8")
        self.assertIn('<base href="https://nirsukrnet.github.io/voicetrain/" />', html)
        self.assertIn("const VT_VERSION", html)
        self.assertIn("IS_BETA ? '_beta' : ''", html)
        self.assertIn("ui_state/voicetrain${CHANNEL_SUFFIX}", html)
        self.assertIn('id="btnPause"', html)

    def test_beta_glue_batches_screen_and_byte_range_playback(self) -> None:
        html = (SITE_ROOT / BETA.lstrip("/")).read_text(encoding="utf-8")
        for needle in (
            '<script src="beta/glue_batches.js"></script>',
            'id="btnModeGlue"',
            'id="glueGo"',
            "const GLUE_DB = '../db_youtube2/ui_state/glue_batches'",
            "Перезаписати поточну чергу склейок",
            "Range: `bytes=${clip.bytes[0]}-${clip.bytes[1] - 1}`",
            "item.start - shift",
            "`▶ ${inPos.value || '1'}/${total}`",
            "readLessonFlag(LS_SKIP_KNOWN_KEY, true)",
            "btnPlayFromN.textContent = `Pause ${now}/${total}`",
            "li.addEventListener('dblclick', () => makeNext(index))",
            "state.jumpTo = -1",
            "elMediaLog.textContent = bits.join(' · ')",
        ):
            self.assertIn(needle, html)
        for gone in ("GLUED_ID", "buildGluedMarks", "useGlued"):
            self.assertNotIn(gone, html)
        self.assertFalse((SITE_ROOT / "voicetrain/beta/range_demo.html").exists())

    def test_glue_save_reads_the_document_before_put(self) -> None:
        html = (SITE_ROOT / BETA.lstrip("/")).read_text(encoding="utf-8")
        self.assertIn("change(GlueBatches.normalizeDoc(await requestByPath(GLUE_DB, 'GET', null)))", html)
        self.assertIn("saveGlue((doc) => GlueBatches.pushGeneration(doc, gen))", html)
        self.assertIn("saveGlue((doc) => GlueBatches.restoreGeneration(doc, gen.id))", html)

    @unittest.skipUnless(shutil.which("node"), "node is not installed")
    def test_firebase_stub_accepts_put_of_glue_batches(self) -> None:
        stub, _ = self.get("/yout_pl2/yu2_global_var.js")
        script = stub + """
const store = new Map();
globalThis.sessionStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
const ds = new GlobalVars().URL_DS;
const call = (ametod, vobj) => new Promise((resolve, reject) => ds.requestData_By_URL_Path(
  { addUrl: '../db_youtube2/ui_state/glue_batches', ametod, vobj, CallBackFunction: resolve, ErrorCallback: reject }));
(async () => {
  const doc = { current: { id: 'g1', batches: [] }, history: [] };
  const afterPut = await call('PUT', doc);
  const afterGet = await call('GET', null);
  console.log(JSON.stringify({ afterPut, afterGet }));
})();
"""
        out = subprocess.run(["node", "-e", script], capture_output=True, text=True, timeout=30, check=True)
        result = json.loads(out.stdout)
        self.assertEqual(result["afterPut"]["current"]["id"], "g1")
        self.assertEqual(result["afterGet"], result["afterPut"])

    def test_glue_module_is_served(self) -> None:
        body, _ = self.get("/voicetrain/beta/glue_batches.js")
        self.assertIn("window.GlueBatches", body.replace("root.GlueBatches", "window.GlueBatches"))

    def test_every_auto_lesson_has_byte_marks(self) -> None:
        for marks in LESSONS_DIR.glob("*/marks.json"):
            self.assertIn("byte_marks", json.loads(marks.read_text(encoding="utf-8")), marks.parent.name)


if __name__ == "__main__":
    unittest.main()
