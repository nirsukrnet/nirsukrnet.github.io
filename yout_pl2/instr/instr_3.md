# Instr: load saved Resp text on open

## Goal
When the user clicks the existing button:

```html
<button id="btnPasteAI" class="yu2-btn yu2-btn--tool" title="Paste grammar respond">Resp</button>
```

the app must open the Resp dialog and **auto-load** the previously saved explanation from Firebase into the textarea.

## Behavior requirements
- On click `btnPasteAI`:
	- Open the dialog (use `showModal()` when available; fallback to `open` attribute).
	- Determine the current `videoId` (the active YouTube video).
	- Determine the active transcript line index (`activeIndex`).
		- If there is no active line: show status like `Select a transcript line first` and do not try to load.

## Firebase location
- Root path: `DB_YOUTUBE2_ROOT + '/youtube_explanation'`
- Document path: `.../youtube_explanation/<videoId>`

## What to load
- Load the explanation for the active line index from:
	- `items[activeIndex]`

## Encoding
- Stored text is Base64 UTF-8 encoded:
	- `items[i].enc === 'b64utf8'`
	- `items[i].text_b64` contains the Base64 string
- When loading:
	- Decode `text_b64` into a UTF-8 string
	- Put the decoded Markdown into the Resp textarea (`#taResp`)

## UX
- Show a short status while loading: `Loading...`
- If nothing is saved yet: textarea becomes empty and status clears.
- On error: show `Load failed (check console)`.



can you make this size bigger then now

    dialog {
      width: min(980px, calc(100vw - 24px));
      border: 1px solid currentColor;
      border-radius: 12px;
      padding: 12px;
    }

extend this to full window space
