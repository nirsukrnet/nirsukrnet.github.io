## Update request: rec_voice.html — compact top row controls

## Target
- File: `C:\Python\AuTr\html\rec_voice.html`

## Goal
Make the main row more compact:
- Move rarely-changed controls into the existing `⋯` menu dialog.
- Keep navigation controls near the main “E” button.
- Make the Record/Stop button label short and always show the current language.

## UI changes

### 1) Move language selector into the `⋯` menu

Move the existing language selector (`<select id="selLang">`) out of the main page row and place it inside the menu dialog opened by:
- `<button id="btnCMenu" type="button" title="Menu">⋯</button>`

Requirements:
- Keep the same element id: `selLang`.
- The menu should clearly label it as “Language”.
- Changing language should still affect SpeechRecognition on next start (current behavior).

### 2) Move transcript navigation buttons into the main row

Move these buttons:
- `<button id="btnYtBeg">Beg</button>`
- `<button id="btnYtPrev">Prev</button>`
- `<button id="btnYtNext">Next</button>`

From the transcript window header into the main controls row (same row as `btnEndPhrase` and `btnCMenu`).

Requirements:
- Keep the same ids (`btnYtBeg`, `btnYtPrev`, `btnYtNext`) so existing JS logic continues to work.
- The transcript window can keep only the title/status; navigation happens from the top row.
- Buttons keep their current enable/disable logic (Prev disabled at startIndex==0; Next disabled at end).

### 3) Rename the Record button label to short “R/S + Lang”

Update the `btnRec` button label to be compact:

- When idle / ready to start:
  - Button text: `R <Lang>`

- When recording:
  - Button text: `S <Lang>`

Where `<Lang>` is derived from the current selection in `selLang` (e.g. `en-US`, `sv-SE`, `uk-UA`).

Notes:
- This is label-only; the underlying start/stop behavior must remain unchanged.
- When language changes, the `btnRec` label should refresh to reflect the new `<Lang>`.

## Acceptance criteria
1) Language selector is only inside the `⋯` menu and still works.
2) `Beg/Prev/Next` appear in the top row next to `E` and operate as before.
3) `btnRec` shows `R <Lang>` when idle, `S <Lang>` when recording.



<div class="row">
      <button id="btnRec" type="button" data-state="idle">R en</button>

      <button id="btnYtBeg" type="button" title="Go to beginning" style="min-height:32px; padding:6px 10px;">Beg</button>
      <button id="btnYtPrev" type="button" title="Previous" style="min-height:32px; padding:6px 10px;">Prev</button>
      <button id="btnYtNext" type="button" title="Next" style="min-height:32px; padding:6px 10px;">Next</button>

      <button id="btnEndPhrase" type="button" title="End phrase: move current text to history">E</button>
      <button id="btnCMenu" type="button" title="Menu">⋯</button>
    </div>