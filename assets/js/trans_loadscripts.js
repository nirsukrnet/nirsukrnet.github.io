// Dynamic loader for translation page, modeled after main_loadscripts.js
// Loads styles (if any), then required scripts in order, then invokes MainFunc()
// Reuses time‑gated origin clear logic (shared cookie) so behavior stays consistent across pages.

(async function loadTransScripts(){
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = (e)=>{ console.error('[trans] failed script', src, e); reject(e); };
      document.head.appendChild(s);
    });
  }
  function loadStyle(href){
    return new Promise((resolve,reject)=>{
      if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) { resolve(); return; }
      const l = document.createElement('link');
      l.rel='stylesheet'; l.href=href; l.onload=resolve; l.onerror=(e)=>{ console.error('[trans] failed style', href, e); reject(e); };
      document.head.appendChild(l);
    });
  }

  // Time‑gated clear (shared with main page) — resilient to disabled cookies (iOS Private mode)
  const FIVE_MIN_MS = 10 * 1000; // dev mode quick cycle; change to 5*60*1000 for production
  const GUARD_KEY = 'app_lastClearAt';
  const now = Date.now();
  let last = 0;
  // cookie
  const lastCookie = parseInt(getCookie(GUARD_KEY) || '0', 10); if (Number.isFinite(lastCookie)) last = Math.max(last, lastCookie);
  // sessionStorage
  try { const ss = parseInt(sessionStorage.getItem(GUARD_KEY) || '0', 10); if (Number.isFinite(ss)) last = Math.max(last, ss); } catch {}
  // window.name fallback
  try { const m = /(?:^|;)\s*"?app_lastClearAt"?=([0-9]+)/.exec(window.name); if (m){ const wn = parseInt(m[1],10); if (Number.isFinite(wn)) last = Math.max(last, wn); } } catch {}
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  const skipClearForIOS = isIOS && isSafari;
  if (!skipClearForIOS && (!Number.isFinite(last) || (now - last) > FIVE_MIN_MS)){
    setCookie(GUARD_KEY, String(now), 365*24*60*60);
    try { sessionStorage.setItem(GUARD_KEY, String(now)); } catch {}
    try {
      const namePairs = (window.name || '').split(';').filter(Boolean);
      const filtered = namePairs.filter(p => !/^("?app_lastClearAt"?=)/.test(p.trim()));
      filtered.push(`app_lastClearAt=${now}`);
      window.name = filtered.join(';') + ';';
    } catch {}
    const didReload = await clearAppOriginData(GUARD_KEY);
    if (didReload) return; // will restart after reload
  }

  // Styles specific to translation page (none yet, keep array for future) + reuse menu css
  const styles = [
    './assets/css/oap_menu_less.css'
  ];

  // Ordered scripts for translation feature
  const scripts = [
    './help_js/sent_data_json.js',
    './help_js/trans_ui.js',
    './help_js/sent_trans_loadsave.js',
    // Load menu script ahead so trans_ui ensureLessonMenu finds it
    './assets/js/output_audio_phrase/oap_menu_less.js'
  ];

  for (const href of styles){ await loadStyle(href); }
  for (const src of scripts){ await loadScript(src); }

  // Try invoking MainFunc when available
  invokeMainFuncWithPoll();

  function invokeMainFuncWithPoll(){
  if (typeof window.MainFunc === 'function'){ try { window.MainFunc(); /* console.debug('[trans] MainFunc invoked') */ } catch(e){ console.error('[trans] MainFunc error', e); } return; }
    let tries = 0; const maxTries = 50; // ~5s
    const timer = setInterval(()=>{
  if (typeof window.MainFunc === 'function'){ try { window.MainFunc(); /* console.debug('[trans] MainFunc invoked after wait') */ } catch(e){ console.error('[trans] MainFunc error', e); } clearInterval(timer); }
      else if (++tries >= maxTries){ clearInterval(timer); console.error('[trans] MainFunc not found after waiting.'); }
    }, 100);
  }

  // --- Helpers copied (trimmed) from main loader ---
  function getCookie(name){
    const parts = document.cookie.split(';');
    for (const p of parts){
      const [k, ...rest] = p.trim().split('=');
      if (k === name) return decodeURIComponent(rest.join('='));
    }
    return '';
  }
  function setCookie(name,value,maxAgeSec,path='/'){ document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAgeSec}`; }
  async function clearAppOriginData(guardCookieName){
    try { sessionStorage.setItem('app:clear-in-progress','1'); } catch {}
    try { localStorage.clear(); } catch {}
    try {
      (document.cookie||'').split(';').forEach(c => {
        const cname = c.split('=')[0]?.trim();
        if (!cname || cname === guardCookieName) return;
        document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${location.pathname}`;
      });
    } catch {}
    try {
      if (indexedDB && typeof indexedDB.databases === 'function'){
        const dbs = await indexedDB.databases();
        await Promise.all((dbs||[]).map(db => db && db.name && indexedDB.deleteDatabase(db.name)));
      }
    } catch {}
    try { if (typeof caches !== 'undefined'){ const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } } catch {}
    try { if ('serviceWorker' in navigator){ const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); } } catch {}
    location.reload();
    return true;
  }
})();
