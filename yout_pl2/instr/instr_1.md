
# yout_pl2 — Menu language blocks (instruction)

## Goal
In the **Menu** we have language buttons `SV / EN / UK`.
Right now these buttons are **related only to Paste/Edit** (when you paste transcript text).

We need to:
1) Make this explicit in UI by placing them into a **separate block**.
2) Add a second block that controls which languages are **shown during playing mode** (transcript rendering while the video plays).

This document describes the intended UX/behavior.

---

## Block A — Paste / Edit language

**Name (UI label):** `Paste / Edit language`

**Purpose:**
- Selects the target language field that will be written when using **Paste transcript → Apply / Save**.
- This should NOT change what languages are displayed during playback.

**Controls:**
- Buttons: `SV`, `EN`, `UK` (later can be extended to other languages).
- Selected button = `langEdit`.

**Behavior:**
- When user pastes transcript and clicks **Apply**:
	- Parsed items are merged into `transcript[*].text_<langEdit>`.
- When user clicks **Save to Firebase**:
	- Items are saved with the edited language text stored in `text_<langEdit>`.

**UI hint text (optional):**
- Show something like: `Edit language: SV`.

---

## Block B — Playback display languages

**Name (UI label):** `Show in playback`

**Purpose:**
- Controls which language(s) the transcript panel shows while the video is playing.
- This affects rendering only (what user sees), not what fields are edited by paste.

**Controls:**
- `Line 1` language selector (primary): `lang1Show`
- `Line 2` language selector (secondary): `lang2Show`
	- Can be set to a language code or `Off`.

**Behavior (rendering):**
- `Line 1` always renders using `text_<lang1Show>` (or legacy `text` fallback).
- `Line 2` renders only when:
	- `lang2Show` is not `Off`, and
	- `lang2Show != lang1Show`.

**Persistence:**
- When saving transcript to Firebase, store the chosen display languages in transcript meta (top-level fields, not inside `items`):
	- `lang1_show: <lang1Show>`
	- `lang2_show: <lang2Show>`
- When loading transcript from Firebase, restore these meta settings and re-render.

**Defaults:**
- `langEdit = sv`
- `lang1Show = sv`
- `lang2Show = en`

---

## Notes / edge cases

- If `lang1Show` points to a field that does not exist (example: transcript contains only `text_en` but user selected `sv`), the transcript can look “empty”.
	- Preferred solution: add a fallback strategy (try legacy `text`, then any available `text_*` field) or show a visible placeholder like `[missing SV]`.

- Keep the UI clear: the user should immediately understand:
	- Block A = what language paste writes to.
	- Block B = what language(s) are displayed during playback.

---

## Firebase RTDB — where data is stored (as on screenshot)

**Root path:**
- `db_youtube2/youtube_transcripts/<videoId>`

**Example (shape):**

```json
{
	"videoId": "JkcMHLoPI3U",
	"source": "manual",
	"updatedAt": "2026-01-12T08:23:20.769Z",
	"lang1_show": "en",
	"lang2_show": "uk",
	"rawText": "0:00 Hej och välkommen ...",
	"items": [
		{ "t": 0, "text_en": "...", "text_sv": "...", "Mark1": false },
		{ "t": 4, "text_sv": "Hon går på SFI.", "text_en": "..." }
	]
}
```

**Field meanings:**
- `videoId` — YouTube video id (key also equals this id).
- `items` — array of transcript rows.
	- `t` — time in seconds (number).
	- `text` — legacy single-language text (optional).
	- `text_<lang>` — language-specific fields, e.g. `text_sv`, `text_en`, `text_uk`.
	- `Mark1` — optional boolean marker flag.
- `rawText` — original pasted text (for re-saving without losing formatting).
- `lang1_show` / `lang2_show` — playback display language settings for Line1/Line2.
- `source` — how transcript was created (example: `manual`).
- `updatedAt` — ISO timestamp.

---

## Playback display modes

Menu Block B (`Show in playback`) supports 2 modes.

### Mode 1 — show only 1 language

**Goal:** show only one line per timestamp.

**Settings:**
- `lang1Show = sv` (example)
- `lang2Show = Off`

**Saved to Firebase:**
- `lang1_show: "sv"`
- `lang2_show: ""` (or omit the field)

**Rendering rule:**
- Only Line 1 is rendered.

### Mode 2 — show 2 languages (two lines)

**Goal:** show two lines per timestamp (original + translation).

**Settings examples:**
- `lang1Show = sv`, `lang2Show = en`
- `lang1Show = en`, `lang2Show = uk`

**Saved to Firebase:**
- `lang1_show: "sv"`
- `lang2_show: "en"`

**Rendering rule:**
- Line 2 is rendered only when `lang2Show` is not `Off` AND `lang2Show != lang1Show`.
