## OCR dialog UX fixes

### 1) Close dialog after **Save** (new entry only)
**Goal:** If the user is creating a *new* OCR record (not editing an existing saved rectangle), pressing **Save** should also close the OCR dialog.

**Rules**
- **New record mode**: after successful save → close the OCR dialog.
- **Edit mode** (opened by clicking a saved green rectangle): after successful save → keep the dialog open.
- If save fails (network/auth error) → do not close.

**Acceptance**
- New record: Save → status shows “Saved” → dialog closes.
- Edit record: Save → status shows “Updated” (or “Saved”) → dialog stays open.

### 2) Show status inside the OCR dialog header
**Goal:** Don’t show transient messages like “Saved”, “Updated”, “OCR: done” in the page’s top-left status area. Show them in the OCR dialog header instead.

**Where**
- Use the header container: `<div id="ocrHdr" ...>`
- Add/update a small text element there (e.g. `<span id="ocrHdrStatus">...</span>`).

**Messages to route into `#ocrHdr`**
- OCR lifecycle: “OCR: init…”, “OCR: recognizing…”, “OCR: done”, errors.
- Save lifecycle: “Saved”, “Updated”, “Already saved”, “Save failed: …”.

**Readability requirement**
- `#ocrHdrStatus` must be fully readable (no “muted/transparent” look).
- Use an opaque background (like buttons) and full opacity for the status element.

### 3) Button alignment in OCR header
**Goal:** Make the header layout consistent.

**Layout**
- **Save** button on the left
- **Close** button on the right
- Status text can sit between them (or next to Save)

### 4) Timestamp format (createdAt / updatedAt)
**Goal:** Store timestamps as ISO-8601 strings.

**Fields**
- `createdAt`
- `updatedAt`

**Format example**
- `2026-01-26T06:29:29.879Z`

**Migration behavior**
- When editing an entry that has non-ISO timestamps, rewrite them to ISO on the next successful save.

