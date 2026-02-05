# Transit tool: PDF OCR → db_youtube2

## Goal
Create a new HTML page that helps “transit” (copy/migrate) OCR data stored in Firebase RTDB under:
- **FROM**: `/pdf_viewer_ocr_v1/{userId}/{docId}`

…into:
- **TO**: `/db_youtube2/youtube_transcripts/{itemId}`
- **TO**: `/db_youtube2/ref_youtube_videos/{itemId}`

This is **only copy FROM → TO**.
- The target key does **not** need to be a real YouTube video.
- Default mapping: `itemId = docId`.

## User input (important)
The tool input must be only:
- `docId`

`userId` must be resolved automatically as the **current signed-in user**.

## UI requirements

### A) Source
- Input: `docId`
- Button: **Load source doc**
- After load, show:
	- Current `userId` being used
	- Source path that will be read: `/pdf_viewer_ocr_v1/{userId}/{docId}`
	- Doc `_ui` preview (if exists): `ocrLang`, `pageNum`, `updatedAt`
	- Summary: page count, entry count
	- Optional: a table/grid with entries (pageNum, entryId, text_sw, text_en)

### B) Target
- Computed: `itemId = docId`
- Show target paths:
	- `/db_youtube2/youtube_transcripts/{itemId}`
	- `/db_youtube2/ref_youtube_videos/{itemId}`

- Allow user to edit ref fields (optional): `title`, `short_name`, `description`, `order`, `tag`, `url`.

### C) Actions
- **Check target**: loads existing transcript doc + ref row for `itemId`
- **Transit (write)**:
	- Write/update ref row
	- Write transcript doc (create or merge)
- Status area: show success/error and numbers:
	- `addedItems`, `skippedDuplicates`, `totalItems`.

## Data behavior

### 1) Read from `/pdf_viewer_ocr_v1/{userId}/{docId}`
Read the whole doc subtree.

Expected structure:
- Pages are numeric keys: `"1"`, `"2"`, ...
- Each page contains OCR entries keyed by `entryId`
- Optional doc-level key: `"_ui"`

### 2) Build transcript items
Target transcript doc path:
- `/db_youtube2/youtube_transcripts/{itemId}`

Recommended transcript doc shape:
```json
{
	"videoId": "<itemId>",
	"source": "pdf_viewer_ocr_v1",
	"updatedAt": "2026-02-03T10:00:00.000Z",
	"items": [
		{
			"t": 3000,
			"text_sv": "...",
			"text_en": "...",
			"pageNum": 3,
			"entryId": "71_481_66_21"
		}
	]
}
```

Item mapping:
- `text_sv` ← source `text_sw`
- `text_en` ← source `text_en` (or empty string)
- `pageNum` ← page number
- `entryId` ← entry id

Ordering (recommended):
1) `pageNum` ascending
2) within page: by rectangle top-to-bottom then left-to-right (if `rect1.x/rect1.y` exist)
3) fallback: by `entryId`

`t` generation (recommended):
- Use deterministic ordering number:
	- `t = (pageNum * 1000) + indexWithinPage`

De-duplication:
- Load existing target transcript doc.
- Build a set of existing keys: `key = ${pageNum}|${entryId}`.
- Append only entries whose key is not present.

### 3) Write `/db_youtube2/ref_youtube_videos/{itemId}`
Target ref row path:
- `/db_youtube2/ref_youtube_videos/{itemId}`

Recommended minimal shape:
```json
{
	"indent_id": "<itemId>",
	"tag": "PDF",
	"title": "PDF 1",
	"short_name": "PDF 1",
	"description": "PDF 1",
	"order": 6,
	"transListScroll": null,
	"updatedAt": "2026-01-26T10:01:54.891Z",
	"url": "pdf://<docId>"
}
```

Update rules (recommended):
- `updatedAt`: always write current ISO time.
- `indent_id`: always equals `itemId`.
- `url`: can be empty, but recommended placeholder is `pdf://{docId}`.
- `title/short_name/description`:
	- If missing, auto-generate as `PDF N`.
	- Choose `N = 1 + max(existing PDF N)` among records where `tag == "PDF"`.
- Default is “update missing fields only” (do not overwrite existing non-empty fields unless user explicitly chooses overwrite).

## Acceptance criteria
- User enters only `docId`.
- Tool resolves current `userId` automatically.
- Tool reads `/pdf_viewer_ocr_v1/{userId}/{docId}` and writes to:
	- `/db_youtube2/youtube_transcripts/{docId}`
	- `/db_youtube2/ref_youtube_videos/{docId}`
- Re-running transit does not duplicate transcript items.

## Real data example (from export)
Based on real exported RTDB data:
- Source root: `/pdf_viewer_ocr_v1/c2FwczFAbnVrci5uZXQ`
- Export file: `C:\Users\IvanNechvoloda\Downloads\storage-eu-default-rtdb-pdf_viewer_ocr_v1-export.json`

Example:
- `userId` = `c2FwczFAbnVrci5uZXQ` (resolved automatically in the tool)
- `docId` = `ODU5M2E4MzUwNDQ4Mzk0MjhhM2I3ZDRlNTlmYmZlNzc`
- Input to tool: `docId` only

Writes:
- `/db_youtube2/youtube_transcripts/ODU5M2E4MzUwNDQ4Mzk0MjhhM2I3ZDRlNTlmYmZlNzc`
- `/db_youtube2/ref_youtube_videos/ODU5M2E4MzUwNDQ4Mzk0MjhhM2I3ZDRlNTlmYmZlNzc`

And one example OCR entry in that export:
- page `3`, entryId `71_481_66_21`, `text_sw = "En söndag"`

Resulting item (example):
```json
{
	"t": 3000,
	"text_sv": "En söndag",
	"text_en": "",
	"pageNum": 3,
	"entryId": "71_481_66_21"
}
```


### Example B: doc-level `_ui` → ref_youtube_videos (display + optional update)

**Source doc-level path**
