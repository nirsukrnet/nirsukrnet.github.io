async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    // optional: s.defer = true; // order is controlled by awaiting, not defer
    document.head.appendChild(s);
  });
  
}

async function loadStyle(href) {
  return new Promise((resolve, reject) => {
    // avoid duplicates by href
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
      resolve();
      return;
    }
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = resolve;
    l.onerror = reject;
    document.head.appendChild(l);
  });
}

(async function loadAppScripts() {   
   const start_url = 'http://localhost:8080';

   // 1) Styles to load (in order)
   const styles = [
    "./assets/css/oap.css",
	  "./assets/css/oap_buttons.css"
   ];

   // 2) Scripts to load (in order)
   const scripts = [
    "./assets/js/global_var.js",  // must be first to define global_var class used in other scripts    
    "./assets/js/db_connswmp3.js",
    "./assets/js/output_audio_phrase/oap_styles.js",
    "./assets/js/output_audio_phrase/oap_controlbuttons.js",
    "./assets/js/output_audio_phrase/output_audio_text.js"
  ];

  // Time‑gated clear: run at most once every 5 minutes
  //const FIVE_MIN_MS = 5 * 60 * 1000;
  const FIVE_MIN_MS = 10 * 1000;  
  // Use a cookie name without special characters to avoid encoding mismatches
  const GUARD_COOKIE = 'app_lastClearAt';
  const now = Date.now();
  const last = parseInt(getCookie(GUARD_COOKIE) || '0', 10);

  if (!Number.isFinite(last) || (now - last) > FIVE_MIN_MS) {
    // write guard BEFORE clearing so it survives (we skip deleting it below)
    setCookie(GUARD_COOKIE, String(now), 365 * 24 * 60 * 60);
    const didReload = await clearAppOriginData(GUARD_COOKIE);
    if (didReload) return;
  }

  // Skip extra clearing here; time-gated clear above prevents repeated reloads

  // Load styles first
  for (const href of styles) {
    const full_href = start_url + href.slice(1);
    await loadStyle(full_href);
  }

  // Then load scripts
  for (const src of scripts) {
    let full_src = start_url + src.slice(1);
    await loadScript(full_src);
  }
  // MainFunc is now available for onload in HTML
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
    if (indexedDB?.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all((dbs || []).map(db => db?.name && indexedDB.deleteDatabase(db.name)));
    }
  } catch {}

  // Cache Storage
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
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

