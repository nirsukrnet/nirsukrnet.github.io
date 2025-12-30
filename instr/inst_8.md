
# Instruction: How “Trans EN” works (mp3.html)

This doc explains (short, step-by-step) what happens in the app when you click the translation button like:

`<button id="btn-trans1-0">Trans EN</button>`

and how the translation text is loaded and shown.

## Key idea
Clicking **Trans EN** does **not** fetch translation from Firebase.

Translations are loaded earlier (during lesson load) into `gv.sts.audio_phrases`. The click only toggles visibility of an already-rendered DOM element `#text-en-{index}`.

---

## 1) Which scripts are involved (mp3.html)

### Entry HTML
- Page: [mp3.html](mp3.html)
	- Loads: `./assets/js/main_loadscripts.js` (defer)
	- On `DOMContentLoaded` calls `MainFunc()`.

### Loader
- [assets/js/main_loadscripts.js](assets/js/main_loadscripts.js)
	- Loads CSS: `oap.css`, `oap_buttons.css`, `oap_menu_less.css`
	- Loads JS (in order):
		1) [assets/js/global_var.js](assets/js/global_var.js)
		2) [assets/js/db_connswmp3.js](assets/js/db_connswmp3.js)
		3) [assets/js/output_audio_phrase/oap_styles.js](assets/js/output_audio_phrase/oap_styles.js)
		4) [assets/js/output_oneaudio/oneaudio_controlbuttons.js](assets/js/output_oneaudio/oneaudio_controlbuttons.js)
		5) [assets/js/output_oneaudio/oneaudio_text.js](assets/js/output_oneaudio/oneaudio_text.js)
		6) [assets/js/output_audio_phrase/oap_menu_less.js](assets/js/output_audio_phrase/oap_menu_less.js)

---

## 2) Data load (where translation comes from)

### Main initialization
- `MainFunc()` is defined in [assets/js/db_connswmp3.js](assets/js/db_connswmp3.js)
	- Calls `init()`
		- `gv.SignIn_User()` authenticates (Firebase REST)
		- `Get_Rows_All_Tables()` → `Get_DB3_All_Data()`

### Lesson load + merge translations
- [assets/js/db_connswmp3.js](assets/js/db_connswmp3.js)
	- `Load_DB3_Lesson_Phrases(lessonId)` does:
		1) Finds `lessonKey` from `gv.sts.lessons_audio_phrases`
		2) GET `../data_base3/audio_phrases/{lessonKey}` (source phrases)
		3) Builds a translation map from `../data_base3/text_trans_phrases/{partid}` using each phrase `text_id`
		4) Applies translations into each phrase object (keeps source `text_sv`)
		5) Stores flattened result in `gv.sts.audio_phrases`

### Main Firebase source point (translations)

#### Current source used by mp3.html
The “main source of translations” is:

- `../data_base3/text_trans_phrases/{partid}/{txtid}`

To collect these translations you can reuse the proven logic from:

- Function: `window.CollectLessonData(lessonId)` in [assets/js/help_js/sent_trans_loadsave.js](assets/js/help_js/sent_trans_loadsave.js)

What `CollectLessonData(lessonId)` does (high level):
1) Reads lesson phrases from `gv.sts.audio_phrases` (already loaded for the selected lesson)
2) Extracts unique `text_id` values (format: `parttxt_<n>_txt<m>`)
3) Groups ids by `partid` (`parttxt_1`, `parttxt_2`, ...)
4) For each `partid` loads the part dictionary:
   - `window.Load_DB3_Part_Phrases(partid)` → GET `../data_base3/text_trans_phrases/{partid}`
5) Joins part translations back to each text id and returns enriched rows (with `_partid/_txtid`)

Practical outcome for mp3.html refactor:
- Instead of loading `audio_trans_phrases/{lessonKey}`, build translations by looking up each phrase `text_id` in `text_trans_phrases` and fill `seg.text_en/text_uk/text_sv` before calling `loadContentData()`.

Quick runtime check (DevTools console):
- You should see logs like:
	- `[Load_DB3] text_trans join: ...`
	- `[Load_DB3] Applied text_trans_phrases translations: <N>`
- If you do NOT see these logs on the site, you are likely running an older deployed JS build (not updated on GitHub Pages yet).






Result: each phrase in `gv.sts.audio_phrases` contains:
- `text_sv` (source)
- `text_en` / `text_uk` (from `audio_trans_phrases`, if exists)
- metadata (`_lesson_key`, `_file_key`, `_index`, `lesson_id`, ...)

---

## 3) Render (where the button and translation element are created)

### Building DOM rows
- [assets/js/output_oneaudio/oneaudio_text.js](assets/js/output_oneaudio/oneaudio_text.js)
	- Exposes `loadContentData()` which renders the list into `#list`.
	- For each phrase (`seg`) it creates:
		- Source row: `div#text-sv-{idx}`
		- Translation row: `div#text-en-{idx}` (initially contains translation or “(no translation)”)
		- Controls row (buttons)

### Choosing which translation to display
Inside `makeRow(seg, idx)` in `loadContentData()`:
- Reads `transPref = window.CONTENT_DATA_JSON.translationTo || 'en'`
- Picks `seg['text_' + transPref]` (fallbacks to `en/uk/sv` when missing)
- Writes that chosen string into `div#text-en-{idx}`

So the translation is already in the DOM before any click happens.

---

## 4) Click “Trans EN” (what actually happens)

### Button creation
- [assets/js/output_oneaudio/oneaudio_controlbuttons.js](assets/js/output_oneaudio/oneaudio_controlbuttons.js)
	- `addButtonsTrans_oap(playBlockEl, index1)` creates:
		- `button#btn-trans1-{index1}` with text `Trans EN` / `Trans UK` / `Trans SV`
		- Label depends on `window.CONTENT_DATA_JSON.translationTo`.

### Click handler
On click, it runs:
1) `const textEnEl = document.getElementById('text-en-{index1}')`
2) `textEnEl.classList.toggle('is-visible')`

That’s it.

**No Firebase call happens on click.**
The click only shows/hides the translation row that was already created and filled in step (3).

---

## 5) (Related) Changing lesson in the menu

- [assets/js/output_audio_phrase/oap_menu_less.js](assets/js/output_audio_phrase/oap_menu_less.js)
	- When a lesson is selected:
		1) sets `gv.sts.selected_lesson_id`
		2) calls `Load_DB3_Lesson_Phrases(id)` (loads phrases + translations)
		3) calls `loadContentData()` (re-renders)

So translations change when you change lesson because the underlying `gv.sts.audio_phrases` is reloaded.

