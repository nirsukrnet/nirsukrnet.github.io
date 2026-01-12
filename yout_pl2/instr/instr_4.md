# `yout_pl2.html` — improve Main Menu filters (tags + text)

## Goal
Improve the **Main Menu** dialog (the one that shows `refVideosList`) by adding two filter rows **above** the list:

1) Tag buttons loaded from `db_youtube2/ref_tags_short`
2) Text input to filter by `short_name`

Keep it minimal (no new pages).

---

## UI changes (Main Menu)

### Row 1: Tag filter buttons
Place at the very top of the Main Menu dialog, above the videos list.

Requirements:
- Load available tags from `db_youtube2/ref_tags_short/tags`.
- Render one button per tag (use `label` if present, otherwise use the tag key).
- Add a special button: `All` (no tag filter).
- Clicking a tag button filters the videos list to show only items matching that tag.

Matching rule (video item):
- Use the existing `tag` field stored for ref videos (already present in Add Video form).
- A video matches when `video.tag === selectedTag`.

Persistence:
- Store the last selected tag in Firebase, so it is restored next time.
- Suggested path:
	- `db_youtube2/ui_state/yout_pl2/main_menu_selected_tag`
	- Payload: `{ "tag": "SWE" | "" , "updatedAt": "..." }`
	- Empty string means `All`.

### Row 2: Text filter input (short_name)
Place under the tag row and above the videos list.

Requirements:
- Add an `<input>` field to filter by `short_name`.
- Filtering should be case-insensitive and should match as substring.
	- Example: query `ab` matches `short_name = "ABC"`.

Persistence (recommended):
- Store the last typed text filter so it restores on open.
- Suggested path:
	- `db_youtube2/ui_state/yout_pl2/main_menu_short_name_filter`
	- Payload: `{ "q": "...", "updatedAt": "..." }`

---

## Filtering behavior
- Apply both filters together:
	- Tag filter (unless `All`)
	- Text filter (unless empty)
- If the list becomes empty, show an inline status message like `No videos match` (reuse existing minimal status patterns; do not add new pages).

---

## Notes
- Reuse the existing Firebase request helper (`ytRequestByPath` / `gv.URL_DS.requestData_By_URL_Path`).
- Do not modify other parts of the app UI.



