# /db_youtube2 — reference tags table (`ref_tags_short`) seed/load UI

## Goal
Create (or initialize) a small reference table in Firebase RTDB under `/db_youtube2` for short tags (like `SWE`, `ENG`, `OTH`).

UI must be **simple**:
- No editor UI.
- Only a dialog to **seed/load** this one node: `db_youtube2/ref_tags_short`.
- Must NOT touch other data under `db_youtube2`.

---

## Database path

Store tags here:

`db_youtube2/ref_tags_short`

This should be similar in style to `ref_languages_set` used elsewhere.

---

## Data model (seed payload)

Top-level object:

```json
{
  "updatedAt": "2026-01-12T00:00:00.000Z",
  "tags": {
    "SWE": { "id": "1", "label": "SWE", "description": "swedish", "order": 1 },
    "ENG": { "id": "2", "label": "ENG", "description": "english", "order": 2 },
    "OTH": { "id": "3", "label": "OTH", "description": "other",   "order": 3 }
  }
}
```

### Rules
- `tags` is an object keyed by **tag code** (recommended: `^[A-Z0-9_-]{2,12}$`).
- Each tag value:
  - `id` (string): stable id (can be `"1"`, `"2"`… or a GUID).
  - `label` (string): display label (usually same as key).
  - `description` (string): human meaning.
  - `order` (number): sort order.
- `updatedAt` is ISO string.

### Sorting
When rendering tags in UI:
1) sort by `order` ascending
2) then by `label` / key

---

## Minimal UI requirements

### Button
- Add a button somewhere accessible (Menu is OK): `Init tags` (or `Seed tags`).
- Clicking opens a dialog.

### Dialog
The dialog should do only these actions:

1) **Load current value** (read)
- Read `db_youtube2/ref_tags_short` and display a short status:
  - `Exists: yes/no`
  - count of tags if present
  - `updatedAt` if present

2) **Seed defaults** (write)
- Write ONLY to `db_youtube2/ref_tags_short` (do not overwrite `db_youtube2`).
- Recommended operation:
  - `PUT db_youtube2/ref_tags_short` with the seed payload (example JSON above).
  - This replaces only that node.

Optional safe mode (recommended):
- If `ref_tags_short` already exists, require explicit confirmation: `Overwrite existing ref_tags_short`.

UI controls in dialog (minimal):
- `Load` button
- `Seed defaults` button
- Optional checkbox `Overwrite if exists`
- `Close`

Notes:
- Keep it simple: no extra pages.
- Reuse the existing Firebase request helper (`ytRequestByPath` / `GlobalVars` patterns).
- Seeding affects only `db_youtube2/ref_tags_short`, not the whole database.




