## Goal
Create a new page:

- `C:\Python\AuTr\html\yout_pl2_ito_text.html`

It must behave the same as:

- `C:\Python\AuTr\html\yout_pl2_viewer.html`

…but it must include **only the “Section 1” functionality** (the first `.section_with_borders` block using `sectionTitle1`, etc.).  
Anything related to **Section 2 / chunks** must be removed.

## Scope (what to KEEP)
Keep everything required to make **Section 1** work:

1) **Video selection**
- Load videos from `../db_youtube2/ref_youtube_videos`
- Show them in `#videoSelect` (same sorting/labels as viewer)

2) **Language selection**
- Load languages from `../db_youtube2/ref_languages_set`
- Render language buttons in `#langRow`
- Support language fallback: `text_<lang>` → `text` → `''`

3) **Output options**
- Toggle: show/hide timestamps
- Toggle: lines view vs full text view

4) **Fixed-size output panes**
- `#out_index` (index list) fixed height, scrollable
- `#out` (text output) fixed height, scrollable
- Clicking an item in `#out_index` highlights the matching substring in `#out`
  using `start/end` from the built index map.

5) **Header/title UI**
- Section header uses:
  - `#sectionTitle1`
  - `#sectionDesc1`
- Pane headers for Section 1 remain (Index/Text titles + one-line description)

## Scope (what to REMOVE)
Remove/omit everything related to **Section 2 (clone / chunking)**:

- No `sectionTitle2`, `sectionDesc2`, `panes2`
- No `out2`, `out_index2`
- No “Function 3” chunk splitting logic
- No rendering of chunk lists, chunk preview rows, or chunk click handlers

## Implementation notes
- Prefer copying `yout_pl2_viewer.html` and then deleting Section 2 markup + CSS + JS.
- Keep IDs consistent with the “Section 1” naming convention:
  - `sectionTitle1`, `sectionDesc1`, `panes1`, `out_index`, `out`

## Notes / pitfalls
- Ensure `setOutLoading()` only touches `#out` and `#out_index`.
- Ensure `bootstrap()` sets only `sectionTitle1/sectionDesc1` and only Section 1 pane headers.
- Ensure there is no CSS that references `#panes2`, `#out2`, `#out_index2`, or `.chunkGrid`.

## Acceptance checks
1) Page loads and video list appears.
2) Switching language updates output.
3) Toggle “Hide time” removes timestamps from output.
4) Toggle “Show full text” switches between line output and full text output.
5) Clicking an index item highlights the corresponding text in the output pane.
6) No references to `sectionTitle2`, `panes2`, `out2`, `out_index2`, or chunk functions exist.


