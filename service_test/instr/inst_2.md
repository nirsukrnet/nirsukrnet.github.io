
## yout_pl1.html — what we see in screenshots, issues, and fixes

### What the screenshots show
- Page: `http://localhost:8080/yout_pl1.html`
- YouTube video is embedded via the IFrame Player API.
- Custom control buttons work (Play/Pause/-5s/+5s) and current time is displayed.
- Transcript panel is open and shows rows like `24:37`, `24:40`, `24:42`… with the English text.
- One transcript row is highlighted (border) — this indicates the “active” line for the current playback time.

### UI behavior (expected)
- When the transcript panel is visible, the app checks `player.getCurrentTime()` about every 250ms.
- It finds which transcript item matches the current time and highlights it.
- When the active row changes, the page scrolls that row into view (`scrollIntoView({ block: 'nearest' })`).

### Why transcript is a long scrolling list
The transcript can be large, so it is rendered as a scrollable list. This is normal for mobile.
If we want to make it more comfortable on mobile, we can:
- Limit the transcript panel height and make it scroll inside the panel (CSS max-height + overflow).
- Increase spacing/font size per row.

---

## Console errors that happened and how we fixed them

### Error 1: YouTube widget postMessage origin mismatch
Example error:
`www-widgetapi.js: Failed to execute 'postMessage' ... target origin 'https://www.youtube.com' does not match recipient origin 'http://localhost:8080'`

Cause:
- The embedded YouTube widget needs the correct parent `origin` to be provided when running on localhost / GitHub Pages.

Fix:
- In `yout_pl1.html` we set:
	- `playerVars: { ..., origin: location.origin }`

### Error 2: Save transcript failed (GlobalVars not available)
Example error:
`YouTubeTranscriptStore: GlobalVars is not available (load ./assets/js/global_var.js first)`

Cause:
- `global_var.js` defines `class GlobalVars`, but depending on browser mode it may exist as a global binding (`GlobalVars`) and not as `window.GlobalVars`.
- The first version of `youtube_transcript_store.js` only checked `window.GlobalVars`.

Fix:
- `assets/js/youtube_transcript_store.js` now detects `GlobalVars` using:
	- `typeof GlobalVars === 'function'` (and falls back to `globalThis.GlobalVars` / `window.GlobalVars`).

---

## How transcript text appears (important)
- YouTube IFrame Player API does NOT provide the real transcript text automatically.
- In `yout_pl1.html` the transcript text comes from manual paste:
	- Click **Paste transcript** → paste text in the `0:04` / text format → Apply or Save.

### Timestamp format in the transcript list
- Internally, transcript items store time as seconds: `{ t: numberSeconds, text: "..." }`.
- In the UI we display it as `m:ss` (or `h:mm:ss` for long videos):
	- Example: `24:37` (minutes:seconds)
	- Example: `0:04` (4 seconds)

### Firebase storage
- The transcript is saved per videoId at:
	- `db_youtube1/youtube_transcripts/{videoId}`
- This uses the same Firebase credentials and request logic from `assets/js/global_var.js`.

---

## Future plan: show 2 lines (translation)
Right now each transcript row displays only one text string.

Planned idea:
- Line 1: original text (example: `text_en` or `text_en/sv`)
- Line 2: translation (example: `text_uk` / `text_ru`), computed from line 1 (e.g. `trans(text_en)`)

When we implement it, we can either:
- Extend each item to `{ t, text1, text2 }`, or
- Use `{ t, lines: ["...", "..."] }` so it can support more languages later.


  <div class="row">
    <button id="btnPlay">Play</button>
    <button id="btnPause">Pause</button>
    <button id="btnBack">-5s</button>
    <button id="btnFwd">+5s</button>
    <span>Time: <span id="t">0.00</span>s</span>
  </div>

  <div class="row">
    <button id="btnToggleTrans">Transcription</button>
    <button id="btnPasteTrans">Paste transcript</button>
    <button id="btnPrev" disabled>Prev</button>
    <button id="btnNext" disabled>Next</button>
  </div>

