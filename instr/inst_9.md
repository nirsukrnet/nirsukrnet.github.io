# Instruction: New approach to load translations from `text_trans_phrases` (parts-based)

Based on the analysis in [instr/inst_8.md](instr/inst_8.md).

## Goal
Refactor the mp3.html translation loading so the **main source of translations** becomes:

`../data_base3/text_trans_phrases/{partid}/{txtid}`

instead of the legacy per-lesson source:

`../data_base3/audio_trans_phrases/{lessonKey}`

## Why change
- `text_trans_phrases` stores translations by reusable text ids (`text_id`), shared across lessons/parts.
- It is the source used by the translation editor pipeline (`CollectLessonData`).
- It reduces duplication vs storing translations inside `audio_trans_phrases` per lesson.

## Current behavior (mp3.html)
- Main loader: `MainFunc()` → `Load_DB3_Lesson_Phrases(lessonId)` in [assets/js/db_connswmp3.js](assets/js/db_connswmp3.js)
- It loads:
	- source phrases: `../data_base3/audio_phrases/{lessonKey}`
	- legacy translations: `../data_base3/audio_trans_phrases/{lessonKey}`
- Then `loadContentData()` renders `seg.text_sv` + `seg.text_en/text_uk`.

## Target behavior (new approach)
When a lesson is loaded:
1) Load only the source phrases from `audio_phrases`.
2) For each phrase, use `phrase.text_id` (format: `parttxt_<n>_txt<m>`) to fetch translation from `text_trans_phrases`.
3) Merge these translations into the phrase objects so the UI shows them.

## Data model / IDs
`text_id` format (confirmed by snapshots):

`parttxt_<n>_txt<m>`

Parsing rule:
- `partid` = first 2 underscore tokens (e.g. `parttxt_1`)
- `txtid`  = remaining tokens joined (e.g. `txt989`)

## Hard requirement: every phrase MUST have `text_id`
This is the **most important condition** for parts-based translations.

- Every item under `audio_phrases/{lessonKey}/{fileKey}[]` must contain `text_id`.
- `text_id` must be a **trimmed** string matching:
	- `parttxt_<n>_txt<m>` (regex: `^parttxt_\d+_txt\d+$`)

If `text_id` is missing/invalid, mp3.html cannot join translations from `text_trans_phrases`, so the UI will show `(no translation)`.

## Quick diagnosis checklist (when translations do not show)
1) In DevTools Console, confirm you see:
	- `[Load_DB3] text_trans join: ...`
	- `[Load_DB3] Applied text_trans_phrases translations: <N>` where `N > 0`

If you **do not** see the “text_trans join” log, you are likely running an older deployed build (old `db_connswmp3.js`).

2) Validate the data snapshot has `text_id` everywhere (PowerShell example for exported JSON):

```powershell
$path = 'C:\\Python\\AuTr\\html\\service_test\\js\\snapshots\\storage-eu-default-rtdb-audio_phrases-export.json'
$db = Get-Content $path -Raw | ConvertFrom-Json
$re = '^parttxt_\d+_txt\d+$'
$total=0; $missing=0; $invalid=0
foreach($lessonProp in $db.PSObject.Properties){
	foreach($fileProp in $lessonProp.Value.PSObject.Properties){
		foreach($p in $fileProp.Value){
			$total++
			$tid = $p.text_id
			if([string]::IsNullOrWhiteSpace($tid)){ $missing++; continue }
			if($tid.Trim() -notmatch $re){ $invalid++ }
		}
	}
}
"Total=$total Missing=$missing Invalid=$invalid"
```

3) Confirm the translation node exists for the part:
	- `../data_base3/text_trans_phrases/parttxt_1/txt1` should contain `text_en/text_sv/...`

If (1) is present and (2) is OK but applied count is still 0, the most likely causes are:
- the translations are not stored under `text_trans_phrases/{partid}/{txtid}` (path mismatch), or
- the `txtid` keys in Firebase don’t match what `text_id` encodes (e.g. `txt001` vs `txt1`).

