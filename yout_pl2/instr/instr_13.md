lets check how work  `rec_voice.html` in this instr

begin  instr

### B) `rec_voice.html` viewer panel

The transcript preview is rendered into:

- `<section id="ytItemsList" class="ytItems ytAllText" aria-label="Transcript items"></section>`

To show items “the same way as yout_pl2”, the viewer must use the *same* language selection fields:

- read `lang1_show` / `lang2_show` from `/db_youtube2/youtube_transcripts/<videoId>/...`
- then for each item, show `text_<lang1_show>` (and optionally `text_<lang2_show>`)

Note about `rec_voice.html`:

- `DB_CONST_UI_STATE_YOUT_PL2` is **UI-state** (global “current selection”) and is used by `rec_voice.html` for speech-recognition-related behavior.
- But the transcript display inside `<section id="ytItemsList" ...>` should follow the **per-video settings** stored together with the transcript.

For display in `#ytItemsList`, use these fields from the transcript node:

- `/db_youtube2/youtube_transcripts/<videoId>/lang1_show`
- `/db_youtube2/youtube_transcripts/<videoId>/lang2_show`

Then render each transcript item using `text_<lang>` fields (same rule as `yout_pl2.html`):

- primary line: `text_<lang1_show>`
- optional second line: `text_<lang2_show>` (only when set and different from `lang1_show`)


end instr

and fix it if it does needed