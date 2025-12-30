
## Goal
Create a small JS helper to:
1) Read/write user settings from Firebase (DB3).
2) Replace ad-hoc `console.log(...)` with a single debug logger API that can be enabled/disabled per “ident”.

## Scope (keep it minimal)
- Do **not** build a UI.
- Do **not** add new dependencies.
- Provide a tiny API that existing code can call.

---

## App integration (how scripts are loaded)
This project’s pages are typically bootstrapped by the dynamic loader:
- `assets/js/main_loadscripts.js`

What it does (relevant for adding new code):
- Loads CSS first, then JS **in the array order**.
- Guarantees `window.MainFunc` exists early (a stub is defined if needed) so `body onload="MainFunc()"` won’t throw on slow loads.
- If the page already fired `MainFunc()` while the stub was active, the loader will call the **real** `MainFunc()` once scripts finish loading.

### Adding a new JS module
1) Create your file under `assets/js/...` (recommended), e.g.:
- `assets/js/cdebug.js`
- `assets/js/settings_store.js`

2) Register it in `assets/js/main_loadscripts.js` inside the `scripts` array.

Ordering rules:
- Put shared globals first. Today `./assets/js/global_var.js` is expected to be first.
- Load any dependency **before** the scripts that call it.
- Keep the loader list minimal; only add your new module once.

3) Use the new module from existing scripts.
- If you attach APIs on `window` (e.g. `window.cdebug = ...`), load it before the scripts that call `cdebug`.
- If you use ES modules (`import ...`), note that this loader currently injects classic `<script>` tags (no `type="module"`).

Quick verification:
- Open the target HTML page and check DevTools Console for `Script load failed ...` errors.
- If your feature relies on `MainFunc()`, confirm it still runs once per page load.

---

## 1) Settings reader/writer
Create a tiny settings helper that reads/writes the debug settings document.

**Firebase location**
- Root: `test_debug_db3/default_debug`

**Minimal API**
- `SettingsStore.load(): Promise<object>`
- `SettingsStore.save(partial: object): Promise<void>`

Notes:
- Keep this store focused on debug/config for `cdebug`.
- Last-selected lesson is already handled elsewhere (see the existing DB3 settings functions in the app).

---

## 2) Debug logger (`cdebug`)
Replace direct `console.log(...)` calls with:
```js
cdebug.log(message, ident)
```

Recommended (option 1): create a per-function context once, then use short tags:
```js
const ctx = cdebug.ctx('oap_menu_less.js', 'restoreSelectedIdFromFirebase');
ctx.log('start');
ctx.log('restored', { saved });
```

### Ident format
`ident` must be a stable unique string so you can enable/disable it.

Use one of these formats:
- `"file.js::functionName::tag"` (recommended)
- `"file.js:L123"` (ok but changes if lines move)

Examples:
- `"oap_menu_less.js::restoreSelectedIdFromFirebase::start"`
- `"db_connswmp3.js::Load_DB3_Lesson_Phrases::foundLessonKey"`

### Context helper (preferred)
To avoid writing long ident strings on every log call, implement:
- `cdebug.ctx(file: string, fn: string)` → returns a small logger bound to that context.

The returned object should build the ident as:
- `${file}::${fn}::${tag}`

Suggested shape:
```js
const ctx = cdebug.ctx('file.js', 'someFunction');
ctx.log('start');
ctx.log('value', { x });
ctx.warn('unexpected', { data });
ctx.error('failed', err);
```

Rules:
- `tag` is a short stable token you choose (e.g. `start`, `restore`, `done`, `error`).
- `ctx.log(tag, extra?)` should NOT require the full ident.
- Internally, `ctx.log(tag, extra?)` calls `cdebug.log(message, ident, extra?)`.

### Behavior
- If `ident` is enabled → log to console.
- If disabled → do nothing.
- Provide levels:
	- `cdebug.log(...)`
	- `cdebug.warn(...)`
	- `cdebug.error(...)`

### Where to store enabled/disabled idents
Store debug settings under DB3 settings:

Important:
- Firebase RTDB keys cannot contain `. $ # [ ] /`, so you cannot store raw idents like `cdebug.js::...` as keys.
- This project stores enabled idents under **encoded keys**.

Storage:
- `test_debug_db3/default_debug/debug/enabledIdents/{encodedKey}: true`

Recommendation:
- Do not edit `{encodedKey}` manually.
- Use the Python helper `service_test/python/push_debug_settings.py --enable "<ident>"` (it encodes for you).

Example:
```json
{
	"debug": {
		"enabledIdents": {
			"<encodedKey>": true
		}
	}
}
```

### Minimal API
- `cdebug.isEnabled(ident): boolean`
- `cdebug.refreshFromFirebase(): Promise<void>` (loads enabled idents)
- `cdebug.log(msg, ident, extra?)`
- `cdebug.ctx(file, fn): { log(tag, extra?), warn(tag, extra?), error(tag, errOrExtra?) }`

### Usage example
```js
// old
// console.log('[oap_menu] Restoring selected lesson', saved);

// new (recommended)
const ctx = cdebug.ctx('oap_menu_less.js', 'restoreSelectedIdFromFirebase');
ctx.log('restore', { saved });
```

### Output destination (console vs database)
In addition to enabling/disabling specific `ident`s, allow choosing where debug events go.

Supported sinks (keep minimal):
- `console`: output via `console.log/warn/error`
- `db`: append log events to DB3 (Firebase)
- `both`: do both

Store the sink config under the same DB3 settings document:
- `test_debug_db3/default_debug/debug/output/sink: "console" | "db" | "both"`

Example:
```json
{
	"debug": {
		"output": {
			"sink": "both"
		},
		"enabledIdents": {
			"oap_menu_less.js::restoreSelectedIdFromFirebase::start": true
		}
	}
}
```

DB logging (minimal recommended shape):
- Location: `test_debug_db3/default_debug/debug/logs/{autoId}`
- Value: `{ ts, level, ident, msg, extra? }`

Rule:
- If `ident` is disabled, do nothing (no console, no DB write).
- If enabled, write to the configured sink.

Quick manual test (DevTools Console):
1) In Firebase, set:
- `debug/enabledIdents/<encodedKey>: true` (prefer using the Python helper to enable an ident)
- `debug/output/sink: "console"` (or `"db"` / `"both"`)
2) In the browser console:
```js
await cdebug.refreshFromFirebase();
cdebug.log('ping', 'cdebug.js::selftest::ping', { page: location.pathname, t: Date.now() });
```

---

## Acceptance criteria
- Existing pages still run with no errors.
- Settings can be read even before debug is enabled.
- Enabling/disabling one ident in Firebase immediately controls logging after `cdebug.refreshFromFirebase()`.
- Switching `debug.output.sink` between `console`/`db`/`both` changes where enabled logs go after `cdebug.refreshFromFirebase()`.