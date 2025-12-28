(function(){
  // Ensure CSS is present
  const cssHref = './assets/css/oap_menu_less.css';
  if (!document.querySelector(`link[rel="stylesheet"][href="${cssHref}"]`)){
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = cssHref; document.head.appendChild(l);
  }

  function currentSelectedId(){
    try { return window.gv?.sts?.selected_lesson_id; } catch { return null; }
  }

  async function setSelectedId(id){
    console.log('[trans_menu_filtered] setSelectedId called with:', id);
    if (!window.gv || !window.gv.sts) {
        console.error('[trans_menu_filtered] Global vars (gv.sts) not found');
        return;
    }
    window.gv.sts.selected_lesson_id = id;
    try { localStorage.setItem('oap:selected_lesson_id', String(id)); } catch {}
    
    // Find parts for this lesson
    let parts = getPartsForLesson(id);
    
    // Fallback: if no parts found via lesson map, but ID is in parts_list, use it directly
    if (parts.length === 0 && window.gv?.sts?.parts_list && window.gv.sts.parts_list.includes(id)) {
        parts = [id];
    }

    console.log(`[trans_menu_filtered] Lesson ${id} selected. Found parts:`, parts);

    if (parts.length > 0) {
        // Load the first part found
        // Ideally we should let user choose if multiple, but for now load first
        const partKey = parts[0];
        if (typeof window.Load_DB3_Lesson_Phrases === 'function') {
            try {
                console.log(`[trans_menu_filtered] Loading part ${partKey} for lesson ${id}...`);
                await window.Load_DB3_Lesson_Phrases(partKey);
            } catch(e) {
                console.error('[trans_menu_filtered] Load_DB3_Lesson_Phrases failed', e);
            }
        }
    } else {
        console.warn(`[trans_menu_filtered] No parts found for lesson ${id}`);
        // Clear phrases?
        window.gv.sts.audio_phrases = [];
    }

    // Re-render content
    if (typeof window.ExpImpForTrans_loadDataToHTML === 'function') {
      try { 
          window.ExpImpForTrans_loadDataToHTML(); 
      } catch(e){ console.error('[trans_menu_filtered] reload failed', e); }
    } else if (typeof window.loadContentData === 'function') {
      try { 
          window.loadContentData(); 
      } catch(e){ console.error('[trans_menu_filtered] reload failed', e); }
    }
    
    window.dispatchEvent(new CustomEvent('oap:lesson-selected', { detail: { id } }));
    
    highlightActive();
    closePopup();
  }

  function getPartsForLesson(lessonId) {
      if (!window.gv?.sts?.lessons_audio_phrases || !window.gv?.sts?.txt_to_part_map) return [];
      
      let lessonObj = null;
      const rawData = window.gv.sts.lessons_audio_phrases;
      if (Array.isArray(rawData)) {
          lessonObj = rawData.find(l => String(l.lesson_id ?? l.rec_id) === String(lessonId));
      } else {
          lessonObj = Object.values(rawData).find(l => String(l.lesson_id ?? l.rec_id) === String(lessonId));
      }

      if (!lessonObj) return [];

      let txtIds = [];
      if (lessonObj.phrases_files && Array.isArray(lessonObj.phrases_files)) {
          txtIds = lessonObj.phrases_files;
      } else if (lessonObj.phrases && Array.isArray(lessonObj.phrases)) {
          txtIds = lessonObj.phrases;
      } else if (lessonObj.files && Array.isArray(lessonObj.files)) {
          txtIds = lessonObj.files;
      }

      const parts = new Set();
      txtIds.forEach(txtId => {
          const part = window.gv.sts.txt_to_part_map[txtId];
          if (part) parts.add(part);
      });

      return Array.from(parts).sort();
  }

  function buildListData(){
    let rawData = window.gv?.sts?.lessons_audio_phrases;
    
    // Fallback: if no lessons, use parts_list
    if ((!rawData || (Array.isArray(rawData) && rawData.length === 0) || (typeof rawData === 'object' && Object.keys(rawData).length === 0)) 
        && window.gv?.sts?.parts_list && window.gv.sts.parts_list.length > 0) {
        return window.gv.sts.parts_list.map(p => ({
            lesson_id: p,
            label: `Part ${p}`
        }));
    }

    if (!rawData) return [];

    let les_list1 = [];
    if (Array.isArray(rawData)) {
        les_list1 = rawData;
    } else if (typeof rawData === 'object') {
        les_list1 = Object.values(rawData);
    }

    return les_list1
      .filter(x => x !== null && x !== undefined)
      .map(x => ({ 
          lesson_id: String(x.lesson_id ?? x.rec_id), 
          label: x.title || x.name || `Lesson ${x.lesson_id ?? x.rec_id}` 
      }));
  }

  function createMenuDom(){
    let root = document.querySelector('.oap-menu-less');
    if (!root){
      root = document.createElement('div');
      root.className = 'oap-menu-less';
      document.body.appendChild(root);
    }

    // Button
    let btn = root.querySelector('.oap-menu-less__btn');
    if (!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'oap-menu-less__btn';
      btn.setAttribute('aria-label','Choose lesson');
      btn.innerHTML = `
        <svg class="oap-menu-less__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
        </svg>`;
      btn.addEventListener('click', togglePopup);
      root.appendChild(btn);
    }

    // Popup
    let popup = root.querySelector('.oap-menu-less__popup');
    if (!popup){
      popup = document.createElement('div');
      popup.className = 'oap-menu-less__popup';
      popup.innerHTML = `<ul class="oap-menu-less__list"></ul>`;
      root.appendChild(popup);
      // Close on click outside
      document.addEventListener('click', (e) => {
        if (!popup.classList.contains('open')) return;
        const within = root.contains(e.target);
        if (!within) closePopup();
      });
      // Esc to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
      });
    }
    return root;
  }

  function openPopup(){
    const popup = document.querySelector('.oap-menu-less__popup');
    if (popup) popup.classList.add('open');
  }
  function closePopup(){
    const popup = document.querySelector('.oap-menu-less__popup');
    if (popup) popup.classList.remove('open');
  }
  function togglePopup(){
    const popup = document.querySelector('.oap-menu-less__popup');
    if (!popup){ openPopup(); return; }
    popup.classList.toggle('open');
  }

  function renderMenu(){
    const root = createMenuDom();
    const list = root.querySelector('.oap-menu-less__list');
    if (!list) return;
    list.innerHTML = '';
    const data = buildListData();
    const sel = String(currentSelectedId() ?? '');
    data.forEach(item => {
      const idVal = String(item.lesson_id ?? item.rec_id);
      const labelVal = item.label || item.title || item.name || `Lesson ${idVal}`;
      const li = document.createElement('li');
      li.className = 'oap-menu-less__item';
      li.setAttribute('data-lesson-id', idVal);
      li.setAttribute('data-label', labelVal);
      li.textContent = labelVal;
      if (idVal === sel) li.classList.add('is-active');
      li.addEventListener('click', () => setSelectedId(idVal));
      list.appendChild(li);
    });
    highlightActive();
  }

  function highlightActive(){
    const sel = String(currentSelectedId() ?? '');
    document.querySelectorAll('.oap-menu-less__item').forEach(li => {
      const id = li.getAttribute('data-lesson-id') ?? '';
      li.classList.toggle('is-active', id === sel);
    });
    
    const root = document.querySelector('.oap-menu-less');
    if (root){
      let badge = root.querySelector('.oap-menu-less__badge');
      if (!badge){
        badge = document.createElement('span');
        badge.className = 'oap-menu-less__badge';
        root.appendChild(badge);
      }
      const active = document.querySelector('.oap-menu-less__item.is-active');
      const label = active?.getAttribute('data-label') || '';
      badge.textContent = label;
      badge.title = label;
    }
  }

  // Expose a refresh hook
  window.oapMenuLess = {
    refresh: renderMenu
  };

  // Initial render when DOM ready
  function boot(){
    // Restore persisted selected id if present
    try {
      const saved = localStorage.getItem('oap:selected_lesson_id');
      if (saved != null && window.gv?.sts){
        const savedParsed = /^\d+$/.test(saved) ? Number(saved) : saved;
        window.gv.sts.selected_lesson_id = savedParsed;
      }
    } catch {}
    renderMenu();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-render when data loads
  window.addEventListener('oap:data-loaded', () => {
    renderMenu();
  });
})();
