## Store/restore selected lesson (Firebase, per app Owner)

### Why (replace localStorage)
We do **not** use `localStorage` for the “last selected lesson” because some loaders clear localStorage (time‑gated clear). That makes the menu forget the selection.

Instead, we persist the last selected lesson into Firebase under `data_base3/settings/...`.

### Data structure in Firebase
Location:

`data_base3/settings/default_user/settingsData/lastLessonId`

Structure (per app Owner):

```json
{
  "data_base3": {
    "settings": {
      "default_user": {
        "settingsData": {
          "lastLessonId": {
            "mp3_playing": "lesson_1",
            "trans_block": "lesson_2"
          },
          "playbackSpeed": 1,
          "theme": "dark"
        }
      }
    }
  }
}
```

Notes:
- Value is stored as a **string** and should be the DB3 lesson key (`json_key_item`), e.g. `"lesson_1"`.
- This must match what the lessons menu uses as `data-lesson-id`, and what `Load_DB3_Lesson_Phrases(id)` can load.

### Owner (which app is writing)
Each page defines its Owner so the same user can have different “last lesson” per app.

Examples:
- `mp3.html` → `window.OAP_OWNER = "mp3_playing"`
- `transl.html` → `window.OAP_OWNER = "trans_block"`

### Functions
Implemented in [assets/js/db_connswmp3.js](assets/js/db_connswmp3.js):

- `Save_To_FBDB_Current_Lesson(Lesson_ID, Owner)`
  - Writes: `../data_base3/settings/default_user/settingsData/lastLessonId/{Owner}` (PUT)
  - Payload: `String(Lesson_ID)`

- `Load_From_FBDB_Current_Lesson(Owner)`
  - Reads: `../data_base3/settings/default_user/settingsData/lastLessonId/{Owner}` (GET)
  - Returns: lesson id as string, or `null`

### UI flow (menu)
Implemented in [assets/js/output_audio_phrase/oap_menu_less.js](assets/js/output_audio_phrase/oap_menu_less.js).

1) **On click lesson in menu**
- `setSelectedId(id)` updates `gv.sts.selected_lesson_id`.
- Saves it to Firebase via `Save_To_FBDB_Current_Lesson(id, Owner)`.
- Calls `Load_DB3_Lesson_Phrases(id)` where `id` is the DB3 lesson key (e.g. `"lesson_1"`).
- Calls `loadContentData()` to re-render UI.

2) **On page load (restore)**
- Menu renders first.
- Then it tries to restore `selected_lesson_id` from Firebase using `Load_From_FBDB_Current_Lesson(Owner)`.
- If restored id differs from current, it calls `setSelectedId(saved, { persist: false })`.
- It retries once more after `oap:data-loaded` (useful if Firebase auth/data wasn’t ready on the first attempt).

### DB3 structure: `audio_phrases` is nested (no `lesson_id` per item)
In Firebase DB3, phrases are stored **grouped**, not duplicated.

Location:

`data_base3/audio_phrases/{lessonKey}/{mp3FileKey}[]`

Example:

```json
{
  "data_base3": {
    "audio_phrases": {
      "lesson_1": {
        "mp3_file_0001": [
          {
            "start": 4.598,
            "end": 6.664,
            "intervals_id": 2,
            "text_id": "parttxt_1_txt1",
            "text_sv": "Lyssna och säg efter.",
            "text_en": "",
            "datetimetrans": ""
          }
        ]
      }
    }
  }
}
```

This means:
- **Lesson is defined by the path**: `lesson_1` (this is `json_key_item` from `ref_lessons_audio_phrases`).
- **MP3 file is defined by the path**: `mp3_file_0001` (key from `ref_mp3_files`).
- Each phrase item inside the array does **not** need a `lesson_id` field, because it’s already “inside” its lesson.

### Why this approach is better than storing `lesson_id` in every item
- No duplication: we don’t repeat `lesson_id: "lesson_1"` on every row.
- Safer keys: the DB path is the source of truth (avoids mismatches).
- Easy batching: loading one lesson is a single `GET` on `audio_phrases/lesson_1`.

### In-memory flattening (UI convenience)
In the browser we still create a flat list for rendering:

- `Load_DB3_Lesson_Phrases(lessonKey)` loads `data_base3/audio_phrases/{lessonKey}`.
- It selects the `mp3FileKey` (usually one file per lesson) and flattens the array into `gv.sts.audio_phrases`.
- During flattening, we add runtime fields for the UI:
  - `phrase.lesson_id = lessonKey` (used for filtering/highlight)
  - `phrase._lesson_key`, `phrase._file_key`, `phrase._index` (used when saving)

Important: these runtime fields are **not** part of the stored DB structure; they are only added on the client.

### Script load order (must be like this)
For “restore last lesson from Firebase” to work, the page must load scripts in this order:

1) `./assets/js/global_var.js`
- Defines `GlobalVars`, creates `window.gv`, and initializes `gv.sts`.

2) `./assets/js/db_connswmp3.js`
- Defines `Load_DB3_Lesson_Phrases()` (accepts `lesson_#` keys).
- Defines `Save_To_FBDB_Current_Lesson()` and `Load_From_FBDB_Current_Lesson()`.
- Loads DB3 lessons/phrases and dispatches `oap:data-loaded`.

3) UI scripts (render + controls)
- Any renderers that read `gv.sts.selected_lesson_id` / `gv.sts.audio_phrases_with_trans`.

4) `./assets/js/output_audio_phrase/oap_menu_less.js`
- Builds the lessons menu.
- Restores last selected lesson using `Load_From_FBDB_Current_Lesson(Owner)`.
- On selection, saves using `Save_To_FBDB_Current_Lesson(id, Owner)`.

Where this order is implemented:
- `mp3.html` / `oneaudio.html` use `./assets/js/main_loadscripts.js`.
- `transl.html` uses `./assets/js/help_js/trans_loadscripts.js` (adds translation UI scripts too, but still keeps `global_var.js` and `db_connswmp3.js` first).
