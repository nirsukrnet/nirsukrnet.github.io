## YouTube reference videos menu (spec)

Goal: add a compact “main menu” button that lets us manage a small list of YouTube video links stored in Firebase.

---

## 1) UI: Main menu button
- Add a small `Menu` button in the top-right corner.
- Clicking it opens a menu list.

Menu must contain:
1) **Add YouTube link**
2) A list of the first **5** saved videos (sorted by `order` ascending)

---

## 2) “Add YouTube link” flow
When the user clicks **Add YouTube link**:
- Open a new window OR a modal form (either is acceptable).
- The form collects fields described below.
- On Save, write/update the record in Firebase.

Autofill behavior (implemented):
- When the user enters `url` and then leaves the URL field (blur / switch to another field):
  - `title` is auto-filled from YouTube **oEmbed** (if `title` is still empty)
  - `short_name` is auto-generated from `title` (first ~40 chars, if `short_name` is still empty)
  - `indent_id` is auto-detected from URL (videoId) if empty

---

## 3) Firebase storage
Root path:
- `db_youtube1/ref_youtube_videos`

Implemented record key strategy:
- Store by an encoded key derived from `indent_id`:
  - `db_youtube1/ref_youtube_videos/{base64url(indent_id)}`
- The record still includes the original `indent_id` field.
- This avoids Firebase RTDB key restrictions for `indent_id`.

---

## 4) Record schema
Each record:
```json
{
  "indent_id": "maKy1pRdcDw",
  "url": "https://youtu.be/maKy1pRdcDw",
  "description": "(optional long description)",
  "title": "(optional full title)",
  "short_name": "(optional short label)",
  "tag": "(optional category/tag)",
  "order": 10
}
```

Field notes:
- `indent_id`: unique identifier for the item (can be the videoId).
- `url`: full YouTube URL (string).
- `order`: number used for sorting in the menu (lower = earlier). If missing, treat as a big value (e.g. 9999).

---

## 5) Menu list: show first 5 videos
After the **Add YouTube link** item, the menu shows up to **5** videos:
- Source: `db_youtube1/ref_youtube_videos`
- Sort: by `order` ascending
- Display label preference:
  1) `short_name`
  2) `title`
  3) `indent_id`

Click behavior (minimal, implemented):
- Clicking a video item must NOT open a new tab.
- It switches the existing embedded YouTube player to the selected `videoId` (derived from `indent_id` or extracted from `url`).
- It then loads that video’s transcript from Firebase and shows it in the same page.

Notes:
- The player is the existing element on the page:
  - `#player` inside `#playerWrap`
- Transcript source for the selected video:
  - `db_youtube1/youtube_transcripts/{videoId}`


