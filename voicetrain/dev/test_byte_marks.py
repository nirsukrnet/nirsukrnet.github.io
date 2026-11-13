"""Byte ranges for lesson steps: frame-aligned, inside the file, covering each step's seconds."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from byte_marks import Track, add_byte_marks  # noqa: E402
from local_server import LESSONS_DIR  # noqa: E402

LESSON = LESSONS_DIR / "2"


class ByteMarksTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.data = {lang: (LESSON / f"{lang}_auto.mp3").read_bytes() for lang in ("sv", "uk")}
        cls.tracks = {lang: Track(raw) for lang, raw in cls.data.items()}
        doc = json.loads((LESSON / "marks.json").read_text(encoding="utf-8"))
        cls.doc = add_byte_marks(doc, cls.tracks)

    def test_frames_skip_id3_and_vbr_header(self) -> None:
        for lang, track in self.tracks.items():
            self.assertEqual(track.frame_sec, 0.024)
            first = self.data[lang][track.offsets[0] : track.offsets[0] + track.sizes[0]]
            self.assertNotIn(b"Xing", first)
            self.assertNotEqual(self.data[lang][:3], first[:3])

    def test_every_step_range_is_frame_aligned_and_covers_its_seconds(self) -> None:
        for item in self.doc["items"]:
            for lang, track in self.tracks.items():
                start, end = item[f"{lang}_bytes"]
                t0, t1 = item[f"{lang}_cut"]
                self.assertIn(start, track.offsets)
                self.assertTrue(end == len(self.data[lang]) or end in track.offsets)
                self.assertEqual(self.data[lang][start], 0xFF)
                self.assertLessEqual(t0, item[f"{lang}_start"])
                self.assertGreaterEqual(t1 + 1e-9, item[f"{lang}_end"])
                self.assertLess(t1 - t0 - (item[f"{lang}_end"] - item[f"{lang}_start"]), 0.05)

    def test_summary_records_frame_length_per_track(self) -> None:
        self.assertEqual(self.doc["byte_marks"]["sv"]["frames"], len(self.tracks["sv"].offsets))

    def test_non_mp3_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            Track(b"not an mp3 file at all")


if __name__ == "__main__":
    unittest.main()
