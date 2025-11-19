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

  function setSelectedId(id){
    if (!window.gv || !window.gv.sts) return;
    window.gv.sts.selected_lesson_id = id;
    try { localStorage.setItem('oap:selected_lesson_id', String(id)); } catch {}
    // Re-render content
    if (typeof window.loadContentData === 'function') {
      try { window.loadContentData(); } catch(e){ console.error('[oap] reload failed', e); }
    }
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
      badge.textContent = active?.getAttribute('data-label') || '';
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
    // Use only unique lesson_id values from audio_phrases, as-is (no parsing/normalizing)
    const les_list1 = Array.isArray(window.gv?.sts?.lessons_audio_phrases) ? window.gv.sts.lessons_audio_phrases : [];
    return les_list1;
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
      popup.innerHTML = `<div class="oap-menu-less__title">Lessons</div><ul class="oap-menu-less__list"></ul>`;
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
            // "rec_id": "2",
            // "title": "SW_Learn_Day_7-10_sr",

      const li = document.createElement('li');
      li.className = 'oap-menu-less__item';
      li.setAttribute('data-lesson-id', String(item.rec_id));
      li.setAttribute('data-label', item.title);
      li.textContent = item.title;
      if (String(item.rec_id) === sel) li.classList.add('is-active');
      li.addEventListener('click', () => setSelectedId(item.rec_id));
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
