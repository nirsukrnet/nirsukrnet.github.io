# yout_pl2 — Main menu (ref videos) minimal + close icon

## Goal
The top-right **Main menu** dialog (`dlgMainMenu`) should stay minimal:
- It mainly shows the saved videos list (`refVideosList`).

But we still want an easy way to close it with a **small close icon button**.

## Current layout (after previous changes)
- `dlgMainMenu` contains only:
	- `<ul id="refVideosList"> ... </ul>`
- The `Add YouTube link` button was moved into the regular **Menu** dialog (`dlgMenu`).

## Requirement
Add a small icon-style close button to `dlgMainMenu`.

### UI / placement
- Put it in the top-right corner of the dialog.
- It should be visually small (icon-like), not a big full-size button.
- It must close the dialog.

### Behavior
- Clicking the close icon closes `dlgMainMenu`.
- `Esc` should still close the dialog as usual.
- The ref videos list loading must keep working.

## Notes
- Do not move other controls back into `dlgMainMenu` (keep it minimal).
- If needed, use a simple `×` character as the icon (no extra assets required).

