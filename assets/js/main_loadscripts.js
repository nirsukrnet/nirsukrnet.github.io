async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');

    // Resolve relative path against the current document URL (works on localhost + GitHub Pages)
    s.src = new URL(src, document.baseURI).href;

    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadStyle(href) {
  return new Promise((resolve, reject) => {
    const absHref = new URL(href, document.baseURI).href;

    // avoid duplicates by absolute href
    if (document.querySelector(`link[rel="stylesheet"][href="${absHref}"]`)) {
      resolve();
      return;
    }

    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = absHref;
    l.onload = resolve;
    l.onerror = reject;
    document.head.appendChild(l);
  });
}

(function ensureEarlyMainFuncStub(){
  // Define a very early stub so body onload does not error on slow networks/iOS Safari.
  if (typeof window.MainFunc !== 'function') {
    const stub = function(){ window._mainFuncRanViaBody = true; };
    // store reference for later comparison
    window._earlyMainFuncStub = stub;
    window.MainFunc = stub;
  }
})();

(async function loadAppScripts() {
  // REMOVE USE_ABSOLUTE/base logic entirely (it caused the crash)
  // const base = USE_ABSOLUTE ? location.origin : '';

   // 1) Styles to load (in order)
   const styles = [
    "./assets/css/oap.css",
	  "./assets/css/oap_buttons.css",
	  "./assets/css/oap_menu_less.css"
   ];

   // 2) Scripts to load (in order)
   const scripts = [
    "./assets/js/global_var.js",  // must be first to define global_var class used in other scripts    
    "./assets/js/settings_store.js",
    "./assets/js/cdebug.js",
    "./assets/js/db_connswmp3.js",
    "./assets/js/output_audio_phrase/oap_styles.js",
    "./assets/js/output_oneaudio/oneaudio_controlbuttons.js",
    "./assets/js/output_oneaudio/oneaudio_text.js",
//    "./assets/js/output_audio_phrase/output_audio_text.js",
    "./assets/js/output_audio_phrase/oap_menu_less.js"
  ];

  // Time‑gated clear: make this resilient when cookies/storage are disabled (iOS Private mode)
  //const FIVE_MIN_MS = 5 * 60 * 1000;
  const FIVE_MIN_MS = 10 * 1000;  
  const GUARD_KEY = 'app_lastClearAt';
  const now = Date.now();

  // Read last value from several fallbacks: cookie, sessionStorage, window.name
  let last = 0;
  // cookie
  const lastCookie = parseInt(getCookie(GUARD_KEY) || '0', 10);
  if (Number.isFinite(lastCookie)) last = Math.max(last, lastCookie);
  // sessionStorage
  try {
    const ss = parseInt(sessionStorage.getItem(GUARD_KEY) || '0', 10);
    if (Number.isFinite(ss)) last = Math.max(last, ss);
  } catch {}
  // window.name (works even when cookies/storage are blocked)
  try {
    const m = /(?:^|;)\s*"?app_lastClearAt"?=([0-9]+)/.exec(window.name);
    if (m) {
      const wn = parseInt(m[1], 10);
      if (Number.isFinite(wn)) last = Math.max(last, wn);
    }
  } catch {}

  // Detect iOS Safari (excluding Chrome/Firefox on iOS which also include 'Safari')
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  const skipClearForIOS = isIOS && isSafari; // avoid potential reload loops when storage limited

  if (!skipClearForIOS && (!Number.isFinite(last) || (now - last) > FIVE_MIN_MS)) {
    // Persist guard BEFORE clearing so it survives; use all fallbacks
    setCookie(GUARD_KEY, String(now), 365 * 24 * 60 * 60);
    try { sessionStorage.setItem(GUARD_KEY, String(now)); } catch {}
    try {
      // Store into window.name as a simple ;key=value; pair
      const namePairs = (window.name || '').split(';').filter(Boolean);
      const filtered = namePairs.filter(p => !/^("?app_lastClearAt"?=)/.test(p.trim()));
      filtered.push(`app_lastClearAt=${now}`);
      window.name = filtered.join(';') + ';';
    } catch {}

    const didReload = await clearAppOriginData(GUARD_KEY);
    if (didReload) return;
  }

  // Skip extra clearing here; time-gated clear above prevents repeated reloads

  // Load styles first
  for (const href of styles) {
    try {
      await loadStyle(href);
    } catch (e) {
      console.error('Style load failed', href, e);
    }
  }

  // Then load scripts
  for (const src of scripts) {
    try {
      await loadScript(src);
    } catch (e) {
      console.error('Script load failed', src, e);
    }
  }
  // After scripts loaded, if the early stub ran we need to invoke the real MainFunc now.
  try {
    const real = window.MainFunc;
    if (real && real !== window._earlyMainFuncStub) {
      if (window._mainFuncRanViaBody && !window._mainInitDone) {
        window._mainInitDone = true;
        real();
      }
    }
  } catch(e){ console.error('Post-load MainFunc invocation failed', e); }
  // Real MainFunc will run via body onload; optional second call safe if replaced
  console.log('Ver 2025-12-30', document.baseURI);
})();

// Removed older clearAppOriginData variant to avoid conflicts; using the time-gated version below

// Helpers for guard cookie
function getCookie(name){
  const parts = document.cookie.split(';');
  for (const p of parts){
    const [k, ...rest] = p.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}
function setCookie(name, value, maxAgeSec, path = '/'){
  // Do not encode the name; use a safe cookie name and encode only the value
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAgeSec}`;
}

// Clear only this origin’s data; keep the guard cookie
async function clearAppOriginData(guardCookieName = 'app:lastClearAt'){
  // prevent immediate loop after reload
  try { sessionStorage.setItem('app:clear-in-progress', '1'); } catch {}

  // local/session storage
  try { localStorage.clear(); } catch {}
  // keep sessionStorage so the flag survives

  // cookies (skip guard)
  try {
    (document.cookie || '').split(';').forEach(c => {
      const name = c.split('=')[0]?.trim();
      if (!name || name === guardCookieName) return;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${location.pathname}`;
    });
  } catch {}

  // IndexedDB
  try {
    if (indexedDB && typeof indexedDB.databases === 'function') {
      const dbs = await indexedDB.databases();
      await Promise.all((dbs || []).map(db => db && db.name && indexedDB.deleteDatabase(db.name)));
    }
  } catch {}

  // Cache Storage
  try {
    if (typeof caches !== 'undefined'){
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {}

  // Service Workers
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch {}

  location.reload();
  return true;
}

