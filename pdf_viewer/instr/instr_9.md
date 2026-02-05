# Instr 9: Function to transit one PDF doc → one transcript group

## Goal
Develop a new function that copies all OCR entries for a single PDF document from:
- **FROM**: `/pdf_viewer_ocr_v1/{userId}/{docId}`

…into a single target group in:
- **TO**: `/db_youtube2/youtube_transcripts/{itemId}`
- **TO**: `/db_youtube2/ref_youtube_videos/{itemId}`

This is a **data transit/copy** function only. The target key does not need to be a real YouTube video.

## Inputs
- `userId` (string)
- `docId` (string)

## Output / target key
- `itemId` (string)
- Default mapping: `itemId = docId`

## Source data to read
Read the whole doc subtree:
- `/pdf_viewer_ocr_v1/{userId}/{docId}`

Expected structure:
- Pages are numeric keys: `"1"`, `"2"`, `"3"`, ...
- Each page contains entries: `{entryId: entryObj, ...}`
- Optional doc-level: `/_ui`

Example entry path:
- `/pdf_viewer_ocr_v1/{userId}/{docId}/{pageNum}/{entryId}`

## Target data to write
Write a single document:
- `/db_youtube2/youtube_transcripts/{itemId}`

Recommended target shape:
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

Notes:
- Keep `items` as an array so ordering is preserved.
- `videoId` is kept only for compatibility with existing transcript readers that expect that field.

## Mapping rules
For each OCR entry:
- `text_sv` ← source `text_sw` (Swedish text in current PDF viewer DB)
- `text_en` ← source `text_en` (or empty string if missing)
- `pageNum` ← page number
- `entryId` ← entry id

Note:
- We do not store a `src` object inside each item.
- De-duplication is done using `pageNum` + `entryId` (and the document scope is already fixed by `itemId = docId`).

### Ordering rules (recommended)
When converting many entries to `items[]`, produce a stable order:
1) `pageNum` ascending
2) within page: by rectangle top-to-bottom then left-to-right (if `rect1.x/rect1.y` exist)
3) fallback: by `entryId` string

### `t` generation rules (recommended)
Because OCR entries do not have a real timestamp in a video:
- Generate `t` as an ordering number:
	- `t = (pageNum * 1000) + indexWithinPage`
This guarantees stable sort order and uniqueness for typical page sizes.

## De-duplication behavior
If the target doc already exists, the function must avoid adding duplicates.

Rule:
- Load existing `/db_youtube2/youtube_transcripts/{itemId}` and build a set of existing item keys:
	- key = `${pageNum}|${entryId}`
- When importing, only append entries whose key is not present.

## Error handling
- If source doc does not exist: return an error `"not found"`.
- If source doc exists but has no pages/entries: create an empty target doc with `items: []` (optional) OR return a message `"no entries"`.

## Acceptance criteria
- Given `userId` + `docId`, the function produces `/db_youtube2/youtube_transcripts/{docId}`.
- All OCR entries under the doc are copied into `items[]` with correct `text_sv/text_en/pageNum/entryId`.
- Running the function twice does not duplicate items.

## Also write `/db_youtube2/ref_youtube_videos/{itemId}`
Create/update a reference row for the same `itemId`.

Path:
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




