
## UI areas reference (for screenshots)
This file describes the UI areas visible in `rec_voice.html`.
Use these names/IDs as a shared vocabulary for future instructions and development tasks.

---

## A) Main page (base layout)

### A1. Header area
- Container: `<header>`
- Title: page heading (`<h1>rec_voice</h1>`)
- Subtitle: `.sub` (contains environment note about HTTPS/localhost)

### A2. Controls row
- Container: `.row` (first row inside `<main>`)

#### A2.1 Language selector
- Select: `#selLang`
- Values:
	- `uk-UA` (Ukrainian)
	- `en-US` (English)
	- `sv-SE` (Swedish)
- Behavior note: language is applied on the next recognition start (recognizer is recreated each start).

#### A2.2 Microphone permission button
- Button: `#btnPermission`
- Purpose: request/check microphone permission using `getUserMedia({ audio: true })`.
- State attribute:
	- `data-state="unknown" | "allowed" | "denied" | "unsupported"`
- Label behavior:
	- `Permission mic` (unknown)
	- `Mic: allowed`
	- `Mic: denied`
	- `Mic: unsupported`
- UX rule: while recognition is recording, this button is disabled to reduce confusion.

#### A2.3 Recognition start/stop button
- Button: `#btnRec`
- State attribute:
	- `data-state="idle" | "recording"`
- Label behavior:
	- `Start recognition` (idle)
	- `Stop recognition` (recording)
- Enabled/disabled logic:
	- Disabled if speech recognition is not supported.
	- Disabled when mic permission is explicitly denied.
	- Disabled while already recording.

---

## B) Status / messages

### B1. Status message strip
- Element: `#status` (class `status`)
- Purpose: show info/warn/ok messages (permission status, recognition start/stop, errors).
- Visibility:
	- Hidden by default using the `hidden` attribute.
- Optional dataset:
	- `data-kind` is set by JS (e.g., `info`, `warn`, `ok`).

---

## C) Transcript output panel

### C1. Scrollable output panel
- Container: `#panel` (class `panel`)
- Behavior: auto-scrolls to the bottom when new content is added.

### C2. Latest segment area
- Wrapper: `.latest`
- Title: `.latestTitle` (text: “Latest segment”)
- Content: `#latestText`
- Purpose:
	- Shows live/interim recognition text (“last frame of speaking”).
	- Shows `(empty)` if there is no current interim text.

### C3. History area
- Container: `#history`
- Each finalized segment is appended as `.item` containing:
	- `.meta` (time + language)
	- Body text of the recognized final segment

---

## D) Browser/API dependencies (important for screenshots)
- Speech recognition support depends on `window.SpeechRecognition` / `window.webkitSpeechRecognition`.
- Microphone access typically requires HTTPS or `http://localhost` (not `file://`).
- Permissions API (`navigator.permissions.query({ name: 'microphone' })`) may be unavailable; UI still works via `getUserMedia`.

---

## Notes for writing future instructions
- Prefer referencing **area name + element id** (example: “A2.3 Recognition button `#btnRec`”).
- When describing a screenshot, mention:
	- `#btnPermission` state (unknown/allowed/denied/unsupported)
	- `#btnRec` state (idle/recording)
	- The latest segment text vs finalized history items.
