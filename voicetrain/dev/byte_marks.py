#!/usr/bin/env python3
"""Add byte ranges to a lesson's marks.json so the player can fetch single steps with HTTP Range.

The lesson tracks are VBR MP3, so seconds do not map linearly to bytes. This walks the MPEG
frames of each track and, for every item, writes ``<lang>_bytes = [start, end)`` on frame
boundaries that cover ``<lang>_start..<lang>_end``, plus ``<lang>_cut = [t0, t1]``: the seconds
those frames actually hold. Concatenated slices play as one gapless MP3 stream.

Usage: python3 voicetrain/dev/byte_marks.py voicetrain/audio/lessons/2
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

LANGS = ("sv", "uk", "en")
_BITRATE = {  # Layer III, kbps by version id
    3: (0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320),
    2: (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
    0: (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160),
}
_RATE = {3: (44100, 48000, 32000), 2: (22050, 24000, 16000), 0: (11025, 12000, 8000)}


class Track:
    """Audio frames of one MP3 file: byte offsets and the timeline they cover."""

    def __init__(self, data: bytes) -> None:
        self.offsets: list[int] = []
        self.sizes: list[int] = []
        pos = _id3_size(data)
        while pos + 4 <= len(data):
            head = struct.unpack(">I", data[pos : pos + 4])[0]
            if head >> 21 != 0x7FF:
                raise ValueError(f"byte_marks: lost MPEG frame sync at byte {pos}")
            ver, layer = (head >> 19) & 3, (head >> 17) & 3
            if layer != 1 or ver == 1:
                raise ValueError(f"byte_marks: not an MPEG Layer III frame at byte {pos}")
            rate = _RATE[ver][(head >> 10) & 3]
            samples = 1152 if ver == 3 else 576
            size = samples // 8 * _BITRATE[ver][(head >> 12) & 15] * 1000 // rate + ((head >> 9) & 1)
            self.offsets.append(pos)
            self.sizes.append(size)
            self.frame_sec = samples / rate
            pos += size
        if pos != len(data):
            raise ValueError("byte_marks: truncated last frame")
        first = data[self.offsets[0] : self.offsets[0] + self.sizes[0]]
        if b"Xing" in first or b"Info" in first:  # VBR header frame holds no audio
            del self.offsets[0], self.sizes[0]

    def cut(self, start: float, end: float) -> tuple[list[int], list[float]]:
        first = max(0, int(start / self.frame_sec))
        last = min(len(self.offsets) - 1, max(first, -int(-end // self.frame_sec) - 1))
        byte_range = [self.offsets[first], self.offsets[last] + self.sizes[last]]
        seconds = [round(first * self.frame_sec, 3), round((last + 1) * self.frame_sec, 3)]
        return byte_range, seconds


def _id3_size(data: bytes) -> int:
    if data[:3] != b"ID3":
        return 0
    s = data[6:10]
    return 10 + ((s[0] & 127) << 21 | (s[1] & 127) << 14 | (s[2] & 127) << 7 | (s[3] & 127))


def add_byte_marks(doc: dict, tracks: dict[str, Track]) -> dict:
    for item in doc["items"]:
        for lang, track in tracks.items():
            start, end = item.get(f"{lang}_start"), item.get(f"{lang}_end")
            if start is None or end is None:
                continue
            item[f"{lang}_bytes"], item[f"{lang}_cut"] = track.cut(start, end)
    doc["byte_marks"] = {lang: {"frame_sec": t.frame_sec, "frames": len(t.offsets)} for lang, t in tracks.items()}
    return doc


def main(lesson_dir: Path) -> None:
    marks = lesson_dir / "marks.json"
    doc = json.loads(marks.read_text(encoding="utf-8"))
    tracks = {}
    for lang in LANGS:
        name = doc.get(f"{lang}_file")
        if name and (lesson_dir / name).is_file():
            tracks[lang] = Track((lesson_dir / name).read_bytes())
    add_byte_marks(doc, tracks)
    marks.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{marks}: byte ranges for {', '.join(tracks)}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
