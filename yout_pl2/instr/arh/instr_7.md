## instr_7 — Use `gv.cst.getcst(...)` only (NO per-file fallbacks)

### Problem
Some files still do this kind of logic:

```js
const v = (gv && gv.cst && typeof gv.cst.getcst === 'function')
  ? gv.cst.getcst('DB_CONST_YOUTUBE_TRANSCRIPTS')
  : '';
return v || '../db_youtube2/youtube_transcripts';
```

This is **NOT** allowed because it reintroduces hardcoded DB paths in every file and duplicates fallback logic.

### Goal
All DB paths must be read **only** from the central constants store:

```js
const ROOT_PATH = gv.cst.getcst('DB_CONST_YOUTUBE_TRANSCRIPTS');
```

No extra checks. No `|| '../db_youtube2/...'` in feature files.

### Rules
1) In feature files, **never** hardcode DB paths like `../db_youtube2/...`.
2) In feature files, **never** add “fallback” code like `v || '...'`.
3) In feature files, **never** check `typeof gv.cst.getcst === 'function'`.
4) The **only** acceptable access pattern is:

```js
const ROOT_PATH = gv.cst.getcst('DB_CONST_...');
```

5) If a default is needed, it must be defined centrally inside `GB_Const` defaults (in `yu2_global_var.js`).
   - That is the **only** place where fallback values are allowed.

### Prerequisites
- `gv` must exist.
- `gv.cst` must be an instance of `GB_Const`.

If you are inside a standalone module, first obtain `gv` via `ensureGv()` (or the project’s standard method), then use `gv.cst.getcst(...)`.

### Examples

**Correct**

```js
const LANG_ROOT_PATH = gv.cst.getcst('DB_CONST_REF_LANGUAGES_SET');
const ROOT_PATH = gv.cst.getcst('DB_CONST_YOUTUBE_TRANSCRIPTS');
const VIDEOS_PATH = gv.cst.getcst('DB_CONST_REF_YOUTUBE_VIDEOS');
const TAGS_PATH = gv.cst.getcst('DB_CONST_REF_TAGS_SHORT');
const UI_STATE_PATH = gv.cst.getcst('DB_CONST_UI_STATE');
```

**Wrong (do not do this)**

```js
const ROOT_PATH = gv.cst.getcst('DB_CONST_YOUTUBE_TRANSCRIPTS') || '../db_youtube2/youtube_transcripts';
```

```js
const v = (gv && gv.cst && typeof gv.cst.getcst === 'function') ? gv.cst.getcst('DB_CONST_...') : '';
```

### Migration checklist
- Replace every `../db_youtube2/...` constant with `gv.cst.getcst('DB_CONST_...')`.
- Delete all per-file fallback strings.
- If some key is missing, add it to `GB_Const` default map (centralized), not in the caller.
