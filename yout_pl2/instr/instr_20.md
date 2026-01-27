# instr_20 — Create `yt_text.html` (transcript reader)

## Goal
Create a new page `yt_text.html` for working with transcripts/text **without YouTube video**, but still compatible with the app structure.

This page is a lightweight “text reader/editor” that reuses the **same visual style** as `yout_pl2.html`:
- same general layout feel
- same top-right **MainMenu** entry point
- same transparent controls bar container

## Non-goals
- No embedded YouTube player.
- No YouTube IFrame API.

## Required dialogs
### `dlgMenu` (Contexts menu)
- `yt_text.html` must include a `dlgMenu` element, but it can be **empty/minimal**.
- Purpose: keep consistent structure with `yout_pl2.html` and allow future extensions.
- It must not be required for normal use of `yt_text.html`.
- `dlgMenu` is opened via a controls-row button `btnMenu` (label `...`) using the same approach as `yout_pl2.html`.

## Page location
- File: `html/yt_text.html`

## Layout

### Header / Main menu button
- Include the same “MainMenu” button placement as in `yout_pl2.html`:
  - top-right corner
  - opens a modal dialog `dlgMainMenu` (or a simplified dialog with the same UI styling)

### Controls bar
Reuse the same transparent container element:

```html
<div class="row controls"></div>
```

Positioning requirement (match `yout_pl2.html`):
- Support the same **dock-to-bottom** behavior used in `yout_pl2.html`.
- Use the same UI state key: `DB_CONST_UI_STATE_YOUT_PL2/controls_dock_bottom`.
- When docked, the controls row is `position: fixed` at the bottom and the page adds bottom padding/spacer so content is not hidden behind the bar.

But the buttons inside are different from `yout_pl2.html`.

## Controls (buttons)
Buttons required in the controls bar:

### 1) Language buttons (SV/EN)
**Purpose:** select the active language shown.

Requirements:
- Replace the language menu with **two buttons**:
  - `SV` sets active language to `sv`
  - `EN` sets active language to `en`
- No language popup/dialog is used in this version.
- Controls row is shown in **two lines**:
  - Line 1: `SV`, `EN`
  - Line 2: `Sn>`, `Pg>`, `Beg`, `...` (opens contexts), and `mainInfo` aligned to the right

### 2) Contexts menu button (`...`)
**Purpose:** open the contexts dialog (`dlgMenu`).

Requirements:
- Add a button in the controls row: `btnMenu`.
- Label text: `...`
- Use the same general approach/pattern as in `yout_pl2.html`:
  - a `button` in `.row.controls` that calls `dlgMenu.showModal()` (best-effort)
  - `style="margin-left:auto;"` so it stays at the right side of the row
- `dlgMenu` window itself can be empty/minimal for now.

### 3) Next sentence button
**Purpose:** move focus/selection to the next sentence/row in the transcript.

Requirements:
- Button id: `btnNextSentence`.
- Label: `Sn>`
- On click:
  - advance to the next transcript item
  - ensure it is scrolled into view
  - visually highlight the active sentence

### 4) Next page button
**Purpose:** jump forward by a “page” worth of content.

Requirements:
- Button id: `btnNextPage`.
- Label: `Pg>`
- Define a page as a fixed item count $N$ controlled by a constant.
- Constant name (recommended): `TEXT_NEXT_PAGE_ITEMS`.
- Default value suggestion: `TEXT_NEXT_PAGE_ITEMS = 10`.
- On click:
  - advance by $N$ items
  - ensure the new active sentence is visible

### 5) Begin button
**Purpose:** go to the beginning of the text.

Requirements:
- Button id: `btnBegin`.
- Label: `Beg`
- On click: scroll to top and reset active sentence to the first.

## Transcript/Text area
- Provide a main scrolling area showing transcript rows.
- Each row is clickable to become the active sentence.
- Support at least a minimal two-line or single-line row rendering similar to the transcript list style in `yout_pl2.html`.

## Future: edit mode (not in v1)
For the first implementation, `yt_text.html` is **read-only** (navigation + viewing only).

However, design it with future editing in mind:
- later allow editing text of the active sentence/row
- later save edited transcript back to Firebase
- later show status: `Saving...` / `Saved` / `Save failed`

Future editing rules (when implemented):
- Preserve timestamps/metadata fields already used by the transcript schema.
- Editing must not reorder items.
- After save, re-render transcript using updated data.

## Data
Content source is **Firebase-backed** (required):
- Reuse the same Firebase auth + request helpers and the same transcript store module used by `yout_pl2.html`.
- Reuse existing DB path constants (no hardcoded DB URLs/paths).

Requirements:
- Load transcript by a selected `videoId` (same concept as `yout_pl2.html`).
- Save transcript updates using the existing store/save method (same schema).

## UX details
- Mobile-first: large tap targets (>= 36px height).
- Keep the controls bar sticky/visible if it matches existing app behavior.
- `mainInfo` shows only the progress counter like `26/87` (no videoId, no language).

## Acceptance criteria
- `yt_text.html` exists and loads as a standalone page.
- No YouTube player or IFrame API is loaded.
- `dlgMenu` exists (can be empty/minimal).
- A MainMenu button exists top-right and opens the main menu dialog.
- Controls bar contains: `SV`, `EN`, `Sn>`, `Pg>`, `Beg`, `...` and `mainInfo`.
- Buttons perform the described navigation actions on the transcript/text area.




