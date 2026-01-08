// Dynamic loader for yout_transl.html
// Loads translation UI scripts, plus YouTube stores + adapter.

(async function loadYoutTransScripts(){
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = (e)=>{ console.error('[yout_trans] failed script', src, e); reject(e); };
      document.head.appendChild(s);
    });
  }

  // Scripts (absolute relative to page)
  const scripts = [
    // Firebase/globals first
    './assets/js/global_var.js',
    './assets/js/db_connswmp3.js',

    // Translation UI scripts    
    './assets/js/trans_new/sent_data_json_nw.js',
    './assets/js/trans_new/trans_nw_ui.js',
    './assets/js/trans_new/sent_trans_nw_loadsave.js',
    './assets/js/trans_new/sent_trans_nw_core.js',

    // YouTube stores
    './yout_pl2/youtube_ref_videos_store.js',
    './yout_pl2/youtube_transcript_store.js',

    // Adapter for YouTube mode
    './assets/js/trans_new/yout_trans_adapter.js'
  ];

  for (const src of scripts){ await loadScript(src); }

  await initFirebase();

  // Invoke MainFunc when ready
  invokeMainFuncWithPoll();

  async function initFirebase(){
    try {
      if (window.gv && typeof gv.SignIn_User === 'function'){
        await gv.SignIn_User();
      }
    } catch(e){ console.error('[yout_trans] Firebase init failed', e); }
  }

  function invokeMainFuncWithPoll(){
    if (typeof window.MainFunc === 'function'){ try { window.MainFunc(); console.info('[yout_trans] MainFunc invoked'); } catch(e){ console.error('[yout_trans] MainFunc error', e); } return; }
    let tries = 0; const maxTries = 50;
    const timer = setInterval(()=>{
      if (typeof window.MainFunc === 'function'){ try { window.MainFunc(); console.info('[yout_trans] MainFunc invoked after wait'); } catch(e){ console.error('[yout_trans] MainFunc error', e); } clearInterval(timer); }
      else if (++tries >= maxTries){ clearInterval(timer); console.error('[yout_trans] MainFunc not found after waiting.'); }
    }, 100);
  }
})();
