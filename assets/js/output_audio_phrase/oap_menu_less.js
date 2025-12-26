(function(){
  // Ensure CSS is present (loader should add it, but keep a fallback)
  const cssHref = './assets/css/oap_menu_less.css';
  if (!document.querySelector(`link[rel="stylesheet"][href="${cssHref}"]`)){
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = cssHref; document.head.appendChild(l);
  }

  function currentSelectedId(){
    try { return window.gv?.sts?.selected_lesson_id; } catch { return null; }
  }

  async function setSelectedId(id){
    console.log('[oap_menu] setSelectedId called with:', id);
    if (!window.gv || !window.gv.sts) {
        console.error('[oap_menu] Global vars (gv.sts) not found');
        return;
    }
    window.gv.sts.selected_lesson_id = id;
    try { localStorage.setItem('oap:selected_lesson_id', String(id)); } catch {}
    
    // Load data for the selected lesson if needed
    if (typeof window.Load_DB3_Lesson_Phrases === 'function') {
        try {
            console.log('[oap_menu] Calling Load_DB3_Lesson_Phrases...');
            await window.Load_DB3_Lesson_Phrases(id);
            console.log('[oap_menu] Load_DB3_Lesson_Phrases completed');
        } catch(e) {
            console.error('[oap] Load_DB3_Lesson_Phrases failed', e);
        }
    } else {
        console.warn('[oap_menu] window.Load_DB3_Lesson_Phrases is not a function');
    }

    // Re-render content
    if (typeof window.loadContentData === 'function') {
      try { 
          console.log('[oap_menu] Calling loadContentData...');
          window.loadContentData(); 
      } catch(e){ console.error('[oap] reload failed', e); }
    }
    // Dispatch event for other listeners (e.g. translation tool)
    console.log('[oap_menu] Dispatching oap:lesson-selected');
    window.dispatchEvent(new CustomEvent('oap:lesson-selected', { detail: { id } }));
    
    // Update active item highlight
    highlightActive();
    // Close popup after selection
    closePopup();
  }

  function highlightActive(){
    const sel = String(currentSelectedId() ?? '');
    document.querySelectorAll('.oap-menu-less__item').forEach(li => {
      const id = li.getAttribute('data-lesson-id') ?? '';
      li.classList.toggle('is-active', id === sel);
    });
    // Update badge chip (positioned next to the button for better visibility)
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

      // Calculate count of items for the selected lesson
      let countPrefix = '';
      if (sel && window.gv?.sts?.audio_phrases && Array.isArray(window.gv.sts.audio_phrases)){
        const count = window.gv.sts.audio_phrases.filter(p => String(p.lesson_id) === sel).length;
        if (count > 0) {
          countPrefix = `(${count}) `;
        }
      }

      badge.textContent = countPrefix + label;
      badge.title = badge.textContent;
    }
  }

  function normalizeId(v){
    if (v === null || v === undefined) return null;
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string'){
      const t = v.trim();
      if (t === '') return null;
      if (/^\d+$/.test(t)) return Number(t);
      return t.toLowerCase();
    }
    try { return String(v).toLowerCase(); } catch { return null; }
  }

  function getLabelFromLesson(obj){
    // Try common name fields
    const nameKey = ['title','name','label','lesson_name','file_name'].find(k => k in obj) || null;
    if (nameKey) return String(obj[nameKey]);
    // If only id known, make a simple label
    const idKey = ['lesson_id','id','lessonId'].find(k => k in obj) || null;
    if (idKey){ return `Lesson ${obj[idKey]}`; }
    return 'Lesson';
  }

  function buildListData(){
    let rawData = window.gv?.sts?.lessons_audio_phrases;
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
//      popup.innerHTML = `<div class="oap-menu-less__title">Lessons</div><ul class="oap-menu-less__list"></ul>`;
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
