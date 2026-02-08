## Add per-item utility buttons

Add two extra buttons **right after** the existing per-item button:

`<button type="button" class="selBtn" data-on="0">Select</button>`

These buttons should appear in the same header row (next to/after **Select**) for each item.

### 1) Button: `Copy txt`

**Goal:** copy the item body text to clipboard.

- Label: `Copy txt`
- Action: copy *only* the item text (no meta/time/lang).
- UX: after copying, show a short status message (e.g. `Copied.`) or a temporary label change.

### 2) Button: `AI 1`

**Goal:** copy a ready-to-paste prompt + the item text to clipboard.

- Label: `AI 1`
- Action: copy the following string:

```text
Улучший этот текст для лучшего понимания:

<ITEM_TEXT>
```

Notes:
- Use the item text exactly as-is for `<ITEM_TEXT>`.
- Prefer `navigator.clipboard.writeText(...)` when available; otherwise fall back to a safe legacy copy method.

## Layout / spacing

- Minimum horizontal spacing between per-item buttons: **20px**.
  - Implement via CSS (`gap` on the container row) or button margin.

## New button: `Paste txt`

Add a new per-item button:

- Label: `Paste txt`
- Position: in the same header row as other per-item buttons (after `Select`).
- Action: open a dialog that lets the user paste/edit additional text for the item.

### Paste dialog UI

- Dialog contains:
  - a `<textarea>` (multi-line)
  - `Save` button
  - `Cancel` button
- On open:
  - prefill textarea with current `text_pasted` (if any)
- On Save:
  - store textarea value into `text_pasted`
  - close dialog
- On Cancel:
  - close dialog without changes

## Data model change (per item)

Extend stored item schema to include `text_pasted`:

```text
datetime
lang
text
text_pasted
```

- `text` remains the original recognized/transcript text.
- `text_pasted` is user-provided (may be empty).

## Settings UI (Menu dialog)

Add this dialog to the window (if it does not exist already):

```html
<dialog id="dlgCMenu">
  <form method="dialog">
  </form>
</dialog>
```

Inside this menu add a new toggle setting:

- Setting name: `Show pasted`
- States: `ON` / `OFF`
- Purpose: controls whether `text_pasted` is shown in each item.

## Rendering rules for pasted text

When **Show pasted = ON**:

- If `text_pasted` is not empty, render it **after** the main `text`.
- Use a different background color/style for items that have `text_pasted`.

When **Show pasted = OFF**:

- Do not display `text_pasted` (even if stored).

## Button rules for pasted items

If an item has `text_pasted` (non-empty), change the per-item buttons set:

- Show **only**:
  1) `Edit` (opens the same paste dialog to modify `text_pasted`)
  2) `Copy txt` (copies the text shown for the item)

Clarification:
- For pasted items, `Copy txt` should copy the **pasted text** (the user-edited content), not the original `text`.



extend height of
<div id="panel" class="panel" aria-label="Transcript output">
</div>


## Panel height (full window)

Goal: make the transcript output panel use the **full available window height** (instead of being limited by:
`max-height: min(70vh, 720px);`).

Recommended implementation (flex layout):

- Make `body` and `main` a vertical flex layout.
- Let `#panel.panel` grow to fill remaining space.
- Remove the `max-height` limit and keep `overflow-y: auto` for internal scrolling.

Key CSS points:

- `main { flex: 1; display: flex; flex-direction: column; min-height: 0; }`
- `.panel { flex: 1; min-height: 0; max-height: none; overflow-y: auto; }`