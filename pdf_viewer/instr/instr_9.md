# Instr 9: Reverse transit tool (db_youtube2 → PDF OCR)

## Goal
Create a new HTML page that imports **only missing** items from `/db_youtube2` back into PDF OCR storage.

- HTML file: `pdf_viewer/youtube_trt_ocr.html`
- Analogy/reference implementation: `pdf_viewer/trt_ocr_yt.html` (PDF OCR → db_youtube2)

This reverse tool is **copy FROM → TO** with **append-only** behavior:
- PDF OCR data may already exist.
- Only items missing in PDF OCR should be added.

## Paths

### Read FROM (source)
- `/db_youtube2/youtube_transcripts/{itemId}`
- `/db_youtube2/ref_youtube_videos/{itemId}` (optional, for display metadata)

### Write TO (target)
- `/pdf_viewer_ocr_v1/{userId}/{docId}`

Key mapping:
- `docId = itemId`
- `userId` is resolved from the **current signed-in user** (same as other tools)

## User input (important)
User inputs only:
- `itemId` (or name it `docId` in UI; they are the same value)

`userId` must be resolved automatically as the current signed-in user.

## UI requirements

### A) Source (db_youtube2)
- Input: `itemId`
- Buttons:
	- **Sign in**
	- **Load from db_youtube2**

After load, show:
- Paths used:
	- `/db_youtube2/youtube_transcripts/{itemId}`
	- `/db_youtube2/ref_youtube_videos/{itemId}`
- Existence status:
	- transcript doc exists/missing
	- ref row exists/missing
- Summary of transcript:
	- total items count
	- list/table of items: `t`, `pageNum`, `entryId`, `text_sv`, `text_en`

### B) Target (PDF OCR)
- Computed target:
	- `docId = itemId`
	- `userId` resolved
	- target root: `/pdf_viewer_ocr_v1/{userId}/{docId}`

- Button:
	- **Check existing PDF OCR** (loads existing PDF OCR doc/subtree or pages)

After check, show:
- existing page count, entry count
- which items are missing (preview list)

### C) Actions
- **Import missing → PDF OCR**
	- Writes only missing entries
	- Shows result counters:
		- `added`, `skippedExisting`, `errors`

## Data behavior

### 1) Source transcript shape (expected)
From `/db_youtube2/youtube_transcripts/{itemId}` expected minimal structure:
```json
{
	"videoId": "<itemId>",
	"updatedAt": "2026-02-05T10:00:00.000Z",
	"items": [
		{
			"t": 3000,
			"text_sv": "En söndag",
			"text_en": "",
			"pageNum": 3,
			"entryId": "71_481_66_21"
		}
	]
}
```

If `items` is missing or not an array: treat as empty.

### 2) Target PDF OCR entry shape
Write each missing item to:
- `/pdf_viewer_ocr_v1/{userId}/{docId}/{pageNum}/{entryId}`

Minimal payload (recommended):
```json
{
	"text_sw": "<from text_sv>",
	"text_en": "<from text_en>",
	"updatedAt": "2026-02-05T10:00:00.000Z"
}
```

Notes:
- We do NOT know rectangle coords (`rect1`) from `/db_youtube2`.
- Do not invent `rect1`. If later you need rectangles, they must come from PDF selection.

Field mapping:
- `text_sw` ← source item `text_sv`
- `text_en` ← source item `text_en`
- `updatedAt` ← now (ISO string)

### 3) De-duplication rule (append only)
An item is considered already present in PDF OCR if:
- target path `/pdf_viewer_ocr_v1/{userId}/{docId}/{pageNum}/{entryId}` exists

Recommended efficient check:
- Load existing target pages (or at least all `{pageNum}` objects) once.
- Build a set of keys: `${pageNum}|${entryId}`.
- Import only items whose key is missing.

### 4) Optional: update PDF OCR doc `_ui`
If you want to reflect that import happened, update:
- `/pdf_viewer_ocr_v1/{userId}/{docId}/_ui`

Recommended minimal fields:
```json
{
	"updatedAt": 1770120752527
}
```

## Error handling
- If transcript doc missing: show error and do not import.
- If user not signed in: require sign-in.
- If a single entry write fails: continue with others and report `errors`.

## Acceptance criteria
- User enters only `itemId`.
- Tool resolves current `userId` automatically.
- Tool reads `/db_youtube2/youtube_transcripts/{itemId}`.
- Tool writes only missing entries into `/pdf_viewer_ocr_v1/{userId}/{itemId}/{pageNum}/{entryId}`.
- Running the import twice does not create duplicates.

