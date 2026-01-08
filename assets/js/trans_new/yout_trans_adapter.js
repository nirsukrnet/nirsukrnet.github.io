// Adapter layer for yout_transl.html
// - Replaces lesson menu with YouTube video select
// - Overrides ExpImpForTrans_loadDataToHTML to load transcript items
// - Routes "save" into ../db_youtube2/youtube_transcripts

(function(){
  const APP_NS = 'yout_transl';
  const DEFAULT_FROM = 'sv';
  const DEFAULT_TO = 'en';

  const state = {
    videoId: '',
    fromLang: DEFAULT_FROM,
    toLang: DEFAULT_TO,
    refVideos: []
  };

  function cleanStr(v){ return (v == null) ? '' : String(v).trim(); }
  function cleanLangCode(v){
    const s = cleanStr(v).toLowerCase();
    if (!s) return '';
    if (!/^[a-z0-9_-]{2,16}$/.test(s)) return '';
    return s;
  }

  function setContentLangs(fromLang, toLang){
    const f = cleanLangCode(fromLang) || DEFAULT_FROM;
    const t = cleanLangCode(toLang) || DEFAULT_TO;
    window.CONTENT_DATA_JSON = window.CONTENT_DATA_JSON || {};
    window.CONTENT_DATA_JSON.translationFrom = f;
    window.CONTENT_DATA_JSON.translationTo = t;
    state.fromLang = f;
    state.toLang = t;
  }

  function labelForRefVideo(v){
    return cleanStr(v && (v.short_name || v.title || v.indent_id || v.url)) || '(unnamed)';
  }

  function getVideoIdFromRefVideo(v){
    const indent = cleanStr(v && v.indent_id);
    if (indent) return indent;
    const url = cleanStr(v && v.url);
    if (url && window.YouTubeRefVideosStore && typeof window.YouTubeRefVideosStore.extractVideoIdFromUrl === 'function'){
      return cleanStr(window.YouTubeRefVideosStore.extractVideoIdFromUrl(url));
    }
    return '';
  }

  async function loadRefVideos(){
    if (!window.YouTubeRefVideosStore || typeof window.YouTubeRefVideosStore.listAll !== 'function'){
      console.error('[yout_trans] YouTubeRefVideosStore.listAll not available');
      return [];
    }
    try {
      const list = await window.YouTubeRefVideosStore.listAll();
      return Array.isArray(list) ? list : [];
    } catch(e){
      console.error('[yout_trans] Failed to load ref videos', e);
      return [];
    }
  }

  function ensureTopControls(){
    // trans_ui builds #control_div and #control_div_top2
    const root = document.getElementById('control_div') || document.body;

    let wrap = document.getElementById('youtTransMenu');
    if (wrap) return wrap;

    wrap = document.createElement('div');
    wrap.id = 'youtTransMenu';
    wrap.style.display = 'flex';
    wrap.style.flexWrap = 'wrap';
    wrap.style.gap = '10px';
    wrap.style.alignItems = 'center';
    wrap.style.marginTop = '10px';

    const labelVideo = document.createElement('label');
    labelVideo.textContent = 'Video: ';
    labelVideo.style.fontWeight = '600';

    const selVideo = document.createElement('select');
    selVideo.id = 'youtVideoSelect';
    selVideo.style.minHeight = '44px';

    const labelFrom = document.createElement('label');
    labelFrom.textContent = 'From: ';
    labelFrom.style.fontWeight = '600';

    const selFrom = document.createElement('select');
    selFrom.id = 'youtFromLang';
    selFrom.style.minHeight = '44px';

    const labelTo = document.createElement('label');
    labelTo.textContent = 'To: ';
    labelTo.style.fontWeight = '600';

    const selTo = document.createElement('select');
    selTo.id = 'youtToLang';
    selTo.style.minHeight = '44px';

    const langs = ['sv','en','uk'];
    for (const code of langs){
      const o1 = document.createElement('option');
      o1.value = code; o1.textContent = code.toUpperCase();
      selFrom.appendChild(o1);
      const o2 = document.createElement('option');
      o2.value = code; o2.textContent = code.toUpperCase();
      selTo.appendChild(o2);
    }

    selFrom.value = state.fromLang;
    selTo.value = state.toLang;

    wrap.appendChild(labelVideo);
    wrap.appendChild(selVideo);
    wrap.appendChild(labelFrom);
    wrap.appendChild(selFrom);
    wrap.appendChild(labelTo);
    wrap.appendChild(selTo);

    // Video-level clear translations button (yout_transl only)
    const btnClearVideo = document.createElement('button');
    btnClearVideo.id = 'youtBtnClearVideoTrans';
    // Reuse styling from trans_ui.js but with a different title so we can hide lesson button safely.
    btnClearVideo.className = 'button_controlsentences button_clear_trans_global';
    btnClearVideo.title = 'Set all target translations in the current video to empty';
    btnClearVideo.textContent = 'Clear Current Video Trans';
    btnClearVideo.onclick = async () => {
      const vid = cleanStr(state.videoId);
      if (!vid) {
        alert('No video selected.');
        return;
      }

      const list = Array.isArray(window.for_trans_data) ? window.for_trans_data : [];
      if (!list.length) {
        alert('No transcript rows loaded for the current selection.');
        return;
      }

      if (!confirm(`Clear translations for ALL rows in the selected video?\n\nVideo: ${vid}\nTo: ${(state.toLang || '').toUpperCase()}`)) return;

      const dataToSave = list.map(x => ({ idsentence: x.idsentence, sentence_to: '' }));
      try {
        if (typeof window.SaveTransReadyDataToFireBaseTo_text_trans_phrases === 'function') {
          await window.SaveTransReadyDataToFireBaseTo_text_trans_phrases(dataToSave);
        } else if (typeof window.SaveTransReadyDataToFireBase === 'function') {
          await window.SaveTransReadyDataToFireBase(dataToSave);
        } else {
          console.error('[yout_trans] No save function available for clearing');
        }
      } catch (e) {
        console.error('[yout_trans] Clear video translations failed', e);
      }

      // Reload from DB so UI reflects persisted state
      try { await window.ExpImpForTrans_loadDataToHTML(); } catch {}
    };

    wrap.appendChild(btnClearVideo);

    root.appendChild(wrap);

    selVideo.onchange = () => {
      state.videoId = cleanStr(selVideo.value);
      try { localStorage.setItem(`${APP_NS}:videoId`, state.videoId); } catch {}
      Promise.resolve().then(() => window.ExpImpForTrans_loadDataToHTML()).catch(()=>{});
    };

    selFrom.onchange = () => {
      setContentLangs(selFrom.value, selTo.value);
      Promise.resolve().then(() => window.ExpImpForTrans_loadDataToHTML()).catch(()=>{});
    };

    selTo.onchange = () => {
      setContentLangs(selFrom.value, selTo.value);
      Promise.resolve().then(() => window.ExpImpForTrans_loadDataToHTML()).catch(()=>{});
    };

    return wrap;
  }

  function hideLessonClearButton(){
    // In transl.html this button is valid. In yout_transl.html it is misleading.
    // Hide only the lesson-specific button by its title.
    try {
      const btn = document.querySelector('button.button_clear_trans_global[title="Set all target translations in the current lesson to empty"]');
      if (btn) btn.style.display = 'none';
    } catch {}
  }

  function renderVideoOptions(){
    const sel = document.getElementById('youtVideoSelect');
    if (!sel) return;

    sel.innerHTML = '';

    const vids = Array.isArray(state.refVideos) ? state.refVideos : [];
    for (const v of vids){
      const vid = getVideoIdFromRefVideo(v);
      if (!vid) continue;
      const opt = document.createElement('option');
      opt.value = vid;
      opt.textContent = labelForRefVideo(v);
      sel.appendChild(opt);
    }

    if (state.videoId) sel.value = state.videoId;
  }

  async function ensureVideoMenu(){
    ensureTopControls();
    hideLessonClearButton();

    if (!state.refVideos.length){
      state.refVideos = await loadRefVideos();
    }

    // Restore last video selection
    if (!state.videoId){
      try { state.videoId = cleanStr(localStorage.getItem(`${APP_NS}:videoId`)); } catch {}
    }

    if (!state.videoId){
      const first = (state.refVideos || []).find(v => getVideoIdFromRefVideo(v));
      state.videoId = first ? getVideoIdFromRefVideo(first) : '';
    }

    renderVideoOptions();
  }

  async function loadTranscriptRowsForSelected(){
    const vid = cleanStr(state.videoId);
    if (!vid) return [];

    if (!window.YouTubeTranscriptStore || typeof window.YouTubeTranscriptStore.load !== 'function'){
      console.error('[yout_trans] YouTubeTranscriptStore.load not available');
      return [];
    }

    try {
      const data = await window.YouTubeTranscriptStore.load(vid);
      const items = (data && Array.isArray(data.items)) ? data.items : [];

      const fromLang = cleanLangCode(state.fromLang) || DEFAULT_FROM;
      const toLang = cleanLangCode(state.toLang) || DEFAULT_TO;
      const srcKey = `text_${fromLang}`;
      const dstKey = `text_${toLang}`;

      const rows = [];
      for (let i = 0; i < items.length; i++){
        const it = items[i] || {};
        const t = Number(it.t);
        const tOk = Number.isFinite(t);

        const sourceText = cleanStr(it[srcKey]) || cleanStr(it.text) || '';
        const targetText = cleanStr(it[dstKey]) || '';

        rows.push({
          _partid: `yt_${vid}`,
          _txtid: tOk ? `t_${t}` : `i_${i}`,
          _srcIndex: i,
          t: tOk ? t : null,

          // IMPORTANT: transformData() reads ONLY text_sv/text_en
          text_sv: sourceText,
          text_en: targetText
        });
      }

      return rows;
    } catch(e){
      console.error('[yout_trans] Failed to load transcript', e);
      return [];
    }
  }

  async function expImpLoadDataToHTML_Youtube(){
    await ensureVideoMenu();
    hideLessonClearButton();
    setContentLangs(state.fromLang, state.toLang);

    const rows = await loadTranscriptRowsForSelected();
    if (typeof window.ExpImpForTrans_Sentence_loadDataToHTML === 'function'){
      window.ExpImpForTrans_Sentence_loadDataToHTML(rows);
    } else {
      console.error('[yout_trans] ExpImpForTrans_Sentence_loadDataToHTML not available');
    }
  }

  function installSaveRouting(){
    // Route DB3 saver calls to YouTube transcript saver.
    window.SaveTransReadyDataToFireBaseTo_text_trans_phrases = async function(dataToSave){
      const vid = cleanStr(state.videoId);
      const toLang = cleanLangCode(state.toLang) || DEFAULT_TO;
      const fromLang = cleanLangCode(state.fromLang) || DEFAULT_FROM;
      if (!vid){
        console.warn('[yout_trans] No video selected; cannot save');
        return;
      }
      if (typeof window.SaveTransReadyDataToFireBaseTo_youtube_transcripts !== 'function'){
        console.error('[yout_trans] SaveTransReadyDataToFireBaseTo_youtube_transcripts not available');
        return;
      }
      return await window.SaveTransReadyDataToFireBaseTo_youtube_transcripts(vid, toLang, fromLang, dataToSave);
    };

    // Also route the legacy audio saver (used by "Clear Current Lesson Trans" button)
    window.SaveTransReadyDataToFireBase = async function(dataToSave){
      return await window.SaveTransReadyDataToFireBaseTo_text_trans_phrases(dataToSave);
    };
  }

  function installOverrides(){
    // Replace lesson menu with our YouTube menu.
    try {
      // This function is called by trans_ui.MainFunc; redefining it here overrides the old one.
      window.ensureLessonMenu = async function(){
        await ensureVideoMenu();
      };
    } catch {}

    // Override the main data loader used by the translation UI.
    window.ExpImpForTrans_loadDataToHTML = expImpLoadDataToHTML_Youtube;

    installSaveRouting();
  }

  // Initialize defaults ASAP.
  setContentLangs(DEFAULT_FROM, DEFAULT_TO);
  installOverrides();
})();
