# instr_18 — Add `btnEditVideo` (edit existing video)

## Goal
Add a new button `btnEditVideo` that allows editing an existing YouTube reference video record using the **same UI** as the current Add Video dialog.

This is the “edit mode” analog of `btnAddVideo`.

## UI placement
- Location: `dlgMenu` (Contexts menu), next to/near `btnAddVideo`.
- Button id: `btnEditVideo`
- Label text: `Edit YouTube link`
- Type: `type="button"` (must NOT close the dialog automatically)

Recommended placement rule:
- Put `btnEditVideo` on the same row as `btnAddVideo`.

## Behavior

### Open edit mode
When user clicks `btnEditVideo`:
1. Determine the “target record” to edit.
	 - Preferred: the record corresponding to the currently loaded `currentVideoId`.
	 - If there is no match in the reference videos store, show a status like: `This video is not in saved links`.
2. Open the existing Add Video dialog (same dialog used by `btnAddVideo`).
3. Pre-fill fields with existing values from the target record (URL, videoId, shortName, tags, etc. depending on existing schema).
4. Switch dialog into **edit mode** (internal flag), so Save updates instead of creating a new record.

### Save edit
When user saves in edit mode:
- Update the existing record in Firebase (use the same DB root path constants used by the ref videos store; do not hardcode DB paths).
- Preserve record key/id.
- Validate that the resulting record still has a resolvable videoId.

### Cancel
- Cancel/Close keeps everything unchanged.

## Data rules
- No duplicates: editing must not create a second record with the same videoId.
- If the user changes the URL to a different videoId:
	- Either block and ask to use “Add YouTube link” instead, OR implement a safe migration that avoids duplicates.
	- Pick one approach and be consistent (recommended: block and show a clear status message).

## Wiring
- Add click handler in the same place where `btnAddVideo` is wired.
- Implement helper functions:
	- `openEditVideoDialogForCurrentVideo()`
	- `setAddVideoDialogMode('add' | 'edit', recordKey)`
	- `loadAddVideoFormFromRecord(record)`

## Acceptance criteria
- `btnEditVideo` appears in `dlgMenu`.
- Clicking it opens the Add Video dialog with fields prefilled.
- Saving edits updates the existing record (no new key created).
- If the current video is not saved as a ref video, the UI shows a clear message and does not open edit mode.
- No duplicate ref video entries are created by editing.