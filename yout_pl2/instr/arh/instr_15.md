

# instr_15 — Sessions Menu with 3 Buttons (no combobox)

## Goal

In `rec_voice.html`, remove the Sessions `<select>` combobox (`#selSession`) UX.

Instead, the Sessions menu (`<div id="mainMenu">`) uses a simple 3-button structure:

1) **Create new session** (opens `#dlgCreateSession`)
2) **Select existing session** (opens a dialog with a clickable list UI like screenshot #2)
3) Existing **YouTube menu** button (`#btnRecYoutubeMenu`) stays as-is

## Target file

- `rec_voice.html` (top-right Sessions panel: `<div id="mainMenu">`)

## New markup structure (inside `#mainMenu`)

Replace the current Session `<select>` row with a button row:

```html
<div class="row" style="flex-wrap:nowrap;">
	<button id="btnCreateSession" type="button" title="Create new session">New</button>
	<button id="btnSelectSession" type="button" title="Select existing session">Select</button>
	<button id="btnRecYoutubeMenu" type="button" title="Choose YouTube reference video">Menu</button>
</div>
```

Notes:

- Button labels can be short (mobile-friendly). Titles must be descriptive.
- `#btnRecYoutubeMenu` must keep its existing behavior.

## Select Existing Session dialog

Add a new dialog similar in style to the YouTube picker (rounded list rows):

Required elements:

- Dialog id: `dlgSessionsMenu`
- Optional filter input: `inSessionsFilter`
- List container: `sessionsList`

Example shape:

```html
<dialog id="dlgSessionsMenu">
	<form method="dialog">
		<button value="cancel" aria-label="Close" title="Close" style="position:absolute; top:8px; right:8px; width:32px; min-height:32px; padding:0; border-radius:10px; line-height:1; font-size:18px;">×</button>
		<strong>Sessions</strong>
		<div class="row" style="margin:10px 0 10px;">
			<input id="inSessionsFilter" placeholder="type to filter" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid currentColor; border-radius:10px;" />
		</div>
		<ul id="sessionsList" style="list-style:none; padding:0; margin:0; display:grid; gap:6px;"></ul>
	</form>
</dialog>
```

CSS requirements (same feel as screenshot #2):

- Each session is a rounded clickable row.
- The list has a max height and scroll.
- Active session row is visually highlighted.

## Behavior requirements

### Create button

- Clicking `#btnCreateSession` opens existing dialog `#dlgCreateSession`.
- Save/Cancel behavior stays unchanged.

### Select button

- Clicking `#btnSelectSession` opens `#dlgSessionsMenu`.
- On open, load sessions (same source: `sessionsIndex`) and render them as clickable rows.
- Optional filter narrows by substring match across: `title`, `description`, `youtube_ids`, `id`.

### Selecting a session

Clicking a session row must trigger the same app behavior as the old combobox selection:

- `selectSession(sessionId)`
- updates `activeSessionId`
- refreshes transcript items window
- updates the YouTube label in the Sessions panel
- closes the `#dlgSessionsMenu` dialog

### No combobox dependency

- The UI must not rely on native `<select>` dropdown.
- If `#selSession` is kept temporarily, it must be hidden and must not be the primary UX.

## Acceptance criteria

- `#mainMenu` contains only buttons for session actions (Create / Select / YouTube menu).
- Selecting existing sessions uses a clickable list UI (rounded items) like screenshot #2.
- Active session is clearly indicated.
- All existing session logic continues to work (load, attach YouTube, transcript refresh).