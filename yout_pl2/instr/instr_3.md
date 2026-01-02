## Multi-language transcripts (yout_pl2)

Goal: support storing transcript text in multiple languages per timestamp, and allow choosing which language is affected when pasting.

This spec targets Firebase root `db_youtube2/`.

---

## 1) Firebase: language set table

Add a new table:
- `db_youtube2/ref_languages_set`

Minimal schema:
```json
{
  "languages": {
    "1": "en",
    "2": "uk",
    "3": "sv"
  }
}
```

Notes:
- Values are language codes (`en`, `uk`, `sv`).
- Keys (`"1"`, `"2"`, ...) are just ordering keys.

---

## 2) UI: language selection in the Menu dialog

Where:
- In the Menu dialog header area (the line/area shown by the red arrow in the screenshot).

Add ONE new UI row that shows language buttons from `ref_languages_set.languages`.

Example buttons:
- `en`, `uk`, `sv`

Behavior:
- User clicks one language button to select the current editing language, call it `lang_edit`.
- `lang_edit` is used when the user clicks **Paste transcript**.

Minimal default:
- If nothing selected, default `lang_edit = lang1_show` if available, otherwise `sv`.

---

## 3) Transcript storage changes (per video)

Transcript records live under:
- `db_youtube2/youtube_transcripts/{videoId}`

Add two optional fields:
- `lang1_show` (string)
- `lang2_show` (string)

These control which two languages are shown in the transcript UI.

Example:
```json
{
  "videoId": "maKy1pRdcDw",
  "source": "manual",
  "lang1_show": "sv",
  "lang2_show": "en",
  "updatedAt": "2026-01-01T...Z",
  "items": [
    {
      "t": 1,
      "text_sv": "...",
      "text_en": "...",
      "text_uk": "...",
      "Mark1": true
    }
  ],
  "rawText": "..."
}
```

Item rules:
- `t` is the timestamp in seconds.
- Each language is stored in its own field name `text_<langCode>`.
- `Mark1` stays as-is.

---

## 4) Paste transcript behavior (language-aware)

When the user clicks **Paste transcript**:
- Parse timestamps as usual.
- Write the parsed text into the selected language field only:
  - `text_${lang_edit}`
- Do NOT overwrite other language fields (`text_en`, `text_sv`, ...).

---

## 5) Optional: selecting display languages

Consider adding controls in the Menu to choose:
- `lang1_show`
- `lang2_show`

When changed:
- Update the transcript record in Firebase for this video.
- The transcript UI should display two lines per timestamp: `lang1_show` and `lang2_show`.






