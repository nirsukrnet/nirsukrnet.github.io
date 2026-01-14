# Feature: “Resp” (AI response / explanation) modal + Firebase store

## Goal
Add a workflow to paste/store the AI grammar explanation (“response”) for the current YouTube video (and optionally for the current transcript line).

User clicks this existing button:

```html
<button id="btnPasteAI" class="yu2-btn yu2-btn--tool" title="Paste grammar respond">Resp</button>
```

It opens a modal (`showModal`) with a text area + **Save**.

## Storage location (Firebase RTDB)
Store under the YouTube DB root:

- `EXPL_ROOT = DB_YOUTUBE2_ROOT + '/youtube_explanation'`

Path per video:

- `EXPL_DOC_PATH = EXPL_ROOT + '/' + <videoId>`

Notes:
- `DB_YOUTUBE2_ROOT` should come from existing constants (see `instr_5.md`).
- Keep fallback if constants are missing: `const ROOT = (window.YT_DB_CONST?.DB_YOUTUBE2_ROOT) || '../db_youtube2'`.

## Data model
Keep it similar to `youtube_transcripts`, but store explanation text.

Recommended schema (document per video):

```js
{
	videoId: "maKy1pRdcDw",
	source: "manual",          // same style as transcript store
	updatedAt: "2026-01-14T12:34:56.000Z",

	// Optional: per-transcript-line explanations (indexed like transcript items)
	items: [
		{ idx: 0, t: 4.0, enc: "b64utf8", text_b64: "...", updatedAt: "..." },
		{ idx: 1, t: 6.0, enc: "b64utf8", text_b64: "...", updatedAt: "..." }
	]
}
```

Rules:
- The textarea content (Markdown) must be **encoded** before saving to Firebase.
  - Reason: keep a stable, safe representation (newlines + Unicode) and avoid any escaping issues.
- Store encoded content in `text_b64` with `enc: "b64utf8"`.
- Decode on load and put the decoded string back into the textarea.
- Back-compat:
  - If `text_b64` is missing but `text` exists (older data), treat `text` as already-decoded plain text.

### Encoding/decoding contract
Implement two helpers (names are free, but behavior must match):

```js
encodeForDb(str) -> { enc: 'b64utf8', text_b64: <base64> }
decodeFromDb({enc, text_b64, text}) -> <decoded string>
```

Required behavior:
- `encodeForDb` converts the textarea string to UTF-8 bytes and Base64 encodes it.
- `decodeFromDb`:
  - if `enc === 'b64utf8'` and `text_b64` exists: Base64 decode -> UTF-8 string
  - else if `text` exists: return `text`
  - else return empty string

## UI: modal dialog
Add a new dialog (name can vary, but keep IDs stable if you follow this spec):

- `dialog#dlgResp`
- `textarea#taResp`
- `button#btnRespSave` (type="button")
- `span#respStatus` (small status line)

Behavior:
- Clicking `#btnPasteAI` opens the dialog via `dlg.showModal()` (fallback: set `open` attribute).
- The dialog should show context info (videoId, and if available current active line index/time).
- `#btnRespSave` saves to Firebase and updates `#respStatus`.

### Which target is being edited
This feature stores the explanation **per transcript line**.

When opening the dialog:
- If an “active transcript line” exists (e.g., `activeIndex >= 0`), edit **line-level**: decode from `items[activeIndex]` into the textarea.
- If there is no active line, show a status like: “Select a transcript line first” (do not save).

When saving:
- Preserve existing doc fields if they exist (do not delete other indexes).
- Ensure `items` grows to at least `activeIndex` if saving line-level.
- Store `idx` and `t` for line-level rows if possible.

## Load behavior
On opening the dialog:
- Best-effort `GET` the existing document at `EXPL_DOC_PATH`.
- Fill textarea:
	- line-level mode: `decodeFromDb(items[activeIndex])` (or empty)

## Save behavior
On Save:
- Ensure sign-in (same approach used by transcript store).
- `PUT` the full document at `EXPL_DOC_PATH` (simple and consistent).
- Update `updatedAt` at document level, and for the updated line item.
- Show success/failure in `#respStatus`.

## Non-goals
- Do not change existing transcript behavior.
- Do not change Firebase auth/request logic.

## Acceptance criteria
- Clicking “Resp” opens a modal with textarea and Save button.
- Saved content appears under `DB_YOUTUBE2_ROOT + '/youtube_explanation/<videoId>'`.
- Re-opening the modal loads previously saved content.
- Works even if the user pastes Markdown (stored via encode/decode).



