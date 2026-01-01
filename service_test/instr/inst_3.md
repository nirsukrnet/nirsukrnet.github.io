## yout_pl1.html — UI improvements (spec)

Goal: make the page more compact on mobile and add a simple “mark” feature for the current transcript line.

Storage reminder:
- Transcript is stored per videoId in Firebase at `db_youtube1/youtube_transcripts/{videoId}`.
- Each transcript row is an `item` in the `items` array.

---

## 1) Single Play/Pause button (save space)
Remove the separate Pause button and keep only one control:

`<button id="btnPlay">Play</button>`

Behavior:
- When the player is paused/stopped → button label is `Play`.
- When the player is playing → button label becomes `Pause`.
- Clicking the button toggles the state (Play ⇄ Pause).

Acceptance:
- No extra Pause button is visible.
- The label always matches current player state.

---

## 2) Add a right-side “Menu” button (modal)
Add a small `Menu` button on the right side of the control row.
Clicking it opens a modal with actions:

Menu actions:
- **Paste transcript** (opens the existing paste dialog or embeds paste UI inside this menu)
- **Hide/Show Transcription** (toggle transcript panel)
- **Hide/Show Time** (toggle the time display)

Notes:
- “Paste transcript” should not take permanent space in the main UI.
- The menu is the main place for these secondary actions.

---

## 3) Default visibility rules
Defaults when the page loads:
- Transcript panel: **visible** (shown by default).
- Time display (`Time: ...`): **hidden** (not shown by default).

User can change both via the Menu toggles.

---

## 4) Add “Mark1” button
Add a new primary button:

`<button id="btnMark1">Mark1</button>`

Add a second button to remove the mark:

`<button id="btnMrkOff">MrkOFF</button>`

Behavior:
- When clicked, it sets `Mark1: true` on the **current active transcript item**.
  - “Current active item” = the row highlighted as active while the video plays, or the row you last tapped in the transcript list.
- If there is no transcript loaded or no active item, do nothing (or show a short status message).

UI:
- Items with `Mark1: true` must be visually highlighted in the transcript list after loading from Firebase and after saving.

Optional (nice behavior, still minimal):
- If the active item already has `Mark1: true`, clicking again can toggle it back to `false`.

MrkOFF behavior:
- When clicked, it sets `Mark1: false` on the current active transcript item and saves to Firebase.

---

## 5) Data format (how Mark1 is stored)
Each transcript item remains `{ t, text }` and can include the new flag:

Example payload:
```json
{
  "videoId": "maKy1pRdcDw",
  "source": "manual",
  "updatedAt": "2026-01-01T...Z",
  "items": [
    {
      "t": 1,
      "text": "[Music]",
      "Mark1": true
    }
  ],
  "rawText": "..."
}
```

Important:
- `Mark1` is stored **inside the correct item** in `items`.
- Saving to Firebase must preserve the flag.

