function MainFunc() {  
  build_ExpImpForTrans_MainUI();
  ExpImpForTrans_loadDataToHTML();  
  ensurePartsMenu();
}


function build_ExpImpForTrans_MainUI(){

  RemoveAllStylesExpImpForTrans();
  ExpImpForTrans_createStyles();
  ExpImpForTrans_createStyles_2();

  // Clear body
  document.body.innerHTML = '';

  // // Header
  // const header = document.createElement('div');
  // header.id = 'header1';
  // document.body.appendChild(header);  

  // Top controls
  const controlDivTop = document.createElement('div');
  controlDivTop.id = 'control_div';  
  controlDivTop.innerHTML = `  
  `;

  // Top controls
  const controlDivTop2 = document.createElement('div');  
  controlDivTop2.id = 'control_div_top2';
  controlDivTop2.innerHTML = `  
  `;

  // Global clear translations button (always visible)
  const btnClearAll = document.createElement('button');
  btnClearAll.textContent = 'Clear Current Lesson Trans';
  btnClearAll.className = 'button_controlsentences button_clear_trans_global';
  btnClearAll.title = 'Set all target translations in the current lesson to empty';
  btnClearAll.onclick = () => {
    try {
      // Ensure latest filtered data is available
      window.for_trans_data = transformData();
    } catch {}
    const list = Array.isArray(window.for_trans_data) ? window.for_trans_data : [];
    if (!list.length) {
      alert('No sentences found for the current selection.');
      return;
    }
    if (!confirm('Clear translations for all sentences in the current lesson? This will set the target text to empty.')) return;
    const dataToSave = list.map(x => ({ idsentence: x.idsentence, sentence_to: '' }));
    try { SaveTransReadyDataToFireBase(dataToSave); } catch(e){ console.error('Clear failed', e); }
    // Re-render view
    try { ExpImpForTrans_Sentence_loadDataToHTML(); } catch {}
  };

  document.body.appendChild(controlDivTop);
  document.body.appendChild(controlDivTop2);
  controlDivTop2.appendChild(btnClearAll);

  // Info
  const infoDiv = document.createElement('div');
  infoDiv.id = 'info_div';
  document.body.appendChild(infoDiv);

  // Add parts menu after base UI
  ensurePartsMenu();


  //build_forall_MainUI(document.body);
}

// --- Parts menu integration ---
function ensurePartsMenu(){
  // If menu already present, just refresh
  if (window.oapMenuLess && typeof window.oapMenuLess.refresh === 'function') {
    try { window.oapMenuLess.refresh(); } catch {}
    return;
  }
  // Inject CSS if missing (reuse oap_menu_less.css)
  const cssHref = './assets/css/oap_menu_less.css';
  if (!document.querySelector(`link[rel="stylesheet"][href="${cssHref}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = cssHref;
    document.head.appendChild(l);
  }
  // Dynamically load the menu script
  const jsSrc = './assets/js/output_audio_phrase/oap_menu_less.js';
  if (!document.querySelector(`script[src="${jsSrc}"]`)) {
    const s = document.createElement('script');
    s.src = jsSrc;
    s.onload = () => {
      if (window.oapMenuLess && window.oapMenuLess.refresh) {
        try { window.oapMenuLess.refresh(); } catch {}
      }
    };
    document.head.appendChild(s);
  }
}

// Refresh menu when data arrives
window.addEventListener('oap:data-loaded', () => {
  ensurePartsMenu();
});



function ExpImpForTrans_createStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    #header1 {
      background-color: #f0f0f0;
      padding: 10px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-top: 50px;
    }
    #control_div_top2 {
        display: flex;        
        margin-top: 40px;
        margin-bottom: 20px;
    }
    .button_controlsentences_copy {
        background: #1e90ff;
        color: #fff;
        border: none;
        min-height: 30px;
        border-radius: 7px;
        padding: 12px 28px;
        font-size: 18px;
        font-weight: 600;
        margin: 12px 20px 12px 20px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(30,144,255,0.08);
        transition: background 0.2s, box-shadow 0.2s;
        display: inline-block;
        letter-spacing: 0.5px;    
    }
    .button_control_transl {
      background: #1e90ff;
      color: #fff;
      border: none;
      min-height: 30px;
      border-radius: 7px;
      padding: 12px 28px;
      font-size: 26px;
      font-weight: 600;
      margin: 12px 20px 12px 20px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(30,144,255,0.08);
      transition: background 0.2s, box-shadow 0.2s;
      display: inline-block;
      letter-spacing: 0.5px;
    }
    .button_controlsentences_copy:hover {
        background: #1c86ee;
        box-shadow: 0 4px 16px rgba(30,144,255,0.2);
    }
       .button_control_transl_on { 
        background: rgb(205, 50, 50);
        color: #fff;
    }

    .button_clear_trans_global{
      background: #8b1d1d;
      color: #fff;
      border: none;
      min-height: 30px;
      border-radius: 7px;
      padding: 12px 28px;
      font-size: 18px;
      font-weight: 600;
      margin: 12px 20px 12px 20px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(139,29,29,0.12);
    }

    
  `;
  document.head.appendChild(style);
}
