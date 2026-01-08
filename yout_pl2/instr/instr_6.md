## Goal
Create a new page `yout_transl.html` that works like `transl.html` (same translation UI and workflow), but uses **YouTube transcripts** as the input dataset instead of lessons/phrases.

This must run **in parallel** with the existing `transl.html` page:
- `transl.html` keeps working exactly as now (lesson menu, DB3 save).
- `yout_transl.html` uses a **YouTube video menu** and loads transcript items from `../db_youtube2/youtube_transcripts/<videoId>`.

## Hard constraints
1) Do not break / change behavior of `transl.html`.
2) Do **not modify existing logic** inside `assets/js/help_js/sent_trans_loadsave.js`.
	 - Allowed: **add new functions** (new names) that enable YouTube mode.
	 - Not allowed: change current functions’ behavior for the lesson flow.

## Reference files / current architecture
- `transl.html` is a shell that loads `assets/js/help_js/trans_loadscripts.js`.
- `trans_loadscripts.js` loads and runs:
	- `assets/js/help_js/trans_ui.js` (defines `MainFunc()` and builds the UI)
	- `assets/js/help_js/sent_trans_loadsave.js` (transform + render + parse/save)
	- `assets/js/output_audio_phrase/oap_menu_less.js` (lesson menu)
- `yout_pl2_viewer.html` already demonstrates a working **YouTube video menu** and Firebase request pattern.
- `yout_pl2/youtube_ref_videos_store.js` and `yout_pl2/youtube_transcript_store.js` encapsulate access to:
	- `../db_youtube2/ref_youtube_videos`
	- `../db_youtube2/youtube_transcripts`

## What `yout_transl.html` must do

### 1) Menu (YouTube videos)
Add a menu similar to `yout_pl2_viewer.html`:
- Data source: `../db_youtube2/ref_youtube_videos`
- UI: `<select>` with all ref videos (label like viewer: `short_name || title || indent_id || url`)
- Value: YouTube `videoId` (prefer `indent_id`, else extract from `url`)
- When selection changes → load transcript and re-render translation UI.

Minimum: just the video select.

Optional (recommended but still “minimal”):
- Two language selectors/buttons: `fromLang` and `toLang`.
	- These determine which transcript fields map into the translation UI.

### 2) Load transcript items
On video selection:
- Load transcript object from: `../db_youtube2/youtube_transcripts/<videoId>`
	- Use `window.YouTubeTranscriptStore.load(videoId)`.
- Take `items = data.items || []`.
- Each transcript item is expected to look like:
	- `{ t: <seconds>, text: "...", text_sv?: "...", text_en?: "...", text_<lang>?: "..." }`

### 3) Convert transcript items into the input rows required by the existing translation UI
The existing translation renderer pipeline is:
`ExpImpForTrans_Sentence_loadDataToHTML(inputData)` → `transformData(inputData)` → fills `window.for_trans_data`.

Important: `transformData()` currently reads ONLY:
- `seg.text_sv` as `sentence_from`
- `seg.text_en` as `sentence_to`
and builds `d_uuid = seg._partid + '_' + seg._txtid`.

Therefore `yout_transl.html` must create `inputData` rows in THIS shape:

```
inputData = [
	{
		_partid: "yt_<videoId>",
		_txtid: "t_<seconds>" OR "i_<index>",
		_srcIndex: <index in transcript items>,

		// IMPORTANT: must exist for transformData()
		text_sv: "<source text>",
		text_en: "<target text>",

		// optional (debug/metadata)
		t: <seconds>
	},
	...
]
```

Mapping rule:
- Choose `fromLang` and `toLang` (default: `sv` → `en`).
- For each transcript item:
	- `sourceText = item['text_' + fromLang] || item.text || ''`
	- `targetText = item['text_' + toLang] || ''`
- Store into `text_sv`/`text_en` **even if the real languages are not Swedish/English**.
	- In YouTube mode: `text_sv` means “FROM language”, `text_en` means “TO language”.

After building `inputData`, call:
- `window.ExpImpForTrans_Sentence_loadDataToHTML(inputData)`

### 4) Saving translations (must be separate from lessons)
Lesson mode saves into DB3 `../data_base3/text_trans_phrases/...`.
In `yout_transl.html`, saving must update the YouTube transcript record instead:
- Update `../db_youtube2/youtube_transcripts/<videoId>/items[*]['text_<toLang>']`.

Constraint: we cannot change existing save buttons logic in `sent_trans_loadsave.js`.

Implementation approach (allowed):
1) Add a NEW function in `sent_trans_loadsave.js` (do not change existing functions):
	 - `window.SaveTransReadyDataToFireBaseTo_youtube_transcripts = async function(videoId, toLang, dataToSave) { ... }`
	 - `dataToSave` is the existing save payload: `[{idsentence, sentence_to}, ...]`
	 - Use `window.for_trans_data` to map `idsentence -> _srcIndex`.
	 - Load transcript: `const data = await YouTubeTranscriptStore.load(videoId)`.
	 - Patch items: `items[_srcIndex]['text_' + toLang] = sentence_to`.
	 - Save full object back via `YouTubeTranscriptStore.save(videoId, items, data.rawText, { lang1_show, lang2_show })`.
2) In `yout_transl.html` only: redirect the existing saver hook:
	 - Override/alias `window.SaveTransReadyDataToFireBaseTo_text_trans_phrases` to call the YouTube saver.
	 - This keeps the existing “Save Next / Clear Trans” buttons working without editing their logic.

Notes:
- Do not do this override in `transl.html`.
- Keep the in-memory `window.for_trans_data` updated so the UI reflects saved text immediately.

### 5) Isolation between pages
To keep separate state/persistence:
- Set `window.OAP_OWNER = 'yout_transl'` in `yout_transl.html`.
- Do not reuse `oap_menu_less.js` lesson menu.

## Acceptance checklist
- Opening `transl.html` still shows lesson menu and loads lesson data.
- Opening `yout_transl.html` shows a video select menu populated from `../db_youtube2/ref_youtube_videos`.
- Selecting a video loads transcript items from `../db_youtube2/youtube_transcripts/<videoId>`.
- Translation UI renders blocks of sentences with Copy/Parse/Save working.
- Saving updates the transcript record for that video (writes `text_<toLang>` fields) without touching DB3 `text_trans_phrases`.


