# instr_1 — Persist translation langs (1)/(2) + use same pattern as filters

## Goal
In `yout_transl.html` (YouTube Sentence Translation Tool), persist the selected languages:
- (1) **From** language
- (2) **To** language

After reload, the UI must restore the same values.

This must use the **same persistence approach** as the main menu filters already implemented in [yout_pl2.html](yout_pl2.html).

Also add **video list filtering** in `yout_transl.html`, same UX as the yout_pl2 main menu:
- Tag buttons row (SWE/ENG/OTH/All)
- Text input filter (“type to filter”)

## Hard rules (important)
1) DB paths in code must come only from `gv.cst.getcst('DB_CONST_...')`.
	- No hardcoded `../db_youtube2/...` strings in feature code.
	- No per-file fallbacks like `|| '../db_youtube2/...'`.

2) `yout_transl.html` must load globals that provide `GB_Const/getcst`.
	- Loader must include `./yout_pl2/yu2_global_var.js`.
	- Loader must NOT include legacy `./assets/js/global_var.js`.
	- Otherwise `gv.cst.getcst is not a function` will happen.

## Where to store
Use UI state under the existing UI state root for this tool.

Option A (preferred, minimal): store under the yout_pl2 UI state namespace:
- Root: `DB_CONST_UI_STATE_YOUT_PL2`
- Keys:
  - `yout_transl_from_lang`
  - `yout_transl_to_lang`

Add filter persistence keys:
- `yout_transl_selected_tag`
- `yout_transl_video_text_filter`

Reason: we already have `DB_CONST_UI_STATE_YOUT_PL2` and the persistence patterns.

## When to save
- Save on any change of From/To select.
- Debounce writes (~300–500ms) to avoid excessive requests.
- Do not force sign-in prompts on every change; if user is not signed in yet, defer saving until sign-in is available.

For filters:
- Save on tag button click and on text input (`input` event), also debounced.

## Save format
Use `PUT` to save each value as an object with timestamp:

`PUT ${UI_STATE_PATH}/yout_transl_from_lang`
```json
{ "value": "en", "updatedAt": "2026-01-12T12:34:56.789Z" }
```

`PUT ${UI_STATE_PATH}/yout_transl_to_lang`
```json
{ "value": "uk", "updatedAt": "2026-01-12T12:34:56.789Z" }
```

For filters:

`PUT ${UI_STATE_PATH}/yout_transl_selected_tag`
```json
{ "value": "SWE", "updatedAt": "2026-01-12T12:34:56.789Z" }
```

`PUT ${UI_STATE_PATH}/yout_transl_video_text_filter`
```json
{ "value": "doctor", "updatedAt": "2026-01-12T12:34:56.789Z" }
```

## Load/restore rules
- On init, load both keys.
- If missing, use current defaults (do not overwrite DB with defaults immediately).
- Validate values with existing language validation (2–16 chars, `[a-z0-9_-]`).

For filters:
- Load saved `selected_tag` and `video_text_filter` before building video list UI.
- Default `selected_tag` is empty/All.
- Default `video_text_filter` is empty.

## Filtering UX (same as yout_pl2 main menu)

### Data sources
- Tags list comes from: `DB_CONST_REF_TAGS_SHORT` (read `tags` object).
	- Render one button per tag key (e.g. SWE/ENG/OTH)
	- Add an `All` button (meaning no tag filter)

### Filtering logic
Given ref videos list (from `YouTubeRefVideosStore.listAll()`), apply:
1) Tag filter
	 - If `selected_tag` is set (not All), include only videos where `video.tag === selected_tag`.
2) Text filter
	 - Case-insensitive substring match against:
		 - `short_name` (preferred)
		 - and/or `title` (if `short_name` is empty)

### Rendering
- The video dropdown/list must reflect the filtered list.
- Selected tag button should show “selected” state (same as yout_pl2 main menu highlight).

## Acceptance checks
- Reload `yout_transl.html`: From/To are restored.
- No console errors related to `gv.cst.getcst`.
- Firebase writes are debounced and do not spam on every keystroke.
- Filters exist in `yout_transl.html` and behave like yout_pl2 main menu:
	- Tag buttons filter by tag
	- Text input filters by `short_name/title`
	- Both restore after reload

