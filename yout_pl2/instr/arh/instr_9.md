
# Update request: rec_voice.html — Firebase “recording sessions” storage

## Goal
Add a “recording session” selector into a **separate main menu** placed in the **top-right corner** of `rec_voice.html`, backed by Firebase RTDB.

Each session has:
- A metadata record (title/description/updated time)
- A list of saved phrase items (datetime/text/lang)

The user can:
- Select an existing session → loads its items into history
- Create a new session → appears in the list and becomes active
- Save phrases from the current UI into the active session

## Target
- File: `C:\Python\AuTr\html\rec_voice.html`

## DB paths (Firebase RTDB)

### DB root
Use the same DB root constant pattern as yout_pl2:

- Prefer: `gv.cst.getcst('DB_CONST_DB_YOUTUBE2_ROOT')` (if available)
- Fallback: `window.YT_DB_CONST?.DB_YOUTUBE2_ROOT` (if available)
- Fallback: `'../db_youtube2'`

Let `ROOT = DB_YOUTUBE2_ROOT`.

### 1) Session metadata list
Path:
- `ROOT + '/ref_rec_storage'`

Shape:
- `ROOT + '/ref_rec_storage/{item_id}' = { title, description, updateAt }`

Fields:
- `title` (string) — visible in UI list
- `description` (string, optional)
- `updateAt` (number, unix ms) — updated on create and on any change to this session’s data

Notes:
- Original note had `tittle`; use `title` in DB and UI.

### 2) Session items
Path:
- `ROOT + '/rec_storage_data'`

Shape:
- `ROOT + '/rec_storage_data/{item_id}/{entry_id}' = { datetime, text, lang }`

Fields:
- `datetime` (number, unix ms)
- `text` (string)
- `lang` (string) — language code from the existing language selector

Rules:
- `{item_id}` MUST be the same key as the session key in `ref_rec_storage`.
- `{entry_id}` MUST be a small **incremental numeric key** like `0..1..2..` (array-like approach), similar to `/youtube_transcripts/<videoId>/items`.

Entry id allocation rule (client):
- Load existing children under `ROOT + '/rec_storage_data/{item_id}'`
- Compute `nextId = max(existingNumericKeys) + 1` (or `0` if empty)
- Save the new entry to `.../{nextId}`

Note:
- This is not safe for concurrent writers without a transaction/lock; for now assume single-writer UI.

## UI/UX

### Location
Create a **separate main menu panel** anchored to the **top-right** of the page.

Implementation note:
- Use `position: fixed; top: <px>; right: <px>; z-index: 1000;` so it stays visible.
- This menu replaces the compact menu (`c_menu`) for session selection.

### Components
1) “Session” list
- A select/list UI populated from `ROOT + '/ref_rec_storage'`.
- The first/top option is a pseudo-item: `+ Create new one…`

2) Create session dialog
When user chooses `+ Create new one…`:
- Open a dialog with:
  - Input `Title`
  - (Optional) Input/textarea `Description`
  - Buttons: `Save`, `Cancel`

Default Title behavior:
- Pre-fill Title with current date-time in format: `DD-MM-YYYY HH:mm` (example: `22-01-2026 15:05`).
- Move cursor to the end of the Title input after setting default value.

Create session Save behavior:
- Generate a new `item_id` using timestamp format: `DD-MM-YYYY_HH_mm_ss`
- Write metadata to `ROOT + '/ref_rec_storage/{item_id}'`.
- Set the newly created session as the active selection.
- Load/clear history UI for this session (should be empty initially).

Item id uniqueness:
- If an `item_id` already exists (created in same second), append a short suffix: `DD-MM-YYYY_HH_mm_ss__2`, `__3`, etc.

Cancel behavior:
- Close dialog and keep previous selection unchanged.

### Selecting an existing session
When the user selects an existing session:
- Load all items from `ROOT + '/rec_storage_data/{item_id}'`.
- Render them in History (newest-first, consistent with current history UI).
- Do not automatically change speech recognition behavior.

### How phrases are saved
Integrate with the current “E” (end phrase / commit) flow:
- When user clicks “E” to commit text into history, also persist it to the active Firebase session.
- If there is no selected session yet, show a small status warning: “Select or create a session first.” and do not write.

### Deletion behavior (optional but recommended for consistency)
If the UI supports “Clear selected” history items:
- Each history item should keep a reference to `{entry_id}` (and `{item_id}` implicitly via current session).
- On confirmed delete, remove items from UI AND delete corresponding `ROOT + '/rec_storage_data/{item_id}/{entry_id}'`.
- Update session `updateAt` after deletion.

## Loading / ordering
- Order session list by `updateAt` descending (most recently used first).
- Order session items by `datetime` descending (newest first).

## Persistence (client)
Do NOT use `localStorage`.

Persist last selected session into Firebase UI state under DB root:
- Path: `ROOT + '/ui_state/rec_voice'`
- Shape: `{ selected_session_id, updateAt }`

Rules:
- Whenever user changes session selection, write `selected_session_id` to UI state.
- On page load, read UI state and restore that selection (if the session still exists).

## Errors / offline behavior
- If Firebase is not available / user not signed-in:
  - Session list shows a disabled state and a message like “Firebase not ready”.
  - Local speech recognition UI remains functional.
- All Firebase failures should be shown in `#status` and logged to console.

## Acceptance criteria
1) Session selector appears in a fixed top-right main menu and is loaded from `ROOT + '/ref_rec_storage'`.
2) `+ Create new one…` opens a dialog; Title defaults to `DD-MM-YYYY HH:mm` and cursor is at end.
3) Creating a session uses `item_id = DD-MM-YYYY_HH_mm_ss`, writes metadata to `ref_rec_storage/{item_id}`, and selects it.
4) Selecting a session loads and renders its stored phrase items from `rec_storage_data/{item_id}`.
5) Clicking “E” with an active session saves the committed phrase into both UI history and Firebase using `{entry_id}` incremental numeric keys.
6) `updateAt` is updated whenever data for the session changes (create / save phrase / delete).

7) Last selected session is restored from `ROOT + '/ui_state/rec_voice'` (no localStorage).
- `{entry_id}` can be a generated unique id 



