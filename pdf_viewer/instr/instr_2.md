
# PDF Viewer — simplified controls

This viewer was simplified: the extra buttons from the screenshots are removed.

## 1) Open a PDF (no top panel)

The top “Open/URL” panel was removed to free space.

Use keyboard shortcuts:

- **Ctrl+O**: open a local `.pdf` with the file picker
- **Ctrl+L**: enter a PDF URL/path and load it

Examples that usually work when served from a local web server:

- `./learnbook_sw_beg.pdf`
- `learnbook_sw_beg.pdf`
- `/pdf_viewer/learnbook_sw_beg.pdf`

If you see **“Failed to load URL (check console)”**:

- If you opened `index.html` via `file:///...`, browsers often block PDF loading by URL. Use the **file picker** instead.
- Or run the viewer from a local server, for example:
	- `cd c:\Python\AuTr\html`
	- `python -m http.server 8080`
	- open `http://localhost:8080/pdf_viewer/`

## 2) Page navigation / zoom

- Use **Prev / Next** (bottom bar) to change pages.
- Use **- / +** to zoom.
- Use **Fit width** to fit the page to the screen.

## 3) Search (no bottom search bar)

The bottom search bar was removed to free space.

- **Ctrl+F**: enter search text
- **F3**: next match
- **Shift+F3**: previous match
- Also works: **N** (next match), **P** (previous match)

## 4) Select + OCR

- Click **Select** (bottom bar) to enable selection.
- Drag on the page to select a rectangle.
- Click **OCR** to recognize the selected area.
- Click **Clear** to clear the selection.

## What was removed

- No top “file / URL” UI block (use **Ctrl+O** / **Ctrl+L**)
- No bottom “search” UI block (use **Ctrl+F**, **F3**, **Shift+F3**)
- No `0/0` counters for pages/matches

