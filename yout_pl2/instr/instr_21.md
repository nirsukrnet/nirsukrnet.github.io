# instr_21 — `yt_text.html`: Toggle transcript time + sentence-split view

## Goal
Extend `yt_text.html` so the **contexts menu** (`dlgMenu`) can toggle whether transcript timestamps are shown, using the **same UI + Firebase UI-state approach** as `yout_pl2.html`.

When timestamps are hidden, the page can optionally switch to a **sentence-split view** (text-only lines).

## Scope
- File: `html/yt_text.html`
- UI entry: contexts button `btnMenu` (label `...`) opens `dlgMenu`.

## New UI control (in `dlgMenu`)
Add a button that matches the pattern used in `yout_pl2.html`:

- Button id: `btnMenuToggleTransTime`
- `value="cancel"` (so the dialog closes after click, like in `yout_pl2.html`)
- Label is stateful:
	- If timestamps are currently visible: label `Hide transcript time`
	- If timestamps are currently hidden: label `Show transcript time`

## Persistence (Firebase UI state)
Use the same Firebase UI-state key as `yout_pl2.html` (do not invent a new path):

- Root: `DB_CONST_UI_STATE_YOUT_PL2`
- Key: `DB_CONST_UI_STATE_YOUT_PL2/transcript_timestamps_visible`

Accepted stored formats:
- boolean (`true`/`false`)
- number (`1`/`0`)
- object like `{ visible: true, updatedAt: ... }`

On startup (best effort):
- Load the value and apply it.

On toggle:
- Apply immediately in UI.
- Save back to Firebase with `updatedAt`.

## Rendering behavior

### A) Timestamps visible (default)
- Render each transcript row with timestamp + text (existing behavior).

### B) Timestamps hidden
Two effects:
1) Hide the timestamp column (do not render the `<small>` time value).
2) Switch to **sentence-split view** (see below).

## Sentence-split view
When timestamps are hidden, render a text-only list where each item is one sentence.

Source priority:
1) If transcript data contains `rawText`, use it.
2) Else, build text by joining existing transcript row texts for the active language.

Sentence splitting:
- Split on sentence terminators: `.`, `!`, `?`
- Trim whitespace
- Drop empty results

Mapping:
- The sentence list becomes the active “transcript” list for navigation (`Sn>`, `Pg>`, `Beg`).
- Items in sentence view do not have timestamps.

## Navigation expectations
- Clicking a line selects/highlights it but does not auto-scroll.
- `Sn>` and `Pg>` move selection and ensure it is visible.

## Acceptance criteria
- `dlgMenu` contains `btnMenuToggleTransTime`.
- Toggle updates the UI immediately and persists to `.../transcript_timestamps_visible`.
- When timestamps are hidden:
	- timestamp column is not shown
	- list switches to sentence-split view
- When timestamps are visible again:
	- list returns to the normal transcript-item view

## Additional mode: `One sent trans`
Add a second mode toggle in the contexts menu.

### Purpose
When enabled, show **two lines per transcript item** (like `yout_pl2.html`):
- Line 1: transcript text (active language from the SV/EN buttons)
- Line 2: translation in `en` (styled with the same “second line” color as `yout_pl2.html`)

### UI control (in `dlgMenu`)
- Button id: `btnMenuToggleOneSentTrans`
- `value="cancel"` (dialog closes after click)
- Label is stateful (must contain the mode name `One sent trans`):
	- `One sent trans - Off`
	- `One sent trans - On`

### Persistence (Firebase UI state)
Store under the same UI root (`DB_CONST_UI_STATE_YOUT_PL2`).

- Key: `DB_CONST_UI_STATE_YOUT_PL2/one_sent_trans`
- Payload format (recommended): `{ enabled: boolean, updatedAt: ISO }`
- Accept simple boolean/number values as well (best-effort), similar to other UI settings.

### Rendering rules
- Applies only when **timestamps are hidden** (sentence-split view).
- Line 2 language is fixed to `en`.
- If Line 1 language is also `en`, Line 2 is hidden (avoid duplicate text), same principle as `yout_pl2.html`.
- Translation line (Line 2) is shown **only for the selected/active item**, not for every item.
- Line 2 must use the same visual approach as `yout_pl2.html` second line:
	- render a second `<div>` below the main line
	- apply `.trLine2` styling (green-like `darkolivegreen`)

### Acceptance criteria (mode)
- `dlgMenu` contains `btnMenuToggleOneSentTrans`.
- When enabled, transcript list items render with a second translation line in EN (styled like `yout_pl2.html`).
- Setting is persisted and restored from `.../one_sent_trans`.

