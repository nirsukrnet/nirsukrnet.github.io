## Python snapshot tool: verify Firebase DB3 structure

### Goal
Create a Python script that downloads a snapshot from Firebase DB3 and saves it as a JSON file under:

`service_test/js/snapshots/`

This replaces the need to run browser/JS “service_test” pages when you only want a database snapshot for inspection or debugging.

### Python environment
Use the existing venv activator:

`C:\Python\AuTr\activate.cmd`

Notes:
- The venv is located under `C:\Python\AuTr\venv\...`.
- `C:\Python\AuTr\Scripts\Activate.ps1` does not exist (that’s why PowerShell shows “not recognized”).

### What to snapshot
At minimum, snapshot these DB3 paths:

1) Settings (per app Owner last lesson):
- `data_base3/settings/default_user/settingsData`

Expected keys example:

```json
{
  "lastLessonId": {
    "mp3_playing": "lesson_1",
    "trans_block": "lesson_2"
  },
  "playbackSpeed": 1,
  "theme": "dark"
}
```

Optional (useful for cross-checking):
- `data_base3/ref_lessons_audio_phrases`
- `data_base3/audio_phrases`

### Output location and naming
Write snapshot JSON files into:

`C:\Python\AuTr\html\service_test\js\snapshots\`

Recommended filename format:
- `tests_and_diagnostic_YYYYMMDD_HHMMSS.json`

### Output JSON structure
The script writes a diagnostic JSON (pretty-printed) with this structure:

```json
{
  "snapshot_diagnostic": {
    "snapshot": {
      "path": "data_base3/settings/default_user/settingsData",
      "fetched_at": "YYYY-MM-DDTHH:MM:SS",
      "data": {},
      "expected_data": {}
    },
    "errors": {
      "warnings": [],
      "received_top_level_keys": []
    },
    "scripts": {
      "python": {
        "script_path": "...",
        "entry": "main(argv)",
        "purpose": "..."
      },
      "js": [
        {
          "path": "...",
          "functions": [],
          "purpose": "..."
        }
      ]
    }
  }
}
```

Notes:
- `snapshot.data` is what Firebase actually returned.
- `snapshot.expected_data` is what you expect for that path (used for human inspection; the script can keep it empty if you don't need it).

### Script location
Create a Python script under:

`C:\Python\AuTr\html\service_test\python\snapshot_db3_settings.py`

### Requirements
- Read-only: do not modify Firebase (no PUT/PATCH/DELETE).
- Save pretty-printed JSON.
- Print a short console summary:
  - output filename
  - whether `lastLessonId.mp3_playing` starts with `lesson_`
  - whether `lastLessonId.trans_block` starts with `lesson_`

### Run
From a terminal:

1) Activate venv:

If you use **PowerShell**:
- `cd C:\Python\AuTr\html`
- `& "..\venv\Scripts\Activate.ps1"`

If PowerShell blocks scripts:
- `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- `& "..\venv\Scripts\Activate.ps1"`

If you use **cmd.exe**:
- `C:\Python\AuTr\activate.cmd`

2) Go to project folder (recommended so relative paths also work):
- `cd C:\Python\AuTr\html`

3) Run script:
- `python service_test\python\snapshot_db3_settings.py`

Optional:
- Snapshot another path: `python service_test\python\snapshot_db3_settings.py --path data_base3/ref_lessons_audio_phrases`
- Write to a specific output folder: `python service_test\python\snapshot_db3_settings.py --out-dir service_test\js\snapshots`

Example `expected_data` for settings path:

```json
{
  "lastLessonId": {
    "mp3_playing": "lesson_1",
    "trans_block": "lesson_2"
  },
  "playbackSpeed": 1,
  "theme": "dark"
}
```
