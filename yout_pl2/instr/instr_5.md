# Constants for DB paths (`yu2_global_var.js`)

## Goal
Avoid hard-coded Firebase RTDB paths like `../db_youtube2/...` scattered across HTML/JS files.

Introduce a single place to keep **path constants**, so pages can reuse the same values and updates are easy.

---

## Where
Add a small constants holder in:

- `yout_pl2/yu2_global_var.js`

Expose it globally so other pages can use it:

- `window.YT_DB_CONST` (or similar)

---

## Required constants

### DB root
- `DB_YOUTUBE2_ROOT = '../db_youtube2'`

### Derived paths (recommended)
Define these as helpers derived from the root:
- `REF_LANGUAGES_SET = DB_YOUTUBE2_ROOT + '/ref_languages_set'`
- `REF_TAGS_SHORT = DB_YOUTUBE2_ROOT + '/ref_tags_short'`
- `YOUTUBE_TRANSCRIPTS = DB_YOUTUBE2_ROOT + '/youtube_transcripts'`
- `REF_YOUTUBE_VIDEOS = DB_YOUTUBE2_ROOT + '/ref_youtube_videos'`
- `UI_STATE_YOUT_PL2 = DB_YOUTUBE2_ROOT + '/ui_state/yout_pl2'`

---

## Usage rules
- In HTML/JS files, replace direct strings like `../db_youtube2/ref_tags_short` with the constant.
- Keep compatibility: if a page loads without the constants (older file), fall back to the old literal path.
	- Example pattern: `const ROOT = (window.YT_DB_CONST?.DB_YOUTUBE2_ROOT) || '../db_youtube2';`

---

## Scope
- Only refactor paths used by `yout_pl2` pages (`yout_pl2.html`, `yout_pl2_viewer.html`, `yout_pl2_ito_text.html`, and store modules).
- Do not change Firebase auth logic or request logic.
