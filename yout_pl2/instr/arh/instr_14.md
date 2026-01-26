
## Appendix: align `rec_voice.html` YouTube picker with `yout_pl2.html`

`rec_voice.html` already contains a conceptually similar “pick a reference YouTube video” UI:

- Entry point button: `#btnRecYoutubeMenu`
- Dialog container: `#dlgRecYoutubeMenu`
- Filter input: `#inRecYoutubeFilter`
- List container: `#recYoutubeList`

### Goal

Make the YouTube picker in `rec_voice.html` feel like the main menu picker in `yout_pl2.html`:

- **Tag buttons row** (quick filter by tag)
- **Text filter** (short_name/title/id search)
- **Scrollable list** of matching videos with a Select action

### Data sources (same as `yout_pl2.html`)

- Ref videos list: `gv.cst.getcst('DB_CONST_REF_YOUTUBE_VIDEOS')`
	- Expected fields per record: `indent_id`, `short_name`, `title`, `url`, `tag`, `order`
- Tag list (optional but recommended for the “tags row” UX): `gv.cst.getcst('DB_CONST_REF_TAGS_SHORT')`
	- Same normalization rules as `yout_pl2.html` (a flat list of short tag strings).

### UI structure changes (inside `#dlgRecYoutubeMenu`)

Update the dialog markup to match the `yout_pl2.html` layout order:

1. Add a **tag row container** above the text filter:
	 - Example id: `recYoutubeTagRow` (a `<div class="row">`)
2. Keep the existing text filter input (`#inRecYoutubeFilter`) under the tag row.
3. Keep the status line (`#recYoutubeStatus`) and list (`#recYoutubeList`).

The intent is that the dialog becomes visually and functionally parallel to `yout_pl2.html`’s `#dlgMainMenu`:

- `#mainMenuTagRow`  → `#recYoutubeTagRow`
- `#inMainMenuShortFilter` → `#inRecYoutubeFilter`
- `#refVideosStatus` → `#recYoutubeStatus`
- `#refVideosList` → `#recYoutubeList`

### Behavior changes

Implement the same filtering logic as `yout_pl2.html`, but applied to `rec_voice.html`’s cached list:

- Maintain a single piece of UI state: `activeTag` (string, default empty = “All”).
- When a tag button is clicked:
	- Toggle selection: clicking the active tag clears it back to “All”.
	- Re-render the list using **combined filters**:
		- `activeTag` must match `v.tag` (exact match, case-insensitive is OK)
		- `#inRecYoutubeFilter` must match any of: `short_name`, `title`, `indent_id`, `tag` (substring match)

Recommended UX details (copy the feel from `yout_pl2.html`):

- Always include an “All” tag button at the start.
- Visually mark the active tag (e.g., `data-active="1"` + a CSS hook).
- Keep the list sorted by `order`, then name (already implemented in `loadRefVideos()` in `rec_voice.html`).

### Selecting a video (videoId extraction rule)

When the user clicks **Select**:

- Determine the YouTube `videoId`:
	- Prefer `indent_id`.
	- If missing, parse from `url`.
- Store it to the current session (in `rec_voice.html`, this currently writes `youtube_ids: <videoId>`).

### Acceptance criteria

- `rec_voice.html` YouTube picker shows a tag row + text filter + list.
- Tag selection and text filter work together (AND), matching the mental model in `yout_pl2.html`.
- Selecting an item reliably attaches a `videoId` (from `indent_id` or URL) and refreshes the transcript window.

Note: this appendix is purely about the **UI/UX structure** of the `btnRecYoutubeMenu` dialog. The underlying session attach logic can remain as-is.









