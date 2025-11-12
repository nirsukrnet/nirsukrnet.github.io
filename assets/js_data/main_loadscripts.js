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

//"./assets/js_data/index_content_data.js",

(async function loadAppScripts() {   
   const start_url = 'http://localhost:8080';
   const scripts = [

    "./assets/js_data/global_var.js",  // must be first to define global_var class used in other scripts    
    "./assets/js_data/db_connswmp3.js",
    "./assets/js_data/output_audio_text.js"

  ];

  for (const src of scripts) {
    let full_src = start_url + src.slice(1);
    await loadScript(full_src);
  }
  // MainFunc is now available for onload in HTML
})();



// async function loadScript(src) {
//   return new Promise((resolve, reject) => {
//     const s = document.createElement('script');
//     s.src = src;
//     s.onload = resolve;
//     s.onerror = reject;
//     // optional: s.defer = true; // order is controlled by awaiting, not defer
//     document.head.appendChild(s);
//   });
  
// }

//"./assets/js_data/index_content_data.js",

