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
    console.log('[trans_menu_parts] setSelectedId called with:', id);
    if (!window.gv || !window.gv.sts) {
        console.error('[trans_menu_parts] Global vars (gv.sts) not found');
        return;
    }
    window.gv.sts.selected_lesson_id = id;
    try { localStorage.setItem('oap:selected_lesson_id', String(id)); } catch {}
    
    // Load data for the selected part
    if (typeof window.Load_DB3_Lesson_Phrases === 'function') {
        try {
            console.log('[trans_menu_parts] Calling Load_DB3_Lesson_Phrases (as Part)...');
            await window.Load_DB3_Lesson_Phrases(id);
            console.log('[trans_menu_parts] Load_DB3_Lesson_Phrases completed');
        } catch(e) {
            console.error('[trans_menu_parts] Load_DB3_Lesson_Phrases failed', e);
        }
    } else {
        console.warn('[trans_menu_parts] window.Load_DB3_Lesson_Phrases is not a function');
    }

    // Re-render content
    if (typeof window.ExpImpForTrans_loadDataToHTML === 'function') {
      try { 
          console.log('[trans_menu_parts] Calling ExpImpForTrans_loadDataToHTML...');
          window.ExpImpForTrans_loadDataToHTML(); 
      } catch(e){ console.error('[trans_menu_parts] reload failed', e); }
    } else if (typeof window.loadContentData === 'function') {
      try { 
          console.log('[trans_menu_parts] Calling loadContentData...');
          window.loadContentData(); 
      } catch(e){ console.error('[trans_menu_parts] reload failed', e); }
    }
    // Dispatch event for other listeners (e.g. translation tool)
    console.log('[trans_menu_parts] Dispatching oap:lesson-selected');
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
    // Update badge chip
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
      badge.title = badge.textContent;
    }
  }

  function renderMenu(){
    // Remove existing if any
    const existing = document.querySelector('.oap-menu-less');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.className = 'oap-menu-less';

    // Toggle Button
    const btn = document.createElement('button');
    btn.className = 'oap-menu-less__toggle';
    btn.innerHTML = '&#9776;'; // Hamburger icon
    btn.title = 'Select Part';
    btn.onclick = (e) => {
      e.stopPropagation();
      root.classList.toggle('is-open');
    };
    root.appendChild(btn);

    // Badge (current selection)
    const badge = document.createElement('span');
    badge.className = 'oap-menu-less__badge';
    root.appendChild(badge);

    // Dropdown List
    const list = document.createElement('ul');
    list.className = 'oap-menu-less__list';
    
    // Get parts list from gv.sts.parts_list
    const parts = window.gv?.sts?.parts_list || [];
    
    if (parts.length === 0) {
        const li = document.createElement('li');
        li.className = 'oap-menu-less__item';
        li.textContent = '(No parts found)';
        list.appendChild(li);
    } else {
        parts.forEach(partKey => {
            const li = document.createElement('li');
            li.className = 'oap-menu-less__item';
            li.setAttribute('data-lesson-id', partKey);
            li.setAttribute('data-label', partKey);
            li.textContent = partKey;
            li.onclick = () => setSelectedId(partKey);
            list.appendChild(li);
        });
    }

    root.appendChild(list);
    document.body.appendChild(root);

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) closePopup();
    });

    highlightActive();
  }

  function closePopup(){
    const root = document.querySelector('.oap-menu-less');
    if (root) root.classList.remove('is-open');
  }

  // Expose refresh method
  window.oapMenuParts = {
    refresh: renderMenu
  };

  // Initial render if data ready
  if (window.gv?.sts?.parts_list) {
      renderMenu();
  }

})();
