## Purpose
This note documents how to control debug logging for the app:
- Enable/disable logs by `ident`
- Choose where logs go: console, database, or both

This is implemented by two JS modules:
- `assets/js/settings_store.js` (reads/writes settings root)
- `assets/js/cdebug.js` (debug logger, controlled by Firebase settings)

And a Python helper script to push settings into Firebase:
- `service_test/python/push_debug_settings.py`

---

## How it’s wired into the app
The app scripts are loaded by:
- `assets/js/main_loadscripts.js`

This loader ensures scripts load in a fixed order. `settings_store.js` and `cdebug.js` are loaded early so other scripts can call `window.cdebug`.

---

## Firebase paths used
The debug/settings root is:
- `test_debug_db3/default_debug`

Within that root `cdebug` reads:
- `debug/enabledIdents/{encodedKey}: true` (keys are encoded; don’t type them manually)
- `debug/output/sink: "console" | "db" | "both"`

When DB logging is enabled, `cdebug` appends events to:
- `debug/logs/{autoId}` with a minimal record like:
	- `{ ts, level, ident, msg, extra? }`

---

## Sample settings JSON (full object)
Sample file in this repo:
- `service_test/sample_default_debug_settings.json`

It represents the full object stored at:
- `test_debug_db3/default_debug`

Minimal example:
```json
{
	"debug": {
		"output": { "sink": "console" },
		"enabledIdentsPlain": [
			"cdebug.js::selftest::ping",
			"oneaudio_controlbuttons.js::addButtonsTrans_oap::addedTransButton"
		]
	}
}
```

---

## Ident format
Recommended format:
- `file.js::functionName::tag`

Example ident used in the codebase:
- `oneaudio_controlbuttons.js::addButtonsTrans_oap::addedTransButton`

---

## Quick test (browser)
1) Enable the ident and choose a sink in Firebase (or by Python script below)
2) In DevTools Console:
```js
await cdebug.refreshFromFirebase();
cdebug.log('ping', 'cdebug.js::selftest::ping', { page: location.pathname, t: Date.now() });
```

Nothing will happen unless that `ident` is enabled.

---

## Push settings via Python (recommended)
The helper patches RTDB using the same Firebase credentials as the app.

Script:
- `service_test/python/push_debug_settings.py`

### Examples
Upload the entire JSON (OVERWRITES the node via PUT):
```powershell
python .\service_test\python\push_debug_settings.py --put --force --json .\service_test\sample_default_debug_settings.json
```

Note: PUT overwrites the whole `test_debug_db3/default_debug` object (it can delete existing keys like old `debug/logs`).

Set sink to console:
```powershell
python .\service_test\python\push_debug_settings.py --sink console
```

Enable an ident:
```powershell
python .\service_test\python\push_debug_settings.py --enable "oneaudio_controlbuttons.js::addButtonsTrans_oap::addedTransButton"
```

Enable + send to DB:
```powershell
python .\service_test\python\push_debug_settings.py --sink db --enable "oneaudio_controlbuttons.js::addButtonsTrans_oap::addedTransButton"
```

Disable an ident (deletes it using PATCH-null):
```powershell
python .\service_test\python\push_debug_settings.py --disable "oneaudio_controlbuttons.js::addButtonsTrans_oap::addedTransButton"
```

Dry-run (prints the PATCH body):
```powershell
python .\service_test\python\push_debug_settings.py --sink both --enable "cdebug.js::selftest::ping" --dry-run
```

### Credentials
By default, the script reads Firebase config from `assets/js/global_var.js`.
Optionally override via env vars (so you don’t edit committed files):
- `FIREBASE_API_KEY`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_IDENTITY_BASE_URL`
- `FIREBASE_EMAIL`
- `FIREBASE_PASSWORD`

---

## Sink "both": console + buffered DB (manual save)
If you set:
```json
{
	"debug": {
		"output": { "sink": "both" }
	}
}
```

Behavior:
- Logs still go to the browser console immediately.
- DB writes do NOT happen per log call.
- Instead, `cdebug` keeps DB log records in memory.
- A bottom-right button `sav_deb` appears.
- Clicking `sav_deb` flushes the buffered records into Firebase under `debug/logs`.

Notes:
- If you set sink to `db`, DB logging is immediate (no buffering).
- You can also flush manually from DevTools:
```js
await cdebug.flushToFirebase();
```
