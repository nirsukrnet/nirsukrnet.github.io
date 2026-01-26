# dlgMenu (extracted from yout_pl2.html)

This is the **source** markup for the Menu dialog (not runtime-rendered HTML).

```html
  <dialog id="dlgMenu">
    <form method="dialog">
      <h3 style="margin:0 0 8px; font-size:16px;">Menu</h3>
      <div class="muted" style="margin:0 0 6px;">Paste / Edit language</div>
      <div id="langRow" class="row" style="margin:0 0 10px;"></div>

      <div class="row" style="margin:0 0 12px;">
        <button id="btnMenuPaste" value="cancel">Paste transcript</button>
        <button id="btnAddVideo" value="cancel">Add YouTube link</button>
        <button id="btnStoreDebug" type="button" title="Save runtime debug info to Firebase">Store Debug</button>
        <button id="btnOpenYoutube" type="button" title="Open current video in youtube.com (best for Premium/no-ads)">Open YouTube</button>
        <button id="btnOpenYoutubeApp" type="button" title="Open current video in the YouTube app">Open App</button>
      </div>

      <div class="muted" style="margin:0 0 6px;">Show in playback</div>
      <div class="muted" style="margin:0 0 6px; font-size:12px;">Line 1</div>
      <div id="langRowShow1" class="row" style="margin:0 0 10px;"></div>
      <div class="muted" style="margin:0 0 6px; font-size:12px;">Line 2</div>
      <div id="langRowShow2" class="row" style="margin:0 0 8px;"></div>

      <div class="row" style="margin:8px 0 0;">
        <button id="btnMenuToggleTrans" value="cancel">Hide transcription</button>
        <button id="btnMenuToggleTime" value="cancel">Show time</button>
        <button id="btnMenuToggleTransTime" value="cancel">Hide transcript time</button>
        <button id="btnMenuToggleControlsDock" value="cancel">Dock controls bottom</button>
        <button id="btnPlayMode" type="button" title="Toggle playback behavior">Play mode - All</button>
        <button value="cancel" style="margin-left:auto;">Close</button>
        <button id="btnMenuHome" type="button" title="Home">Home</button>
      </div>
    </form>
  </dialog>
```

## dlgMenu: sections and buttons

### Section: Header
- Section name: `Menu`
- Elements:
  - (text) `Menu` — dialog title.

### Section: Paste / Edit language
- Section name: `Paste / Edit language`
- Container: `#langRow`
- Buttons:
  - (dynamic) language buttons (e.g. `SV`, `EN`, `UK`) — switches the active language context used for paste/edit.

### Section: Actions
- Section container: the first `.row` after `#langRow`
- Buttons:
  - `btnMenuPaste` — label: `Paste transcript` — opens the transcript paste dialog.
  - `btnAddVideo` — label: `Add YouTube link` — opens the “Add video” dialog to save a new link.
  - `btnStoreDebug` — label: `Store Debug` — saves runtime debug info to Firebase (`.../debug_info`).
  - `btnOpenYoutube` — label: `Open YouTube` — opens the current video in `youtube.com` (best chance for Premium/no-ads).
  - `btnOpenYoutubeApp` — label: `Open App` — attempts to open the current video in the YouTube app (fallbacks to `youtube.com`).

### Section: Show in playback
- Section name: `Show in playback`

#### Subsection: Line 1
- Container: `#langRowShow1`
- Buttons:
  - (dynamic) language buttons (e.g. `SV`, `EN`, `UK`) — selects which language is shown on transcript line 1.

#### Subsection: Line 2
- Container: `#langRowShow2`
- Buttons:
  - (dynamic) language buttons and/or `Off` (if supported) — selects which language is shown on transcript line 2 (or disables it).

### Section: Toggles / Close
- Section container: last `.row`
- Buttons:
  - `btnMenuToggleTrans` — label changes (`Hide transcription` / `Show transcription`) — toggles transcript panel visibility.
  - `btnMenuToggleTime` — label changes (`Show time` / `Hide time`) — toggles time display in the transcript.
  - `btnMenuToggleTransTime` — label changes (`Hide transcript time` / `Show transcript time`) — toggles timestamps on each transcript line.
  - `btnMenuToggleControlsDock` — label changes (`Dock controls bottom` / `Undock controls`) — docks/undocks controls row.
  - `btnPlayMode` — label like `Play mode - All` — cycles playback behavior modes.
  - (no id) `Close` — closes the dialog (native `<form method="dialog">` behavior).
  - `btnMenuHome` — label: `Home` — navigates to site home.


