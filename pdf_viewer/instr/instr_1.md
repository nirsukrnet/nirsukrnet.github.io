# instr_22 — PDF Reader (canvas) + navigation + search

## Goal
Create a simple **HTML + JS** page for reading a PDF book with:
- render PDF pages into a `<canvas>`
- Next/Prev page navigation
- Zoom in/out
- keyboard shortcuts (desktop)
- iPhone-friendly controls (touch)
- **Text search** (required)

This viewer is inspired by the UI/behavior from: https://nirsukrnet.github.io/

## PDF sources
The viewer must be able to load the PDF from these locations:

1) Local file in this repo:
- `C:\Python\AuTr\html\learnbook_sw_beg.pdf`

2) Same PDF served by HTTP:
- `http://localhost:8080/learnbook_sw_beg.pdf`

3) Public hosted:
- `https://nirsukrnet.github.io/learnbook_sw_beg.pdf`

Implementation note: in browser JS you cannot directly open a Windows path like `C:\...` unless the user selects it via file picker or the file is served by a local web server. Therefore:
- Support **URL mode** (default: `http://localhost:8080/learnbook_sw_beg.pdf`)
- Support **File picker mode** (`<input type="file" accept="application/pdf">`)

## Page layout
Single-page viewer:
- Top header row:
	- `Open` (file picker)
	- URL input (optional) + `Load`
	- page indicator: `page/total`
- Main area:
	- `<canvas id="pdfCanvas">` in a scrollable container
- Bottom controls row (always visible / docked):
	- `Prev` / `Next`
	- Zoom: `-` / `+` and a numeric indicator like `100%`
	- `Fit width` (optional but recommended for iPhone)
	- Search field + `Find` + `Prev`/`Next` match

## Rendering rules
- Render exactly one page at a time into the canvas.
- Keep current page number stable when changing zoom.
- When a PDF is loaded:
	- set page = 1
	- render page 1
- When navigating:
	- `Prev`: page = max(1, page-1)
	- `Next`: page = min(total, page+1)

## Zoom rules
- Maintain a `scale` state.
- Provide at least these zoom steps:
	- min: 50%
	- default: 100%
	- max: 250% (or higher if needed)
- Buttons:
	- Zoom `-`: scale = scale / 1.2
	- Zoom `+`: scale = scale * 1.2
- `Fit width`:
	- compute scale so that page width fits into the canvas container width.

## Keyboard shortcuts (desktop)
When focus is not inside an input field:
- `ArrowLeft` / `PageUp`: Prev page
- `ArrowRight` / `PageDown`: Next page
- `+` / `=`: Zoom in
- `-`: Zoom out
- `Home`: first page
- `End`: last page
- `Ctrl+F`: focus search input
- `Enter` in search input: next match

## iPhone / mobile behavior
We must assume keyboard is not available.
- All actions must be possible via on-screen buttons.
- Buttons must be large (min height ~44px).
- Keep bottom controls visible (docked) so navigation is easy.
- Support pinch-to-zoom is optional; if not implemented, rely on zoom buttons + fit width.

## Text search (required)
Search must work within the loaded PDF.

Minimum behavior:
- Extract text for each page using PDF.js text content.
- When user searches for a string:
	- find occurrences across pages
	- jump to the first match (page + highlight)
- Provide `Next match` / `Prev match` navigation.

Highlighting:
- Best option: draw highlight rectangles over the canvas using text item transforms.
- Acceptable v1 option: show a list of matches with page numbers; clicking a match navigates to that page.

## Technical notes
- Use **PDF.js** for parsing and rendering.
- Render pipeline must cancel/ignore outdated renders when user clicks fast (avoid race conditions).
- Use a single global `renderTask` and a `renderSeq` token.

## Persistence (optional but recommended)
Store in `localStorage`:
- last opened URL
- last page
- zoom scale

## Deliverables
- A new page (suggested location): `html/pdf_viewer.html` or `html/pdf_viewer/index.html`
- Works with `http://localhost:8080/learnbook_sw_beg.pdf`
- Includes search UI and at least basic match navigation




