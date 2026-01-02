## Create yout_pl2 (clone of yout_pl1)

Goal: create a second independent YouTube page based on `yout_pl1.html`, but using a new Firebase root `db_youtube2/`.

This keeps `yout_pl1` and `yout_pl2` data separated.

---

## 1) Files to create

Create a new HTML file:
- `C:\Python\AuTr\html\yout_pl2.html`

Create a new JS subfolder for page-specific modules:
- `C:\Python\AuTr\html\yout_pl2\`

Inside `yout_pl2\` create these copies (start by copying from `yout_pl1\`):
- `yout_pl2\yu2_global_var.js` (or reuse shared `assets/js/global_var.js` if you do NOT need per-page auth/config)
- `yout_pl2\youtube_transcript_store.js`
- `yout_pl2\youtube_ref_videos_store.js`

---

## 2) HTML changes (yout_pl2.html)

Start by copying `yout_pl1.html` → `yout_pl2.html`, then update only the local script paths to point to the new folder:

```html
<script src="./yout_pl2/yu2_global_var.js"></script>
<script src="./yout_pl2/youtube_transcript_store.js"></script>
<script src="./yout_pl2/youtube_ref_videos_store.js"></script>
```

Note:
- Keep the rest of the UI/logic the same (minimal clone).

---

## 3) Firebase paths (db_youtube2)

In the new `yout_pl2` store modules, change the Firebase ROOT_PATH constants to use `db_youtube2`:

Transcript store:
- `../db_youtube2/youtube_transcripts`

Reference videos store:
- `../db_youtube2/ref_youtube_videos`

These are relative paths because the underlying Firebase client uses `data_base2` as its base root, so `../` escapes that.

---

## 4) Expected Firebase structure

`db_youtube2/`
- `youtube_transcripts/{videoId}`
- `ref_youtube_videos/{base64url(indent_id)}`

---

## 5) Quick checklist

- Opening `yout_pl2.html` shows the player + transcript UI.
- Adding a reference video writes under `db_youtube2/ref_youtube_videos/...`.
- Saving transcript writes under `db_youtube2/youtube_transcripts/{videoId}`.
- Clicking a reference video switches the embedded player and loads transcript in-page (same behavior as yout_pl1).






