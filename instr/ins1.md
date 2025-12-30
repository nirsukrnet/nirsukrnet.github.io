explain what the differences between this
to aproaches
   "./assets/js/output_oneaudio/oneaudio_text.js",
    "./assets/js/output_audio_phrase/output_audio_text.js",

for each function in short 1=4 lines for each function.

and put it explanation into this file bellow

---

## Differences: `oneaudio_text.js` vs `output_audio_text.js`

### `loadContentData()`
- **oneaudio_text.js**: Renders from `gv.sts.audio_phrases` (no `audio_phrases_with_trans` support). Audio is handled “globally” (no `<audio>` element per row); play buttons get the whole `seg` object.
- **output_audio_text.js**: Prefers `gv.sts.audio_phrases_with_trans` (falls back to `audio_phrases`). Creates a real `<audio>` element per row with `src = phrase_audio/<file_name>` and play buttons receive that audio element.

### `applyFilter()` (inner function)
- **Both**: Same filter behavior: supports `p123` jump-to-row by button text, otherwise substring search across `sv + translation`.
- **Difference**: None significant; only the rendered row content differs because audio rendering differs.

### `render(list)` (inner function)
- **Both**: Clears `#list` and appends each row element.
- **Difference**: None; it just renders whatever rows were built.

### `makeRow(seg, idx)` (inner function)
- **oneaudio_text.js**: Does NOT create `<audio>`; keeps an empty “audio row” container. Calls `addButtonsPlay_oap(playBlockEl, seg, idx)` and uses `(no____translation)` placeholder.
- **output_audio_text.js**: Creates `<audio controls preload="none">` with encoded file name; calls `addButtonsPlay_oap(playBlockEl, audioEl, idx)` and uses `(no translation)` placeholder.

---

## Make `oneaudio_text.js` use `audio_phrases_with_trans`

### Goal
Use the OneAudio (single track) UI, but show translations from `text_trans_phrases` via `gv.sts.audio_phrases_with_trans`.

### Change
- In `loadContentData()`, set `rows_phrases` to prefer `gv.sts.audio_phrases_with_trans` when it exists; fallback to `gv.sts.audio_phrases`.

### Requirement
- The loader must populate `gv.sts.audio_phrases_with_trans` (in this repo that happens in `db_connswmp3.js` after `Load_DB3_Lesson_Phrases`).



