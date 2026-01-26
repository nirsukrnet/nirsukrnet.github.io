# instr_17 — Contexts menu (dlgMenu) layout update

Base reference: [instr_16.md](instr_16.md)

## Goal
Update the `dlgMenu` dialog to become a **Contexts menu** with a clear section structure and a strict button order.

## Rename
- Dialog title text: change from `Menu` to `Contexts menu` (spelling exactly).

## Required sections (in this exact order)

### 1) Section: Paste / Edit language
Buttons must appear in this exact order (left → right):
1. (dynamic) language buttons (e.g. `SV`, `EN`, `UK`) — changes active language context for paste/edit.
2. `btnMenuPaste` — label: `Paste transcript` — opens transcript paste dialog.

Notes:
- The language buttons are rendered dynamically into container `#langRow`.

### 2) Section: Show in playback
Section name: `Show in playback`

#### Subsection: Line 1
- Container: `#langRowShow1`
- Buttons:
  - (dynamic) language buttons (e.g. `SV`, `EN`, `UK`) — selects language shown on transcript line 1.

#### Subsection: Line 2
- Container: `#langRowShow2`
- Buttons:
  - (dynamic) language buttons and/or `Off` (if supported) — selects language shown on transcript line 2 (or disables it).

### 3) Section: Toggles / Close
Section container: last `.row` of the dialog.

Buttons:
- `btnMenuToggleTrans` — toggles transcript panel.
- `btnMenuToggleTime` — toggles time display.
- `btnMenuToggleTransTime` — toggles per-line transcript timestamps.
- `btnMenuToggleControlsDock` — docks/undocks controls row.
- `btnPlayMode` — cycles playback behavior modes.

Also include these buttons (still part of the dialog controls):
- (no id) `Close` — closes the dialog (native `<form method="dialog">` behavior).
- `btnMenuHome` — label: `Home` — navigates to site home.

Placement rule:
- `btnMenuHome` must be moved to the **top left corner** of the dialog.
- `Close` must be moved to the **top right corner** of the dialog.

### 4) Section: Debug
Buttons in this exact order:
1. `btnStoreDebug` — label: `Store Debug` — saves runtime debug info to Firebase (`.../debug_info`).
2. `btnOpenYoutube` — label: `Open YouTube` — opens the current video in `youtube.com`.
3. `btnOpenYoutubeApp` — label: `Open App` — attempts to open the current video in the YouTube app (fallback to `youtube.com`).

## Acceptance checklist
- Title shows `Contexts menu`.
- Sections appear in the exact order above.
- Buttons inside each section appear in the exact order above.
- `btnMenuHome` is at top-left of the dialog.
- `Close` is at top-right of the dialog.
- Existing ids remain unchanged (so current JS wiring keeps working).

## dlgMenu HTML (target layout)

Use this as the **source** HTML for the dialog (not runtime DOM).

```html
  <dialog id="dlgMenu">
    <form method="dialog">
      <!-- Header (Home top-left, Close top-right) -->
      <div class="row" style="margin:0 0 8px; align-items:center;">
        <button id="btnMenuHome" type="button" title="Home">Home</button>
        <h3 style="margin:0; font-size:16px;">Contexts menu</h3>
        <button value="cancel" style="margin-left:auto;">Close</button>
      </div>

      <!-- Section: Paste / Edit language -->
      <div class="muted" style="margin:0 0 6px;">Paste / Edit language</div>
      <div class="row" style="margin:0 0 12px; align-items:center;">
        <div id="langRow" class="row" style="margin:0; flex:1 1 auto;"></div><button id="btnMenuPaste" value="cancel">Paste transcript</button>
      </div>

      <!-- Section: Show in playback -->
      <div class="muted" style="margin:0 0 6px;">Show in playback</div>
      <div class="muted" style="margin:0 0 6px; font-size:12px;">Line 1</div>
      <div id="langRowShow1" class="row" style="margin:0 0 10px;"></div>
      <div class="muted" style="margin:0 0 6px; font-size:12px;">Line 2</div>
      <div id="langRowShow2" class="row" style="margin:0 0 8px;"></div>

      <!-- Section: Toggles / Close -->
      <div class="row" style="margin:8px 0 0;">
        <button id="btnMenuToggleTrans" value="cancel">Hide transcription</button>
        <button id="btnMenuToggleTime" value="cancel">Show time</button>
        <button id="btnMenuToggleTransTime" value="cancel">Hide transcript time</button>
        <button id="btnMenuToggleControlsDock" value="cancel">Dock controls bottom</button>
        <button id="btnPlayMode" type="button" title="Toggle playback behavior">Play mode - All</button>
      </div>

      <!-- Section: Debug -->
      <div class="muted" style="margin:10px 0 6px;">Debug</div>
      <div class="row" style="margin:0;">
        <button id="btnStoreDebug" type="button" title="Save runtime debug info to Firebase">Store Debug</button>
        <button id="btnOpenYoutube" type="button" title="Open current video in youtube.com (best for Premium/no-ads)">Open YouTube</button>
        <button id="btnOpenYoutubeApp" type="button" title="Open current video in the YouTube app">Open App</button>
      </div>
    </form>
  </dialog>
```


lets update again only this instr. 

1) move 
id="btnMenuHome" to the left top corner

2) <div id="langRow" class="row" style="margin:0; flex:1 1 auto;" paste in the same line with 
<button id="btnMenuPaste" value="cancel">Paste transcript</button>

instead of <button id="btnAddVideo"