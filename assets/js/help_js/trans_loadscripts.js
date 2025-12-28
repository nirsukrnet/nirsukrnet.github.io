// Dynamic loader for translation page, modeled after main_loadscripts.js
// Loads styles, then required scripts in order, then invokes MainFunc()
// Uses the same time‑gated origin clear to keep behavior consistent.

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

  // Time‑gated clear (dev: 10s; prod: 5*60*1000)
  const FIVE_MIN_MS = 10 * 1000;
  const GUARD_COOKIE = 'app_lastClearAt';
  const now = Date.now();
  const last = parseInt(getCookie(GUARD_COOKIE) || '0', 10);
  if (!Number.isFinite(last) || (now - last) > FIVE_MIN_MS){
    setCookie(GUARD_COOKIE, String(now), 365*24*60*60);
    const didReload = await clearAppOriginData(GUARD_COOKIE);
    if (didReload) return;
  }

  // Styles
  const styles = [
    './assets/css/oap_menu_less.css'
  ];

  // Scripts (absolute relative to page)
  const scripts = [
    // Firebase/globals first
    './assets/js/global_var.js',
    './assets/js/db_connswmp3.js',
    // Translation UI scripts
    './assets/js/help_js/sent_data_json.js',
    './assets/js/help_js/trans_ui.js',
    './assets/js/help_js/sent_trans_loadsave.js',
    // Menu
    './assets/js/output_audio_phrase/oap_menu_less.js'
  ];

  for (const href of styles){ await loadStyle(href); }
  for (const src of scripts){ await loadScript(src); }

  // Ensure Firebase data is loaded for translation workflow
  await initFirebaseDataForTrans();

  // Invoke MainFunc when ready
  invokeMainFuncWithPoll();

  async function initFirebaseDataForTrans(){
    try {
      if (window.gv && typeof gv.SignIn_User === 'function'){
        await gv.SignIn_User();
        // if (typeof window.Get_All_Tables_Meta === 'function') await Get_All_Tables_Meta(); // Not needed for data_base3
        if (typeof window.Get_Rows_All_Tables === 'function') await Get_Rows_All_Tables();
      }
    } catch(e){ console.error('[trans] Firebase init failed', e); }
  }

  function invokeMainFuncWithPoll(){
    if (typeof window.MainFunc === 'function'){ try { window.MainFunc(); console.info('[trans] MainFunc invoked'); } catch(e){ console.error('[trans] MainFunc error', e); } return; }
    let tries = 0; const maxTries = 50;
    const timer = setInterval(()=>{
      if (typeof window.MainFunc === 'function'){ try { window.MainFunc(); console.info('[trans] MainFunc invoked after wait'); } catch(e){ console.error('[trans] MainFunc error', e); } clearInterval(timer); }
      else if (++tries >= maxTries){ clearInterval(timer); console.error('[trans] MainFunc not found after waiting.'); }
    }, 100);
  }

  // Helpers
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
      if (indexedDB?.databases){ const dbs = await indexedDB.databases(); await Promise.all((dbs||[]).map(db => db?.name && indexedDB.deleteDatabase(db.name))); }
    } catch {}
    try { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } catch {}
    try { if ('serviceWorker' in navigator){ const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); } } catch {}
    location.reload();
    return true;
  }
})();
