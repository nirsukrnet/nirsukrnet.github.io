# Avoid repeating fallback logic for DB constants

## Problem
In multiple places we currently do this pattern:

```js
const _DB_CONST = (window && window.YT_DB_CONST) ? window.YT_DB_CONST : null;
const LANG_ROOT_PATH = (_DB_CONST && _DB_CONST.REF_LANGUAGES_SET)
    ? _DB_CONST.REF_LANGUAGES_SET
    : '../db_youtube2/ref_languages_set';
```

This is **not good** because:
- Too much repeated boilerplate in many files.
- Easy to make inconsistent defaults.
- Hard to change later (needs edits in many files).

---

## Goal
Use a single consistent access API for constants:

```js
const LANG_ROOT_PATH = gv.cst.getcst('DB_CONST_REF_LANGUAGES_SET');
```

No more local `_DB_CONST` blocks in each file.

---

## Required implementation (design)

### 1) Create a constants store class
In `yout_pl2/yu2_global_var.js` add a small class:
- `GB_Const`

It must provide:
- `getcst(key)` → returns a string value for known keys
- Optional: `setcst(key, value)` (only if needed)

The store should internally define defaults for DB constants.

### 2) Attach it to GlobalVars
When `new GlobalVars()` is created, ensure:
- `gv.cst` is an object that has method `getcst()`

Required wiring pattern (same approach as `URL_DataSet`):
```js
class GlobalVars {
  constructor(initial = {}) {
    this.URL_DS = new URL_DataSet({});
    this.cst = new GB_Const({});
    // ...
  }
}
```

Example usage:
```js
const gv = ytEnsureGv();
const UI_STATE_PATH = gv.cst.getcst('DB_CONST_UI_STATE_YOUT_PL2');
```

### 3) Keys naming
Define stable keys like:
- `DB_CONST_DB_YOUTUBE2_ROOT`
- `DB_CONST_REF_LANGUAGES_SET`
- `DB_CONST_REF_TAGS_SHORT`
- `DB_CONST_YOUTUBE_TRANSCRIPTS`
- `DB_CONST_REF_YOUTUBE_VIDEOS`
- `DB_CONST_UI_STATE_YOUT_PL2`

### 4) Backward compatibility
If `window.YT_DB_CONST` already exists, the constants store may read from it,
but the rest of the codebase should use **only** `gv.cst.getcst(...)`.

---

## Refactor rules
- Replace direct constants like `const LANG_ROOT_PATH = '../db_youtube2/ref_languages_set'`.
- Replace local `_DB_CONST` fallback blocks.
- New code must use only `gv.cst.getcst(...)`.

Non-goals:
- Do not change Firebase auth or request code.
