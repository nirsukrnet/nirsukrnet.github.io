
# instr_10 — OCR dialog: show/hide translation (persisted)

## File
- Implement in: `C:\Python\AuTr\html\pdf_viewer\pdf_main.html`
- Target UI: dialog `#dlgOcr`

## Goal
Add a toggle button near the existing **Close** button that shows/hides the translation text (from `text_en`) inside the OCR dialog. The toggle state must be persisted and restored on next load.

## UI requirements
1. In `#dlgOcr`, place a new button next to the existing:
	- `<button value="cancel">Close</button>`
2. Button label:
	- When translation is hidden: `trans: OFF`
	- When translation is visible: `trans: ON`
	(Exact text may be adjusted, but must clearly reflect current state.)
3. Button behavior:
	- Clicking toggles between **show translation** and **hide translation**.
	- It must not affect saving OCR entries; it is display-only.

## What “translation” means
- Translation is the English field already stored in OCR entries: `text_en`.
- When translation is **ON**:
  - Show `text_en` in the OCR dialog UI (where the OCR entry text is displayed).
- When translation is **OFF**:
  - Hide `text_en` (or collapse the translation UI region).
- If `text_en` is empty/missing for the selected entry:
  - Still allow toggle ON, but show an empty translation area (or a small “no translation” placeholder).

## Persistence (store/restore)
Persist the last toggle state so the next time the app is opened it uses the same setting.

### Preferred storage
Use the existing settings storage mechanism used in this project:
- `assets/js/settings_store.js` (if already used by `pdf_main.html`), OR
- Firebase RTDB (only if there is already a standard “ui settings” location used by the viewer).

### Key name
Use a stable setting key (suggestion):
- `pdf_viewer.ocrDialog.showTranslation` = boolean

### Default
- Default to `false` (OFF) if no value is stored yet.

## State & update points
1. On app init (or when the dialog is created):
	- Read the persisted value.
	- Apply the UI state (ON/OFF).
	- Update the toggle button label.
2. On toggle click:
	- Update UI immediately.
	- Persist the new value.

## Acceptance checks
- Opening OCR dialog shows translation according to last saved toggle state.
- Toggling updates the UI instantly and updates the button label.
- Refreshing page keeps the chosen toggle state.
- No impact on Firebase OCR save/update logic (only display changes).

