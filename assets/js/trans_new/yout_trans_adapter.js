// Adapter layer for yout_transl.html
// - Replaces lesson menu with YouTube video select
// - Overrides ExpImpForTrans_loadDataToHTML to load transcript items
// - Routes "save" into DB_CONST_YOUTUBE_TRANSCRIPTS

(function(){
  const APP_NS = 'yout_transl';
  const DEFAULT_FROM = 'sv';
  const DEFAULT_TO = 'en';

  const UIK_FROM_LANG = 'yout_transl_from_lang';
  const UIK_TO_LANG = 'yout_transl_to_lang';
  const UIK_SELECTED_TAG = 'yout_transl_selected_tag';
  const UIK_VIDEO_TEXT_FILTER = 'yout_transl_video_text_filter';

  const state = {
    videoId: '',
    fromLang: DEFAULT_FROM,
    toLang: DEFAULT_TO,
    refVideosAll: [],
    refVideos: [],
    tags: [],
    selectedTag: '',
    videoTextFilter: ''
  };

  function cleanStr(v){ return (v == null) ? '' : String(v).trim(); }
  function cleanLangCode(v){
    const s = cleanStr(v).toLowerCase();
    if (!s) return '';
    if (!/^[a-z0-9_-]{2,16}$/.test(s)) return '';
    return s;
  }

  function cleanTagCode(v){
    const s = cleanStr(v).toUpperCase();
    if (!s) return '';
    if (!/^[A-Z0-9_-]{1,16}$/.test(s)) return '';
    return s;
  }

  function isSignedInNow(){
    try { return !!(window.gv && window.gv.URL_DS && window.gv.URL_DS.idToken); } catch { return false; }
  }

  function ensureGv(){
    if (window.gv && window.gv.URL_DS && window.gv.cst && typeof window.gv.cst.getcst === 'function') return window.gv;
    const GVClass = (typeof GlobalVars === 'function')
      ? GlobalVars
      : (typeof globalThis !== 'undefined' && typeof globalThis.GlobalVars === 'function')
        ? globalThis.GlobalVars
        : (typeof window.GlobalVars === 'function')
          ? window.GlobalVars
          : null;
    if (GVClass) {
      const gv = new GVClass();
      window.gv = gv;
      return gv;
    }
    throw new Error('[yout_trans] GlobalVars is not available (load ./yout_pl2/yu2_global_var.js first)');
  }

  async function ensureSignedIn(){
    const gv = ensureGv();
    if (gv.URL_DS && gv.URL_DS.idToken) return;
    if (typeof gv.SignIn_User !== 'function') throw new Error('[yout_trans] gv.SignIn_User missing');
    await gv.SignIn_User();
  }

  function requestByPath(addurl, method = 'GET', body = null){
    return new Promise((resolve, reject) => {
      try {
        const gv = ensureGv();
        const ObjRequest = gv.URL_DS.GetObjForRequest();
        ObjRequest.addUrl = addurl;
        ObjRequest.ametod = method;
        ObjRequest.vobj = body;
        ObjRequest.CallBackFunction = function(vdata){ resolve(vdata); };
        ObjRequest.ErrorCallback = function(err){ reject(err || new Error('request failed')); };
        gv.URL_DS.requestData_By_URL_Path(ObjRequest);
      } catch (e) {
        reject(e);
      }
    });
  }

  function nowIso(){
    try { return new Date().toISOString(); } catch { return String(Date.now()); }
  }

  function getUiStatePath(){
    return ensureGv().cst.getcst('DB_CONST_UI_STATE_YOUT_PL2');
  }

  function getRefTagsShortPath(){
    return ensureGv().cst.getcst('DB_CONST_REF_TAGS_SHORT');
  }

  async function loadUiValue(key){
    try {
      await ensureSignedIn();
      const base = getUiStatePath();
      const data = await requestByPath(`${base}/${key}`, 'GET');
      if (data == null) return '';
      if (typeof data === 'string') return cleanStr(data);
      if (typeof data === 'number') return String(data);
      if (typeof data === 'object' && data) {
        if (typeof data.value === 'string') return cleanStr(data.value);
        if (typeof data.value === 'number') return String(data.value);
      }
      return '';
    } catch {
      return '';
    }
  }

  async function saveUiValue(key, value){
    if (!isSignedInNow()) return;
    try {
      const base = getUiStatePath();
      await requestByPath(`${base}/${key}`, 'PUT', { value: String(value || ''), updatedAt: nowIso() });
    } catch {
      // ignore
    }
  }

  let _saveLangTimer = null;
  let _saveFilterTimer = null;

  function scheduleSaveLangState(){
    if (!isSignedInNow()) return;
    try { if (_saveLangTimer) clearTimeout(_saveLangTimer); } catch {}
    _saveLangTimer = setTimeout(async () => {
      await saveUiValue(UIK_FROM_LANG, cleanLangCode(state.fromLang) || DEFAULT_FROM);
      await saveUiValue(UIK_TO_LANG, cleanLangCode(state.toLang) || DEFAULT_TO);
    }, 450);
  }

  function scheduleSaveFilterState(){
    if (!isSignedInNow()) return;
    try { if (_saveFilterTimer) clearTimeout(_saveFilterTimer); } catch {}
    _saveFilterTimer = setTimeout(async () => {
      const tag = cleanTagCode(state.selectedTag);
      await saveUiValue(UIK_SELECTED_TAG, tag);
      await saveUiValue(UIK_VIDEO_TEXT_FILTER, cleanStr(state.videoTextFilter));
    }, 450);
  }

  async function loadTagsShortList(){
    try {
      await ensureSignedIn();
      const data = await requestByPath(getRefTagsShortPath(), 'GET');
      const tagsObj = (data && typeof data === 'object') ? data.tags : null;
      const keys = tagsObj && typeof tagsObj === 'object' ? Object.keys(tagsObj) : [];
      return keys.map(cleanTagCode).filter(Boolean);
    } catch {
      return [];
    }
  }

  function applyVideoFilters(all){
    const selectedTag = cleanTagCode(state.selectedTag);
    const q = cleanStr(state.videoTextFilter).toLowerCase();
    return (Array.isArray(all) ? all : []).filter(v => {
      if (!v) return false;
      if (selectedTag) {
        const t = cleanTagCode(v.tag);
        if (t !== selectedTag) return false;
      }
      if (q) {
        const sn = cleanStr(v.short_name).toLowerCase();
        const title = cleanStr(v.title).toLowerCase();
        if (!sn.includes(q) && !title.includes(q)) return false;
      }
      return true;
    });
  }

  function renderTagButtons(){
    const row = document.getElementById('youtVideoTagRow');
    if (!row) return;
    row.innerHTML = '';

    const tags = Array.isArray(state.tags) ? state.tags : [];
    const selected = cleanTagCode(state.selectedTag);

    function mkBtn(label, tagValue){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.style.padding = '10px 12px';
      btn.style.minHeight = '44px';
      btn.style.border = '1px solid currentColor';
      btn.style.borderRadius = '10px';
      btn.style.background = 'transparent';
      btn.style.cursor = 'pointer';
      const isOn = cleanTagCode(tagValue) === selected;
      if (isOn) {
        btn.style.background = 'color-mix(in srgb, currentColor 14%, transparent)';
      }
      btn.onclick = () => {
        state.selectedTag = cleanTagCode(tagValue);
        renderTagButtons();
        state.refVideos = applyVideoFilters(state.refVideosAll);
        renderVideoOptions();
        scheduleSaveFilterState();
      };
      return btn;
    }

    for (const t of tags){
      row.appendChild(mkBtn(t, t));
    }
    // All button last
    row.appendChild(mkBtn('All', ''));
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
    wrap.style.display = 'grid';
    wrap.style.gap = '10px';
    wrap.style.alignItems = 'start';
    wrap.style.marginTop = '10px';

    const rowTop = document.createElement('div');
    rowTop.style.display = 'flex';
    rowTop.style.flexWrap = 'wrap';
    rowTop.style.gap = '10px';
    rowTop.style.alignItems = 'center';

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

    rowTop.appendChild(labelVideo);
    rowTop.appendChild(selVideo);
    rowTop.appendChild(labelFrom);
    rowTop.appendChild(selFrom);
    rowTop.appendChild(labelTo);
    rowTop.appendChild(selTo);

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

    rowTop.appendChild(btnClearVideo);

    const tagRow = document.createElement('div');
    tagRow.id = 'youtVideoTagRow';
    tagRow.style.display = 'flex';
    tagRow.style.flexWrap = 'wrap';
    tagRow.style.gap = '10px';
    tagRow.style.alignItems = 'center';

    const filterRow = document.createElement('div');
    filterRow.style.display = 'flex';
    filterRow.style.flexWrap = 'wrap';
    filterRow.style.gap = '10px';
    filterRow.style.alignItems = 'center';

    const inFilter = document.createElement('input');
    inFilter.id = 'youtVideoTextFilter';
    inFilter.placeholder = 'type to filter';
    inFilter.autocomplete = 'off';
    inFilter.spellcheck = false;
    inFilter.style.minHeight = '44px';
    inFilter.style.padding = '10px 12px';
    inFilter.style.border = '1px solid currentColor';
    inFilter.style.borderRadius = '10px';
    inFilter.style.width = 'min(720px, 100%)';
    filterRow.appendChild(inFilter);

    // Order (per instr): filter block first, then the main menu row.
    wrap.appendChild(tagRow);
    wrap.appendChild(filterRow);
    wrap.appendChild(rowTop);

    root.appendChild(wrap);

    selVideo.onchange = () => {
      state.videoId = cleanStr(selVideo.value);
      try { localStorage.setItem(`${APP_NS}:videoId`, state.videoId); } catch {}
      Promise.resolve().then(() => window.ExpImpForTrans_loadDataToHTML()).catch(()=>{});
    };

    selFrom.onchange = () => {
      setContentLangs(selFrom.value, selTo.value);
      scheduleSaveLangState();
      Promise.resolve().then(() => window.ExpImpForTrans_loadDataToHTML()).catch(()=>{});
    };

    selTo.onchange = () => {
      setContentLangs(selFrom.value, selTo.value);
      scheduleSaveLangState();
      Promise.resolve().then(() => window.ExpImpForTrans_loadDataToHTML()).catch(()=>{});
    };

    inFilter.oninput = () => {
      state.videoTextFilter = cleanStr(inFilter.value);
      state.refVideos = applyVideoFilters(state.refVideosAll);
      renderVideoOptions();
      scheduleSaveFilterState();
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

    // Keep current selection if still present; otherwise pick first.
    if (state.videoId) sel.value = state.videoId;
    if (state.videoId && sel.value !== state.videoId) {
      state.videoId = cleanStr(sel.value);
      try { localStorage.setItem(`${APP_NS}:videoId`, state.videoId); } catch {}
    }
  }

  async function ensureVideoMenu(){
    ensureTopControls();
    hideLessonClearButton();

    // Restore persisted UI state (langs + filters) once per session.
    if (!state._uiLoaded) {
      state._uiLoaded = true;
      try {
        const f = await loadUiValue(UIK_FROM_LANG);
        const t = await loadUiValue(UIK_TO_LANG);
        if (cleanLangCode(f)) state.fromLang = cleanLangCode(f);
        if (cleanLangCode(t)) state.toLang = cleanLangCode(t);

        const st = await loadUiValue(UIK_SELECTED_TAG);
        state.selectedTag = cleanTagCode(st);
        const q = await loadUiValue(UIK_VIDEO_TEXT_FILTER);
        state.videoTextFilter = cleanStr(q);
      } catch {}

      // Reflect to controls
      try {
        const selFrom = document.getElementById('youtFromLang');
        const selTo = document.getElementById('youtToLang');
        if (selFrom) selFrom.value = state.fromLang;
        if (selTo) selTo.value = state.toLang;
        const inFilter = document.getElementById('youtVideoTextFilter');
        if (inFilter) inFilter.value = state.videoTextFilter;
      } catch {}
    }

    // Load tags for tag buttons
    if (!Array.isArray(state.tags) || !state.tags.length) {
      state.tags = await loadTagsShortList();
      renderTagButtons();
    }

    if (!state.refVideosAll.length){
      state.refVideosAll = await loadRefVideos();
    }

    state.refVideos = applyVideoFilters(state.refVideosAll);

    // Restore last video selection
    if (!state.videoId){
      try { state.videoId = cleanStr(localStorage.getItem(`${APP_NS}:videoId`)); } catch {}
    }

    if (!state.videoId || !state.refVideos.some(v => getVideoIdFromRefVideo(v) === state.videoId)){
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
