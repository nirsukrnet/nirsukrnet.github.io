
# yout_pl2: Transparent controls + dock-to-bottom setting

## Goal
1) Make the main controls row visually transparent (no filled background on the row and buttons).
2) Add a UI toggle that switches the controls row between:
   - **Normal** position (current behavior in the page flow)
   - **Bottom-docked** (fixed to the bottom of the window)
3) Persist the selected mode in Firebase so it is restored on next load.

## Scope (must / must not)
- MUST only affect this controls row:
  - `<div class="row controls">`
  - Buttons inside it: `btnMark1`, `btnMrkOff`, `btnMenu` (and `btnPlay` if it’s in the same row in current layout)
- MUST not introduce new pages or extra dialogs.
- MUST store the docking mode in Firebase (UI state).

## UI Requirements

### A) Transparent style
Apply CSS so that:
- `.row.controls` has transparent background (no background fill).
- Buttons in `.row.controls` have transparent background.
- Keep borders readable (use existing `currentColor` styling approach).

Acceptance checks:
- You can see the video/transcript behind the row background (no opaque bar).
- Buttons do not have a filled/colored background (unless already used to indicate play/pause state elsewhere — keep that behavior if it exists).

### B) Docking toggle
Add one toggle control inside the existing menu dialog `dlgMenu`.

Behavior:
- When toggle is OFF: controls row stays in normal document flow.
- When toggle is ON: controls row becomes fixed at the bottom of the viewport.

Recommended minimal CSS for docked mode:
- `position: fixed; left: 0; right: 0; bottom: 0;`
- Keep horizontal padding consistent with the page.
- Ensure content is not hidden behind the docked controls (add a small bottom padding/margin to the main content when docked).

Acceptance checks:
- Switching mode immediately moves the controls row.
- Docked row stays visible while scrolling.
- Page content remains reachable and not blocked behind the docked row.

## Persistence (Firebase)
Store the docking mode under the existing UI state root:

- Path: `../db_youtube2/ui_state/yout_pl2/controls_dock_bottom`
- Type: boolean (`true` = docked, `false` = normal)

Rules:
- Load setting on startup and apply before the user interacts.
- Save setting whenever user toggles the mode.
- If setting is missing, default to `false` (normal mode).

## Implementation Notes (suggested)
- Add helper functions:
  - `setControlsDocked(isDocked)`
  - `saveControlsDockedSetting(isDocked)`
  - `loadControlsDockedSetting()`
- Apply docked state via a `data-*` attribute on the controls row or `body`, e.g.:
  - `body[data-controls-docked="1"] .row.controls { ... }`
  - This keeps layout changes centralized in CSS.

## Done Definition
- Controls row/buttons are transparent.
- Menu contains a toggle for dock/normal.
- Mode persists in Firebase and restores correctly.