## Core algorithm (recommended)
Implement a helper that returns a lookup map for translations by `text_id`:

### Step-by-step
1) Extract unique `text_id` values from the loaded lesson phrases.
2) Group by `partid`.
3) For each `partid`:
	 - GET `../data_base3/text_trans_phrases/{partid}` using `window.Load_DB3_Part_Phrases(partid)`
4) Create a map:
	 - key: full `text_id` (e.g. `parttxt_1_txt989`)
	 - value: merged translation object for that `txtid` (e.g. `{text_en, text_sv, text_uk, datetimetrans}`)
5) For each phrase:
	 - find `map[phrase.text_id]`
	 - merge the desired language fields into the phrase, but do NOT destroy the source `text_sv`.

## Integration point (where to plug it in)
Update `window.Load_DB3_Lesson_Phrases(lessonId)` in [assets/js/db_connswmp3.js](assets/js/db_connswmp3.js):

- Keep loading `audio_phrases/{lessonKey}` as before.
- Replace or supplement the legacy block that GETs `audio_trans_phrases/{lessonKey}` with the new part-based collector.

Recommended transition strategy:
- Prefer `text_trans_phrases` translations when available.
- Optional fallback to `audio_trans_phrases` when `text_id` missing or part lookup has no value.

## Suggested helper functions
These can live in [assets/js/db_connswmp3.js](assets/js/db_connswmp3.js) or a shared helper file.

### 1) Parse text_id
```js
function parseTextId(textId) {
	if (!textId || typeof textId !== 'string') return null;
	const parts = textId.split('_');
	if (parts.length < 3) return null;
	return {
		partid: parts[0] + '_' + parts[1],
		txtid: parts.slice(2).join('_')
	};
}
```

### 2) Build translation map from parts
```js
async function buildTextTransMapFromLessonPhrases(phrases) {
	const list = Array.isArray(phrases) ? phrases : [];
	const ids = new Set();
	for (const p of list) {
		if (p && typeof p.text_id === 'string' && p.text_id.trim()) ids.add(p.text_id.trim());
	}

	const byPart = new Map();
	for (const id of ids) {
		const parsed = parseTextId(id);
		if (!parsed) continue;
		if (!byPart.has(parsed.partid)) byPart.set(parsed.partid, []);
		byPart.get(parsed.partid).push({ fullId: id, txtid: parsed.txtid });
	}

	const map = {};
	for (const [partid, arr] of byPart.entries()) {
		const partDB = await window.Load_DB3_Part_Phrases(partid); // GET ../data_base3/text_trans_phrases/{partid}
		const partObj = (partDB && typeof partDB === 'object') ? partDB : {};
		for (const it of arr) {
			const row = partObj[it.txtid];
			if (row && typeof row === 'object') {
				map[it.fullId] = row;
			}
		}
	}
	return map;
}
```

### 3) Apply translations to loaded audio phrases
```js
function applyTextTranslationsToPhrases(phrases, transMap) {
	const list = Array.isArray(phrases) ? phrases : [];
	const map = (transMap && typeof transMap === 'object') ? transMap : {};

	for (const p of list) {
		const id = p && p.text_id;
		if (!id || !map[id]) continue;

		const sourceSv = p.text_sv;
		// Merge translations (keep source text_sv from audio_phrases)
		Object.assign(p, map[id]);
		if (sourceSv !== undefined) p.text_sv = sourceSv;
	}
}
```

## Notes / performance
- Add a simple cache for `Load_DB3_Part_Phrases(partid)` to avoid re-downloading the same part multiple times during one session.
- Only request parts that appear in the current lesson (use the grouping step).

## Done criteria
- When you switch lessons in mp3.html, translations shown under “Trans EN” come from `text_trans_phrases` (parts-based).
- Clicking “Trans EN” still only toggles UI visibility; the data should already be present in `gv.sts.audio_phrases` after lesson load.