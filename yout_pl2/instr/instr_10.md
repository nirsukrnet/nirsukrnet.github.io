# Update request: rec_voice.html — attach YouTube video to session + migrate `atupdate` → `updatedAt`

## Goal
In `rec_voice.html`, extend the top-right Sessions main menu (`<div id="mainMenu">`) with a **YouTube picker** (reuse the UX idea of `btnMainMenu` / `dlgMainMenu` from `yout_pl2.html`).

When a user selects a YouTube reference video, save its `videoId` into the **currently active** session metadata stored in Firebase RTDB under `ref_rec_storage`.

Also migrate the session metadata timestamp field:
- Replace numeric `atupdate` with ISO string `updatedAt`.

## Target
- File: `C:\Python\AuTr\html\rec_voice.html`

## DB (Firebase RTDB)

### Session metadata path
- `ROOT + '/ref_rec_storage/{sessionId}'`

### Required metadata shape (NEW)
Store session records like:

```json
{
  "updatedAt": "2026-01-19T06:38:23.143Z",
  "description": "",
  "title": "22-01-2026 16:10 test1",
  "youtube_ids": "dQw4w9WgXcQ"
}
```

Notes:
- Keep field name exactly `youtube_ids` (string). For now it stores **one** `videoId`.
- `updatedAt` MUST be ISO string from `new Date().toISOString()`.

### Legacy data / migration (IMPORTANT)
There is already legacy data with numeric `atupdate`.

New rule: **do not use `atupdate` for sorting or as a runtime fallback** anymore.

Migration approach (lazy, client-side):
- When loading `ref_rec_storage`, for each session record:
  - If `updatedAt` exists and is valid ISO → use it.
  - If `updatedAt` is missing/invalid:
    - Generate `updatedAt`.
      - If legacy `atupdate` exists and is a valid number: `updatedAt = new Date(atupdate).toISOString()`
      - Else: `updatedAt = new Date().toISOString()`
    - Write back to Firebase via `PATCH` to `ref_rec_storage/{sessionId}` with `{ updatedAt }`.

Sorting:
- Sort sessions ONLY by `Date.parse(updatedAt)` descending.

## UI/UX

### Where to add
Inside the existing top-right Sessions panel (`#mainMenu`) add a YouTube section:

- Button: `Menu` (same label as `yout_pl2.html`)
- Read-only text/status line: shows the current selected YouTube **`short_name`** for the active session

Rules for the display line:
- If session has `youtube_ids` set:
  - Look up that `videoId` in `DB_CONST_REF_YOUTUBE_VIDEOS`.
  - Display `short_name` if present.
  - Fallback display: the `videoId` itself.
- If no `youtube_ids` selected yet: show `(none)`.

### Dialog (YouTube picker)
Add a dialog similar to `yout_pl2.html` main menu:

- `<dialog id="dlgRecYoutubeMenu">`
- Contains:
  - Close button (×)
  - Optional filter input
  - List of reference videos (title + videoId)

Data source for list:
- Use the existing Firebase reference videos dataset:
  - `gv.cst.getcst('DB_CONST_REF_YOUTUBE_VIDEOS')` (same as yout_pl2)

### Selection behavior
When user clicks an item in the YouTube picker:
- If no active session is selected (`activeSessionId` is empty):
  - Show status: “Select or create a session first”
  - Do not save
- Else:
  - Save to `ROOT + '/ref_rec_storage/{activeSessionId}'` via PATCH:
    - `youtube_ids = <selectedVideoId>`
    - `updatedAt = new Date().toISOString()`
  - Update Sessions UI to show the selected id.
  - Close the dialog.

## Acceptance criteria
1) Sessions metadata uses `updatedAt` ISO string on any write.
2) Sessions list sorting uses ONLY `updatedAt`.
3) If a session record lacks `updatedAt` but has legacy `atupdate`, the UI lazily migrates it by writing `updatedAt = new Date(atupdate).toISOString()`.
4) Sessions panel shows a `Menu` button to open a YouTube picker.
5) Choosing a video updates `ref_rec_storage/{sessionId}.youtube_ids` and `updatedAt`.
6) If no session is selected, choosing a video does not write and shows a clear status message.
7) Sessions panel displays the selected YouTube `short_name` (fallback to `videoId`).

## UI/UX (NEW): show 3 transcript items

### Where to add (main page)
On the main page, **after** this line:

```html
<div class="sub">Live microphone speech-to-text. Note: mic access usually requires HTTPS or <code>localhost</code>.</div>
```

Add a small “Transcript items” window that shows **3 items** from the selected YouTube transcript (`youtube_ids`).

### Data source (Firebase RTDB)
Use the selected `videoId = <selectedVideoId>` from the active session field `youtube_ids`.

Read transcript items from:
- Full absolute path form: `/db_youtube2/youtube_transcripts/{selectedVideoId}/items/{index}`
- Equivalent relative-to-ROOT form (if `ROOT == '/db_youtube2'`): `ROOT + '/youtube_transcripts/{selectedVideoId}/items/{index}'`

### Window content
Show 3 items starting from `startIndex`:
- item `startIndex`
- item `startIndex + 1`
- item `startIndex + 2`

For each item, show at least:
- index number
- text/content (whatever is stored in the transcript item)

If there are fewer than 3 available items, show the available subset.

If there is no selected YouTube (`youtube_ids` is empty), show a clear message like: “Select YouTube video to view transcript items”.

### Controls
Add 3 buttons next to the window:

1) `Beg`
- Sets `startIndex = 0`
- Reloads and displays items `0,1,2`

2) `Next`
- Moves forward by 1: `startIndex = startIndex + 1`
- Displays the next 3 items starting from the new `startIndex`

3) `Prev`
- Moves backward by 1: `startIndex = max(0, startIndex - 1)`
- Displays the previous 3 items starting from the new `startIndex`

Disable `Prev` when `startIndex == 0`.
If the next item does not exist (end of list reached), disable `Next` (or keep enabled but show “(no more items)”).



<div class="row">
      <label>
        Language:
        <select id="selLang">
          <option value="uk-UA">Ukrainian (uk-UA)</option>
          <option value="en-US" selected="">English (en-US)</option>
          <option value="sv-SE">Swedish (sv-SE)</option>
        </select>
      </label>
      <button id="btnRec" type="button" data-state="idle">Start recognition</button>

      <button id="btnEndPhrase" type="button" title="End phrase: move current text to history">E</button>
      <button id="btnCMenu" type="button" title="Menu">⋯</button>
    </div>