## UI areas reference (for screenshots)
This file describes the main UI areas visible in the `yout_pl2.html` page screenshots.
Use these names/IDs as a shared vocabulary for future instructions and development tasks.

---

## A) Main page (base layout)

### A1. Top-right **Main menu** button
- Element: `#btnMainMenu` (fixed position: top-right)
- Purpose: opens the main “video list / tag filter” dialog (`#dlgMainMenu`).

### A2. YouTube player area
- Wrapper: `#playerWrap`
- Player mount: `#player`
- Purpose: embedded YouTube IFrame Player.

### A3. Control bar (main playback/tools row)
- Container: `.row.controls`
- Buttons:
	- `#btnPlay` — Play/Pause (also shows time/state in some modes)
	- `#btnMark1` — Mark line (short label: `Mr`)
	- `#btnMrkOff` — Mark-off (label: `MOFF`)
	- `#btnAIcopy` — Copy grammar prompt (label: `AI`)
	- `#btnPasteAI` — Paste grammar response (label: `Resp`)
	- `#btnMenu` — opens the local in-page menu dialog (`#dlgMenu`)
- Note: this row can be “docked” to bottom via `body[data-controls-docked="1"]`.

### A4. Transcript panel (scrollable)
- Container: `#transWrap` (scroll container)
- List: `#transList` (list of transcript rows)
- Purpose: shows transcript items for the current video; clicking a row typically jumps playback.

### A5. Transcript row structure (inside `#transList`)
Each transcript row is a `<li>` and may contain:
- Timestamp `<small>` (can be hidden by `#transWrap[data-ts="0"]`)
- Text lines:
	- `.trLine` (line 1)
	- `.trLine2` (line 2)
- Highlight bar:
	- `.highlight-explan` (a thin bar used for response/mark visualization)

Row state attributes (used for styling and logic):
- `data-active="1"` — current “now playing” line
- `data-mark1="1"` — marked line
- `data-resp="1"` — has response/explanation

---

## B) Dialogs / overlays

### B1. Local Menu dialog (tools/settings)
- Dialog: `#dlgMenu` (opened from `#btnMenu`)
- Areas inside:
	- Language row: `#langRow` (buttons to select edit/paste language)
	- Actions:
		- `#btnMenuPaste` — open paste transcript dialog (`#dlgTrans`)
		- `#btnAddVideo` — open add video dialog (`#dlgAddVideo`)
	- Playback display language selectors:
		- `#langRowShow1` — language for transcript Line 1
		- `#langRowShow2` — language for transcript Line 2
	- Toggles/tools:
		- `#btnMenuToggleTrans` — show/hide transcript panel
		- `#btnMenuToggleTime` — show/hide time
		- `#btnMenuToggleTransTime` — show/hide transcript timestamps
		- `#btnMenuToggleControlsDock` — dock controls bottom
		- `#btnPlayMode` — playback mode toggle
		- `#btnMenuHome` — “Home” action

### B2. Paste Transcript dialog
- Dialog: `#dlgTrans`
- Input:
	- `#taTrans` — textarea for pasted transcript text
	- `#transLangInfo` — shows current language/context
- Actions:
	- `#btnApplyTrans` — parse and apply transcript into UI
	- `#btnSaveTrans` — save to Firebase
	- `#transStatus` — status text

### B3. Response / Explanation dialog
- Dialog: `#dlgResp` (has `data-mode="edit"|"html"`)
- Areas:
	- `#respInfo` — context info about current item
	- Edit/Preview mode buttons: `#btnRespEdit`, `#btnRespHtml`
	- `#taResp` — Markdown editor
	- `#respPreview` — HTML preview output
	- `#btnRespSave` — save response
	- `#respStatus` — status text

### B4. Main Menu dialog (video list + tag + filter)
- Dialog: `#dlgMainMenu` (opened from `#btnMainMenu`)
- Close button: `#btnMainMenuClose`
- Tag buttons row: `#mainMenuTagRow`
- Text filter input: `#inMainMenuShortFilter`
- Status text: `#refVideosStatus`
- Video list: `#refVideosList` (select a video to load)

### B5. Add Video dialog
- Dialog: `#dlgAddVideo`
- Form: `#frmAddVideo`
- Inputs:
	- `#inIndentId`, `#inUrl`, `#inShortName`, `#inTitle`, `#inTag`, `#inOrder`, `#inDesc`
- Save/status:
	- `#btnSaveVideo`
	- `#addVideoStatus`

---

## Notes for writing future instructions
- Prefer referencing **area name + element id** (example: “A4 Transcript panel `#transWrap`”).
- When describing a screenshot, mention what dialogs are open (B1–B5) and which row in A4 is active/marked/responded.
