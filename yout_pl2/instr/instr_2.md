## Instr 2 — Add “Play mode” toggle (One / All)

Goal: Add a UI toggle button that switches playback behavior between:

- **Play mode — One**: play only the currently selected transcript item, then stop.
- **Play mode — All**: play from the current item and continue to the next items automatically.

### 1) Button behavior and label

Add a new button (example id: `btnPlayMode`) with label format:

- `Play mode - One`
- `Play mode - All`

Clicking the button toggles the mode:

- If label is `Play mode - One` and user clicks it → mode becomes **All** and label updates to `Play mode - All`.
- If label is `Play mode - All` and user clicks it → mode becomes **One** and label updates to `Play mode - One`.

The button label must always reflect the **current active mode**.

### 1.1) Button placement (IMPORTANT)

The new `btnPlayMode` button must be placed inside the menu dialog:

- `<dialog id="dlgMenu"> ... </dialog>`

Recommended location:

- In the bottom menu buttons row (the row that contains `Hide transcription`, `Show time`, etc.),
  next to those UI-toggle buttons.

Reason: this is a UI setting, not a main playback control, so it should live in the menu.

### 2) Playback semantics

#### A) Play mode — One

When mode is **One**, pressing the Play/Pause button (`#btnPlay`) plays only the **current transcript item**:

- Single click on `#btnPlay`:
	- Start playing from the current item (the active transcript row `activeIndex`).
	- Playback stops automatically at the end of this item.
	- It must NOT automatically continue to the next item.

- Double-click on a transcript row:
	- Plays the selected item.
	- Stops at the end of that item.
	- Does NOT continue.

Stopping criteria:

- Define “end of item” as the start time of the next transcript item (i.e., `transcript[activeIndex + 1].t`),
	or if there is no next item, then stop at video end.

#### B) Play mode — All

When mode is **All**, pressing `#btnPlay` plays continuously:

- Start from the current item and continue automatically through subsequent items.
- As playback time moves forward, the app should keep updating the active transcript row.

### 3) Integration points

- The toggle affects behavior of:
	- `#btnPlay`
	- “play selected line” actions (click/double-click on transcript rows)

### 4) Acceptance checklist

- Toggling the button switches between `Play mode - One` and `Play mode - All`.
- In **One** mode: playing stops after the current item (does not continue).
- In **All** mode: playing continues beyond the current item.
- Double-clicking a transcript row plays that row; in **One** mode it stops at the end of that row.

lets fix issue

1) when in one mode dont jump after stop to the next item

2) not work double click in one mode - not playing once item
lets check it and fix