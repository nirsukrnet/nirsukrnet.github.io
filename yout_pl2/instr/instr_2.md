## Clone Firebase data: db_youtube1 → db_youtube2

Goal: copy all data from Firebase root `db_youtube1/` into a new root `db_youtube2/`.

This is useful when you create `yout_pl2.html` and want it to start with the same saved transcripts + reference videos as `yout_pl1`.

---

## Script
Location:
- `service_test/python/clone_youtube_db_root.py`

What it does:
- Auto-detects where `db_youtube1` lives and clones it to `db_youtube2`.

Why auto-detect is needed:
- The YouTube JS modules use paths like `../db_youtube1/...`.
- That `../` escapes the normal `data_base2` root, so the data may be stored at the RTDB top-level `db_youtube1/...`.

Safety:
- By default it refuses to overwrite `db_youtube2` if it already exists.
- Use `--overwrite` only if you really want to replace destination.

---

## Run

Default (db_youtube1 → db_youtube2):
```bash
python service_test/python/clone_youtube_db_root.py
```

If you want to force a location:
- Under `data_base2/`:
```bash
python service_test/python/clone_youtube_db_root.py --base-root data_base2
```
- Top-level root:
```bash
python service_test/python/clone_youtube_db_root.py --base-root ""
```

Explicit roots:
```bash
python service_test/python/clone_youtube_db_root.py --from db_youtube1 --to db_youtube2
```

Overwrite destination (danger):
```bash
python service_test/python/clone_youtube_db_root.py --overwrite
```

---

## After cloning

- Open `yout_pl2.html` and confirm:
  - reference videos list shows data from `db_youtube2/ref_youtube_videos`
  - transcript load/save works under `db_youtube2/youtube_transcripts/{videoId}`


