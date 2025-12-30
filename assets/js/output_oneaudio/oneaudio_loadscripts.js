
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadStyle(href) {
  return new Promise((resolve, reject) => {
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

(function ensureEarlyMainFuncStub(){
  if (typeof window.MainFunc !== 'function') {
    const stub = function(){ window._mainFuncRanViaBody = true; };
    window._earlyMainFuncStub = stub;
    window.MainFunc = stub;
  }
})();

(async function loadAppScripts() {   
  const USE_ABSOLUTE = location.origin.includes('nirsukrnet.github.io');
  const base = USE_ABSOLUTE ? location.origin : '';

   const styles = [
    "./assets/css/oap.css",
	  "./assets/css/oap_buttons.css",
	  "./assets/css/oap_menu_less.css"
   ];

   // Modified script list for OneAudio player
   const scripts = [
    "./assets/js/global_var.js",      
    // Use the same Firebase-backed loader as mp3.html
    "./assets/js/db_connswmp3.js",
    "./assets/js/output_audio_phrase/oap_styles.js",
    "./assets/js/output_oneaudio/oneaudio_controlbuttons.js",
    "./assets/js/output_oneaudio/oneaudio_text.js",
    "./assets/js/output_audio_phrase/oap_menu_less.js"
  ];

  // Load styles
  for (const href of styles) {
    try { await loadStyle(base ? (base + href.slice(1)) : href); } catch (e) { console.error('Style load failed', href, e); }
  }

  // Load scripts
  for (const src of scripts) {
    try { await loadScript(base ? (base + src.slice(1)) : src); } catch (e) { console.error('Script load failed', src, e); }
  }

  // Invoke MainFunc
  try {
    const real = window.MainFunc;
    if (real && real !== window._earlyMainFuncStub) {
      if (window._mainFuncRanViaBody && !window._mainInitDone) {
        window._mainInitDone = true;
        real();
      }
    }
  } catch(e){ console.error('Post-load MainFunc invocation failed', e); }
})();
