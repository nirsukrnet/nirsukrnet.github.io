
## Update request: `rec_voice.html` (history UX + c_menu)

Target page:
- `C:\Python\AuTr\html\rec_voice.html`

---

## 1) Move some buttons into a compact menu (`c_menu`)
Add a compact controls menu (named `c_menu`) and hide these buttons inside it (not always visible on the main row):
- `#btnToggleMeta` (Meta show/hide)
- `#btnPermission` (mic permission/status)

Expected UX:
- On the main controls row show only a minimal set of primary actions.
- `c_menu` opens via a small menu button (example label: `⋯` or `Menu`).
- Inside `c_menu`, render the moved buttons exactly (same behavior), just relocated.

---

## 2) Add button `E` (explicit “end phrase”)
Add a new button labeled `E`.

Meaning:
- `E` explicitly finalizes the currently accumulated text in `#latestText` and moves it to `#history`.

Important behavior rule:
- Text should move from `#latestText` to history **ONLY when the user clicks `E`**.
- Do NOT auto-finalize into history because of silence/timeouts/recognition pauses.
- In all other cases, keep accumulating/keeping text in `#latestText`.

After clicking `E`:
- Add the current `#latestText` content into history (respect history ordering rules).
- Clear `#latestText` to `(empty)`.

---

## 3) Select history items
For each history item, add a selectable control (button or checkbox) to mark it as selected.

Requirements:
- Selected state is clearly visible.
- Selection does not delete anything by itself.
- Selection should be possible for multiple items.

---

## 4) Delete selected history items (with confirmation)
Add a “Clear selected” action button.

Behavior:
- If no items are selected, either disable the button or show a short message.
- If items are selected, clicking the button must open a confirmation dialog.
- Only after confirmation, delete the selected items from `#history`.

Confirmation dialog:
- Must clearly say how many items will be deleted.
- Provide Cancel and Delete actions.

---

## Acceptance criteria
- `#btnToggleMeta` and `#btnPermission` are accessible via `c_menu` and not shown in the main control row by default.
- Clicking `E` is the only way to commit the accumulated `#latestText` into history.
- History items can be selected/deselected.
- “Clear selected” deletes only selected items, only after confirmation.
