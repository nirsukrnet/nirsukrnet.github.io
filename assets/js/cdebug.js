(function(){
  'use strict';

  const SETTINGS_ROOT_PATH = '../test_debug_db3/default_debug';

  function nowIso() {
    try { return new Date().toISOString(); } catch { return String(Date.now()); }
  }

  async function ensureSignedIn() {
    const gv = window.gv;
    if (!gv || !gv.URL_DS) throw new Error('cdebug: window.gv.URL_DS is not available');
    if (gv.URL_DS.idToken) return;
    if (typeof gv.SignIn_User !== 'function') throw new Error('cdebug: gv.SignIn_User() missing');
    await gv.SignIn_User();
  }

  function requestByPath(addurl, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      try {
        const gv = window.gv;
        if (!gv || !gv.URL_DS) throw new Error('cdebug: window.gv.URL_DS is not available');
        const ObjRequest = gv.URL_DS.GetObjForRequest();
        ObjRequest.addUrl = addurl;
        ObjRequest.ametod = method;
        ObjRequest.vobj = body;
        ObjRequest.CallBackFunction = function(vdata) {
          resolve(vdata);
        };
        ObjRequest.ErrorCallback = function(err) {
          reject(err || new Error('cdebug request failed'));
        };
        gv.URL_DS.requestData_By_URL_Path(ObjRequest);
      } catch (e) {
        reject(e);
      }
    });
  }

  function safeLevel(level) {
    const l = String(level || 'log').toLowerCase();
    if (l === 'warn' || l === 'warning') return 'warn';
    if (l === 'error') return 'error';
    return 'log';
  }

  const state = {
    enabledKeys: {},
    sink: 'console' // console | db | both
  };

  function identKey(ident) {
    // Firebase RTDB keys cannot contain: . $ # [ ] / (and cannot be empty).
    // We encode ident -> base64url (no padding) so it is safe to store as a key.
    const s = (ident == null) ? '' : String(ident);
    if (!s) return '';
    try {
      // TextEncoder is available in modern browsers.
      const bytes = new TextEncoder().encode(s);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    } catch {
      // Fallback: best-effort for older browsers.
      try {
        const b64 = btoa(unescape(encodeURIComponent(s)));
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      } catch {
        return '';
      }
    }
  }

  function isEnabled(ident) {
    const key = identKey(ident);
    if (!key) return false;
    return state.enabledKeys && state.enabledKeys[key] === true;
  }

  function getSink() {
    const s = (state.sink == null) ? 'console' : String(state.sink).toLowerCase();
    if (s === 'db' || s === 'both' || s === 'console') return s;
    return 'console';
  }

  async function refreshFromFirebase() {
    // Prefer SettingsStore if present.
    try {
      if (window.SettingsStore && typeof window.SettingsStore.load === 'function') {
        const all = await window.SettingsStore.load();
        const dbg = all && typeof all === 'object' ? all.debug : null;
        const enabled = dbg && typeof dbg === 'object' ? dbg.enabledIdents : null;
        const sink = dbg && typeof dbg === 'object' && dbg.output && typeof dbg.output === 'object'
          ? dbg.output.sink
          : null;

        state.enabledKeys = (enabled && typeof enabled === 'object' && !Array.isArray(enabled)) ? enabled : {};
        state.sink = sink || 'console';
        return;
      }
    } catch (e) {
      // fallthrough to direct reads
      console.warn('[cdebug] refreshFromFirebase via SettingsStore failed', e);
    }

    await ensureSignedIn();
    const dbg = await requestByPath(`${SETTINGS_ROOT_PATH}/debug`, 'GET');
    const enabled = dbg && typeof dbg === 'object' ? dbg.enabledIdents : null;
    const sink = dbg && typeof dbg === 'object' && dbg.output && typeof dbg.output === 'object'
      ? dbg.output.sink
      : null;

    state.enabledKeys = (enabled && typeof enabled === 'object' && !Array.isArray(enabled)) ? enabled : {};
    state.sink = sink || 'console';
  }

  function consoleEmit(level, ident, msg, extra) {
    const l = safeLevel(level);
    const fn = (console && typeof console[l] === 'function') ? console[l] : console.log;
    if (extra !== undefined) fn(`[${ident}] ${msg}`, extra);
    else fn(`[${ident}] ${msg}`);
  }

  async function dbEmit(level, ident, msg, extra) {
    await ensureSignedIn();
    const record = {
      ts: nowIso(),
      level: safeLevel(level),
      ident: String(ident),
      msg: (msg == null) ? '' : String(msg)
    };
    if (extra !== undefined) record.extra = extra;

    // POST under logs to get an autoId.
    await requestByPath(`${SETTINGS_ROOT_PATH}/debug/logs`, 'POST', record);
  }

  function emit(level, msg, ident, extra) {
    if (!isEnabled(ident)) return;

    const sink = getSink();

    if (sink === 'console' || sink === 'both') {
      try { consoleEmit(level, ident, msg, extra); } catch {}
    }

    if (sink === 'db' || sink === 'both') {
      // Do not block UI on DB writes.
      Promise.resolve().then(() => dbEmit(level, ident, msg, extra)).catch((e) => {
        try { console.warn('[cdebug] dbEmit failed', e); } catch {}
      });
    }
  }

  function ctx(file, fn) {
    const f = (file == null) ? '' : String(file).trim();
    const n = (fn == null) ? '' : String(fn).trim();
    const prefix = `${f}::${n}`;

    const build = (tag) => {
      const t = (tag == null) ? '' : String(tag).trim();
      return t ? `${prefix}::${t}` : prefix;
    };

    return {
      log(tag, extra) { emit('log', tag, build(tag), extra); },
      warn(tag, extra) { emit('warn', tag, build(tag), extra); },
      error(tag, errOrExtra) { emit('error', tag, build(tag), errOrExtra); }
    };
  }

  const cdebug = {
    isEnabled,
    refreshFromFirebase,
    log(msg, ident, extra) { emit('log', msg, ident, extra); },
    warn(msg, ident, extra) { emit('warn', msg, ident, extra); },
    error(msg, ident, extra) { emit('error', msg, ident, extra); },
    ctx
  };

  window.cdebug = window.cdebug || cdebug;

  // Best-effort: preload settings once gv exists (db_connswmp3.js creates window.gv).
  // This allows loading cdebug before db_connswmp3.js without noisy warnings.
  (function scheduleInitialRefresh(){
    let attempts = 0;
    const maxAttempts = 80; // ~8s if interval is 100ms

    const tick = () => {
      attempts++;
      const gv = window.gv;
      const ready = gv && gv.URL_DS;
      if (ready) {
        Promise.resolve().then(() => refreshFromFirebase()).catch(() => {});
        return;
      }
      if (attempts < maxAttempts) {
        setTimeout(tick, 100);
      }
    };

    // Start after current tick so any synchronous scripts can set gv first.
    setTimeout(tick, 0);
  })();
})();
