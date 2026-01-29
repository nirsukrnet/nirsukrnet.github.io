## Goal
Add **Save OCR to Firebase RTDB** + **show saved OCR regions as clickable overlays** in `pdf_viewer/pdf_main.html`.

This feature stores OCR results (and optional translations) tied to:
- PDF document
- page number
- selection rectangle (position + size)

Then it re-renders saved rectangles on top of the PDF page at **any zoom**, and allows opening/editing a saved entry by clicking the rectangle (when Select mode is OFF).

---

## UI
### OCR dialog
The OCR dialog header already contains buttons:
- `Save` (`#btnSaveToFB_Ocr`)
- `Close`

When user clicks `Save`:
- If dialog is opened from a **new selection**, create a new saved entry.
- If dialog is opened from a **saved entry click**, update (replace) that entry.

### Saved rectangles overlay
Render saved entries as rectangles on the page:
- Fill only (no border, no text)
- Slight tint is OK (example: `rgba(0, 160, 0, 0.10)`)
- Must scale proportionally with current `scale`
- Must be clickable **only when Select mode is OFF**
   - If Select mode ON: ignore clicks on saved rectangles (or disable pointer events)
   - If Select mode OFF: clicking a rectangle opens OCR dialog in **edit mode**

---

## Data model
Store metadata at the doc/page level (path), and keep each entry minimal.

### Page container (implicit by path)
The following values are **NOT** stored inside every entry, because they are already known from the path:
- `docId`
- `pageNum`
- `userId`

Optionally, you may store a small page-level object at:
`/pdf_viewer_ocr_v1/{userId}/{docId}/{pageNum}/_meta`

```js
{
   updatedAt: number  // Date.now()
}
```

### Entry object
Each saved entry is an object:

```js
{
   // rectangle in "page units" independent of zoom
   // store as coordinates at scale=1 (canvas px divided by scale)
   rect1: { x: number, y: number, w: number, h: number },

   // last-known view (informational, not required for rendering overlays)
   scaleSaved: number,

   // text fields
   text_sw: string,
   text_en: string,
   text_uk: string,

   updatedAt: number,    // Date.now()
   createdAt: number
}
```

### Notes
- `text_sw` is the primary text; if only one textarea exists, save that into `text_sw`.
- `text_en` / `text_uk` can be empty for now.

---

## Document identification (`docId`)
Prefer a stable PDF fingerprint from PDF.js:
- `pdfDoc.fingerprints?.[0]` (best)

Fallback:
- normalized `currentUrl` string (hash it, or use a safe base64/encode)

---

## Rectangle normalization (critical for zoom correctness)
Selection rectangle currently exists in **canvas pixels** (`selRectCanvas`) which depend on `scale`.

To save in zoom-independent form:
- Store rect at scale=1:

```js
rect1 = {
   x: selRectCanvas.x / scale,
   y: selRectCanvas.y / scale,
   w: selRectCanvas.w / scale,
   h: selRectCanvas.h / scale,
};
```

To render at current zoom:

```js
rectCanvasNow = {
   x: rect1.x * scale,
   y: rect1.y * scale,
   w: rect1.w * scale,
   h: rect1.h * scale,
};
```

---

## Firebase RTDB paths
### Root URL (important)
Use the Firebase RTDB **root**:

`https://storage-eu-default-rtdb.firebaseio.com/`

Do **not** use the YouTube sub-path (do not prefix with `/db_youtube2`).

### Path schema
Use a predictable schema:

```
/pdf_viewer_ocr_v1/{userId}/{docId}/{pageNum}/{entryId}
```

Where:
- `userId` is current signed-in user (or `anon` if not signed in)
- `entryId` can be derived from rectangle start point (and size) to keep stable updates
   - Example: `entryId = `${round(rect1.x)}_${round(rect1.y)}_${round(rect1.w)}_${round(rect1.h)}``

If the project already has a standard RTDB helper (used in `yout_pl2*.html`), reuse the same request/auth pattern.

---

## Duplicate detection rule
When saving a **new** entry:
- If another entry exists on the same `docId` + `pageNum` with the same rectangle “begin point” (`rect1.x`, `rect1.y`) within tolerance, do NOT create a new entry.
- Show status message (in main `#status`): `Already saved`.

Tolerance recommendation:
- `abs(dx) <= 2` and `abs(dy) <= 2` in `rect1` units.

---

## Edit mode behavior
Clicking a saved rectangle (Select mode OFF):
- Opens OCR dialog
- Loads that entry into textarea (and/or translation fields)
- Sets internal `activeSavedEntryId`

On `Save` while `activeSavedEntryId` is set:
- Update/replace that existing entry (overwrite text fields + `updatedAt`)

---

## Loading & rendering saved entries
When PDF loads and whenever `pageNum` or `scale` changes:
1) Load saved entries for current `docId + pageNum` (from RTDB)
2) Cache them in memory
3) Render overlay rectangles in a dedicated overlay container (separate from search highlights)

Rendering requirements:
- overlay must align to the PDF canvas exactly (same left/top and size rules as highlights)
- rectangles must NOT display text
- rectangles must remain visible at all zoom levels

---

## Non-goals (for this step)
- Deleting entries
- Full translation UI (separate inputs) if not already present
- Syncing entries across multiple open tabs





