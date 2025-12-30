## Test page: verify DB3 `settingsData` structure

### Goal
Create a tiny “service test” page that reads a snapshot from Firebase DB3 and shows it on screen, so we can verify the structure is correct (especially `lastLessonId/{Owner}` values like `lesson_1`).

### Target Firebase structure to verify
Path:

`data_base3/settings/default_user/settingsData`

Expected keys (example):

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

Notes:
- `lastLessonId.{Owner}` must store the DB3 lesson key (`json_key_item`), e.g. `"lesson_1"`.
- This test page is read-only (no writes).

### Files to create
1) HTML page:
- `service_test/test_settings.html`

2) JS script:
- `service_test/js/test_service/test_settings.js`

### Requirements for `test_settings.html`
- Include a simple container, for example:
  - status line (loading / error / ok)
  - `<pre>` block with pretty-printed JSON
- Load the JS file `service_test/js/test_service/test_settings.js`.

### Requirements for `test_settings.js`
It must:

1) Fetch the settings snapshot from Firebase
- Firebase RTDB path (logical): `data_base3/settings/default_user/settingsData`
- Request URL path used by our existing helpers (relative from `service_test/*.html` pages): `../data_base3/settings/default_user/settingsData` (GET)

2) Render it into the page
- Show:
  - `settingsData.lastLessonId`
  - `settingsData.playbackSpeed`
  - `settingsData.theme`
- Also print the raw JSON (pretty-printed) so we can see any extra fields.

3) Validate the important fields
- If `lastLessonId.mp3_playing` exists and does NOT start with `lesson_`, show a warning.
- If `lastLessonId.trans_block` exists and does NOT start with `lesson_`, show a warning.

### Implementation hint (recommended)
If possible, reuse the same request helper already used by the app (so auth/paths behave the same):
- `gv.URL_DS.requestData_By_URL_Path(...)` OR the wrapper used inside `assets/js/db_connswmp3.js`.

If you do not load those helpers on the service test page, then implement a minimal `fetch()` call that matches how your Firebase REST calls are done in the main app.

### Use the same loader logic as `service_test/test_service.html`
Do not invent a new loading approach for this test page — copy the pattern from:

- `service_test/test_service.html`
- `service_test/js/test_service/main_test_loadscripts.js`

That pattern already:
- Loads the “service_test local” copies of `global_var.js` and `db_connswmp3.js`
- Uses the same relative URL convention (`../data_base3/...`) for DB3 requests

Recommended approach for `test_settings.html`:
- Include `./js/test_service/main_test_loadscripts.js` (same as `test_service.html`).
- Add your new script to the loader list in `main_test_loadscripts.js` (for example, append `./js/test_service/test_settings.js`).

Important: because `test_settings.html` will be located in `service_test/`, the correct request addUrl prefix to DB3 is `../data_base3/...` (one folder up).
