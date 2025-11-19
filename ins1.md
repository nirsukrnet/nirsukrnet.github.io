## Feature spec: Lessons menu + translation pipeline

This document describes two related features:

1) A lessons selector menu (top‑right icon) that updates the current lesson and reloads audio items.
2) A translation workflow that pulls phrase data from Firebase (not the hardcoded JSON), edits translations, and saves results back into the existing `audio_phrases` table.

---

## 1) Lessons selector menu (top‑right)

Goal
- Show an icon button in the top‑right corner.
- Clicking it opens a popup menu listing lessons (e.g., SW_Learn_Day_1-5).
- Selecting a lesson sets `gv.sts.selected_lesson_id`, persists it, and reloads the list of audio items.

Files
- JS: `assets/js/output_audio_phrase/oap_menu_less.js`
- CSS: `assets/css/oap_menu_less.css`

Behavior
- Build the menu list from `gv.sts.lessons_audio_phrases` when available; otherwise fall back to unique `lesson_id` values from `gv.sts.audio_phrases`.
- On select:
	- Update `gv.sts.selected_lesson_id` (normalize types: allow `1` or "1").
	- Persist the selection in `localStorage` (key: `oap:selected_lesson_id`).
	- Re‑render the content by calling `window.loadContentData()`.
- Visually highlight the active item and show its short label as a small badge on the button.
- Close the popup on outside click or Esc.

Wiring
- Ensure the menu CSS/JS are loaded by the page loader(s):
	- Audio page: `assets/js/main_loadscripts.js` should load `oap_menu_less.css` and `oap_menu_less.js`.
	- Translation page: `assets/js/help_js/trans_loadscripts.js` should load the same assets.
- After Firebase data finishes loading, the app dispatches `oap:data-loaded`. The menu listens and refreshes itself to show the latest lessons.

Acceptance
- The button is visible in the top‑right.
- The menu lists lessons with a reasonable label; fallback labels are `Lesson {id}`.
- Changing the lesson updates the audio list immediately and persists across reloads.

---

## 2) Translation workflow (Firebase‑based, not hardcoded)

Goal
- Replace `assets/js/help_js/sent_data_json.js` as the data source.
- Use the same Firebase data source already used by the audio page (see `assets/js/db_connswmp3.js`).
- Work with phrase fields `text_sv`, `text_en`, `text_uk`.
- Save finalized translations directly into the `audio_phrases` table (in‑place updates at the original row indices).

Data source
- Initialization/sign‑in and table access are already handled in `assets/js/db_connswmp3.js`.
- Tables are discovered via `tables_meta`; rows are fetched via `tables_rows/{index}/rows`.
- Use `Get_IndexOf_Table_By_Name('audio_phrases')` to locate the index for the source phrases.

Fields and mapping
- Source phrases (from `audio_phrases`) provide:
	- `lesson_id`, `file_name`, and text fields: `text_sv`, `text_en`, `text_uk` (if a language is missing, treat as empty string).
- Translation UI should read from these fields instead of the hardcoded structure with `content_uk/content_en/content_sv`.
- If the translation UI needs an internal buffer (e.g., `for_trans_data`), build it from the filtered `audio_phrases` of the selected lesson.

Saving results
- File to modify: `assets/js/help_js/sent_trans_loadsave.js`.
- Update the function `SaveTransReadyDataToFireBase` to write directly into `audio_phrases` at the same row index as the source phrase using `SaveToFB_Table_Row_Item_By_Index`.
- Determine the destination field from `translationTo`:
  - `sv` → `text_sv`
  - `en` → `text_en`
  - `uk` → `text_uk`
  - Also set `datetimetrans` (ISO string) on update.

Loader and readiness
- Translation page (`transl.html`) should include a single loader script: `assets/js/help_js/trans_loadscripts.js`.
- The loader:
	- Optionally runs a time‑gated origin clear (shared cookie `app_lastClearAt`).
	- Loads translation scripts in order.
	- Invokes `MainFunc()` once scripts are ready.

Acceptance
- Translation UI renders using Firebase phrases for the currently selected lesson.
- The same top‑right lessons menu appears on the translation page; changing the lesson refreshes the translation items.
- Saving translations updates rows in `audio_phrases` at their original indices.
- A basic verification (read‑back) shows the updated content in `gv.sts.audio_phrases` and after a refresh persisted from Firebase.

---

## Notes & edge cases
- Normalize `selected_lesson_id` comparisons (string vs. number) to avoid empty filters.
- If `lessons_audio_phrases` is absent or shaped as an object, convert with `Object.values(...)` before building the menu.
- Keep the time‑gated clear set to a short interval in dev (e.g., 10s) and switch to 5 minutes for production.
- If a language text is missing, render an empty string but allow editing in the translation UI.





