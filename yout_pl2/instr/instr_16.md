## instr_16: “Store Debug” button (save diagnostics to Firebase RTDB)

### Goal
Add a new button **Store Debug** inside the **Menu dialog** (`<dialog id="dlgMenu">`). When clicked, it collects a compact set of runtime diagnostics and saves them to Firebase Realtime Database (RTDB) under:

- `<DB_CONST_DB_YOUTUBE2_ROOT>/debug_info/<autoId>`

This is used to debug iPhone-specific issues (ex: why ads show in one page but not another, auth issues, iframe host differences, etc.).

### UI requirements

- Add a new button inside the Menu dialog:
	- `id="btnStoreDebug"`
	- `type="button"` (must NOT close the dialog)
	- label text: `Store Debug`

- Button placement:
	- In `dlgMenu`, in the first action row:
		- `<div class="row" style="margin:0 0 12px;">`
		- next to `btnMenuPaste` and `btnAddVideo`

### Behavior
- On click:
	1) Ensure Firebase sign-in (use existing `ytEnsureSignedIn()` flow).
	2) Collect debug data (see fields below).
	3) Save it into RTDB via `POST` (so Firebase generates a unique key).
	4) Show user feedback:
		 - While saving: `Saving debug...`
		 - On success: `Debug saved: <key>`
		 - On failure: `Debug save failed: <error>`

### Data to save (payload)
Store a single JSON object with these fields (keep it small; max ~10–30KB):

**Metadata**
- `createdAt`: ISO string
- `page`: `location.href`
- `origin`: `location.origin`
- `referrer`: `document.referrer` (optional)

**Browser / device**
- `userAgent`: `navigator.userAgent`
- `platform`: `navigator.platform` (if available)
- `language`: `navigator.language`

**App state**
- `currentVideoId`: current selected videoId
- `playMode`: current play mode value (if exists)
- `isPlaying`: boolean (if exists)
- `activeIndex`: active transcript index (if exists)
- `transcriptLen`: transcript item count

**YouTube iframe diagnostics** (key for iPhone ads debugging)
- `ytIframe` object:
	- `exists`: boolean
	- `src`: iframe `src`
	- `host`: derived host from `src`
	- `sandbox`: iframe `sandbox` attribute (should usually be null)
	- `allow`: iframe `allow` attribute
	- `referrerPolicy`: iframe `referrerpolicy` attribute

**Auth diagnostics (do NOT store secrets)**
- `firebaseAuth` object:
	- `signedInNow`: boolean (based on `gv.URL_DS.idToken`)
	- `hasIdToken`: boolean
	- `userEmail`: optional; only if easily available from Firebase Auth *and* you accept storing it
		- If privacy is a concern, store `userEmailHash` instead (sha256) and omit raw email.

**Last errors (optional, best-effort)**
- `lastError`: a short string, if you track last error message in the app

### Privacy / safety constraints
- Never store `idToken`, `refreshToken`, passwords, or full transcript contents.
- If saving email is not required, omit it.

### Firebase path rules
- Base path MUST be derived from existing constants/logic:
	- Use `getYoutube2RootPath()` (which is based on `gv.cst.getcst('DB_CONST_DB_YOUTUBE2_ROOT')`), then append `/debug_info`.
	- (Optional) You may add a dedicated constant in `GB_Const`, e.g. `DB_CONST_DEBUG_INFO = root + '/debug_info'`, but it is not required.
- Write method:
	- Prefer `POST` to `/debug_info` so RTDB generates an autoId key.

### Acceptance criteria
- Clicking **Store Debug** creates a new entry in RTDB at `<DB_CONST_DB_YOUTUBE2_ROOT>/debug_info/<autoId>`.
- Entry contains iframe info (`src`, `sandbox`, `allow`) and page/userAgent.
- User sees a visible success or error message.
- No tokens/passwords are written to the DB.

