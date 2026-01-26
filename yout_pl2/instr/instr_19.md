# instr_19 — Main Menu tags: show 4 + right arrow paging

## Goal
In the **Main Menu** (dialog `dlgMainMenu`), the tag buttons row must not show all tags at once.

Instead, it must behave like a small “pager” (carousel without scroll):
- Show only **3 tag buttons** at a time.
- The **4th button** is always `All` (clears tag filter).
- Show a **5th button** at the end: a **right-arrow** (`>`), used to page to the next 3 tags.

This instruction is only about the tags-row UI/behavior and its state.

## Scope
- Applies only to the tags row container: `mainMenuTagRow`.
- Does not change filtering logic (`mainMenuSelectedTag`, `applyMainMenuFilters`) except how the buttons are *displayed*.
- `All` button behavior remains the same conceptually (clears tag filter). Its placement can be unchanged or treated specially (see below).

## Terminology
- **Tags list**: the ordered array returned by `loadRefTagsShortList()` and normalized by `normalizeRefTagsShort()`.
- **Page**: a window of 4 consecutive tags in the tags list.
- **Page start index**: `tagPageStart`, integer `>= 0`.

## UI requirements
### Visible buttons
Inside `mainMenuTagRow` render:
1. Up to 3 tag buttons (labels are tag labels).
2. The `All` button as the 4th element.
3. A right-arrow button as the 5th element.

Right-arrow button:
- Label: `>` (or `›`).
- It is always the last button in the row.
- It must be visually consistent with other buttons.

### All button placement
`All` must be rendered inside `mainMenuTagRow` as the **4th button** (same row), replacing what would otherwise be the 4th tag.

## Behavior requirements
### Paging
- Clicking the right-arrow advances the page by 3 (because only 3 tags are visible per page).
- If there are fewer than 3 remaining tags, show the remaining tags.
- If the page is currently showing the last tags (i.e., no more tags ahead), clicking the right-arrow wraps to the first page (`tagPageStart = 0`).

### Selection + paging interaction
- Selected tag state must still be shown using the existing selected styling.
- If a user selects a tag that is not on the current page (for example due to restored state from Firebase), the pager must automatically set `tagPageStart` so that the selected tag is visible.
  - Example: selected tag is at index 12 ⇒ set `tagPageStart = 12 - (12 % 3)`.

### Search/filter input interaction
- When user types in the main menu short filter (`inMainMenuShortFilter`), paging is unaffected.
- Paging only affects which tag buttons are visible; it does not affect the record list filtering except through selecting a tag.

### Tag list refresh interaction
If tags list changes (remote update, different account):
- Keep `tagPageStart` if still valid.
- Otherwise clamp: `tagPageStart = 0`.
- If a selected tag exists, ensure it is visible (see rule above).

## State
Maintain a UI state variable:
- `tagPageStart` (integer).

Persistence is optional:
- If persisted, store under the existing UI state root (same style as other main menu UI state fields).
- If not persisted, resetting to page 0 on each open is acceptable.

## Edge cases
- No tags loaded / empty list:
  - Show only `All` (and do not show arrow), or show `No tags` plus `All`.
- 1–3 tags:
  - Show them all + `All`. Arrow can be hidden (prefer hidden).
- 4–6 tags:
  - Arrow shown; clicking toggles between page 0 and page 3.
- Selected tag is invalid / no longer exists:
  - Clear selection or keep selection cleared; ensure page starts at 0.

## Acceptance criteria
- Tag row never renders more than 5 buttons: 3 tags + `All` + right-arrow.
- Right-arrow pages through tags in steps of 3 and wraps.
- Selected tag remains highlighted and is automatically brought into view.
- Works on mobile (iPhone): large tap targets, no horizontal scroll needed.

---

## Static demo page (separate from `yout_pl2.html`)

### Goal
Create a standalone HTML page (no Firebase, no YouTube, no dependencies) to demonstrate the **exact UX** of this instruction:
- 3 visible tag buttons + `All` as the 4th + a 5th right-arrow button.
- Clicking the arrow shows the next 3 tags (wraps to start).
- Selecting a tag filters a mock list.
- `All` clears the tag filter.

### Location
Create the file:
- `yout_pl2/instdoc/instr_19_tags_pager_demo.html`

### Localhost link
When running a local static server at the workspace root (for example on port 8080), open:
- `http://localhost:8080/yout_pl2/instdoc/instr_19_tags_pager_demo.html`

### UI layout (match Main Menu look)
- A full-screen “dialog-like” card (mobile-friendly) containing:
  - Tag row (`mainMenuTagRow`): 3 tags + `All` (4th) + right-arrow.
  - Filter input (placeholder: `type to filter`).
  - A small info line (e.g. `All: showing 2 of 2 (total 15)`).
  - A list of items styled like the real menu list.

### Demo data
- Provide an in-page static tags array like: `SW1, SWE, ENG, SW2, OTH, ...`.
- Provide ~15 mock items with `tag` + `title` so the filter visibly changes results.

### Behavior
- Implement the pager logic exactly as specified above (step = 3, wrap).
- If `tags.length <= 3`, hide the arrow.
- If `selectedTag` exists but is not visible on the current page, auto-jump the page so it becomes visible.

### Acceptance criteria
- Opening the demo page shows the same UI behavior as expected in `yout_pl2.html`.
- Works on iPhone (large tap targets, no horizontal scrolling required).
