lets update this instr 

        <button id="btnSaveToFB_Ocr" type="button" style="margin-left:auto;">Save</button>
        <button value="cancel">Close</button>





## Task: Improve OCR dialog positioning + fixed sizing

Goal: make the OCR popup predictable and not cover the text being read.

### Files
- Viewer HTML/JS: `pdf_viewer/pdf_main.html` (or current viewer file that contains `dlgOcr`)

### 1) Fixed dialog size (constants)
Implement fixed dialog dimensions via constants:

- `OCR_DLG_W` (px)
- `OCR_DLG_H` (px)
- `OCR_DLG_EDGE` (px)
- `OCR_HDR_H` (px) — fixed height for the header row (`<div class="row">` inside `dlgOcr`)

Implementation location (current code):
- `pdf_viewer/pdf_main.html` around the comment `// OCR dialog sizing/placement`

Rules:
- Use these constants to set `dlgOcr.style.width` and `dlgOcr.style.height`.
- Keep the dialog inside the viewport (never overflow screen).
- Add a small margin from edges, e.g. `EDGE = 8` px.

Header row height rules:
- The header row in the OCR dialog is this block:
	- `<div class="row" style="margin:0;"> ... </div>`
- Set its height using `OCR_HDR_H` and make it vertically centered.
- Do not allow the header to grow into 2 lines.

### 2) Compact header + compact textarea

**Header must be 1 line only.**

Suggested header layout:
- Line 1: title (left) + buttons (right)

Visual style:
- Make the dialog background **10% transparent** (i.e. 90% opacity).
- Keep **Copy** and **Close** buttons fully opaque (not transparent).
- Everything else inside the dialog can inherit the dialog transparency.

**Textarea must be 2 lines only** (fixed height), for:

`<textarea id="ocrText" placeholder="(OCR output)"></textarea>`

Implementation options (choose one):
- Set `rows="2"` on the textarea.
- Or set CSS height to two text lines, e.g. `height: calc(2 * 1.35em + 20px)` (line-height * 2 + padding), and disable resizing.

Status text should not add a second header row. If needed, show status as:
- a short inline badge on the same header row, or
- temporary text in the main page status area (`#status`), or
- toast-like message that disappears.

### 3) Smart placement relative to selection
When OCR is triggered from a selected rectangle:

Inputs:
- Selection rectangle in **viewport coordinates** (CSS pixels): `selRectCss` (x, y, w, h)
- Viewport size: `window.innerWidth`, `window.innerHeight`

Compute free space:
- `spaceAbove = selRectCss.y`
- `spaceBelow = innerHeight - (selRectCss.y + selRectCss.h)`

Placement rule:
- If `spaceBelow >= spaceAbove`, place dialog **below** the selection.
- Else place dialog **above** the selection.

Positioning rule:
- Horizontally center on selection: `left = selRectCss.x + selRectCss.w/2 - OCR_DLG_W/2`
- Clamp `left` to `[OCR_DLG_EDGE, innerWidth - OCR_DLG_W - OCR_DLG_EDGE]`
- If placing below: `top = selRectCss.y + selRectCss.h + OCR_DLG_EDGE`
- If placing above: `top = selRectCss.y - OCR_DLG_H - OCR_DLG_EDGE`
- Clamp `top` to `[OCR_DLG_EDGE, innerHeight - OCR_DLG_H - OCR_DLG_EDGE]`

### 4) Behavior
- Open dialog with `dlgOcr.showModal()`.
- Reposition/reclamp on:
	- window resize
	- zoom changes
	- page change

### Acceptance checklist
- Dialog always uses constant size.
- Dialog never goes off-screen.
- Dialog appears above/below selection based on available space.
- Header is 1 line only and uses constant height.
- Dialog background uses ~10% transparency; Copy/Close stay opaque.

