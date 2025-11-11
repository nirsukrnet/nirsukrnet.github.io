(function () {
  // d_uuid hover highlighter + click handler
  const g = window;
  

  function ensureStyles() {
    if (document.getElementById('uuid-highlight-style')) return;
    const style = document.createElement('style');
    style.id = 'uuid-highlight-style';
    style.type = 'text/css';
    style.textContent = `
      /* Manual one-off highlight class (kept for dev convenience) */
      .uuid-highlight {
        outline: 2px dashed #4da3ff;
        outline-offset: 2px;
        background-color: rgba(77, 163, 255, 0.08);
      }

      /* Preferred: hover-only highlight when debug is on */
      .uuid-hover [d_uuid]:hover {
        outline: 2px dashed #4da3ff;
        outline-offset: 2px;
        background-color: rgba(77, 163, 255, 0.08);
        cursor: default;
      }

      /* Tip panel (positioned near the clicked element at runtime) */
      #layer-z {
        position: fixed;
        left: 0; /* will be updated by JS */
        top: 0;  /* will be updated by JS */
        padding: 12px 14px;
        background: rgba(0,0,0,0.88);
        color: #fff;
        z-index: 2147483647;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        max-width: 480px;
        max-height: 70vh;
        overflow: auto;
        font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      #layer-z .lz-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      #layer-z .lz-close {
        background: transparent;
        border: 0;
        color: #fff;
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
      }
      #layer-z code {
        white-space: pre-wrap;
        word-break: break-word;
      }
    `;
    document.head.appendChild(style);
  }

  function queryAllUuidElements() {
    return Array.prototype.slice.call(document.querySelectorAll('[d_uuid]'));
  }

  // Legacy/manual API: apply highlight class to all elements
  function applyHighlight() {
    ensureStyles();
    const nodes = queryAllUuidElements();
    for (const el of nodes) {
      el.classList.add('uuid-highlight');
    }
  }

  function removeHighlight() {
    const nodes = queryAllUuidElements();
    for (const el of nodes) {
      el.classList.remove('uuid-highlight');
    }
  }

  function refreshHighlight() {
    removeHighlight();
    applyHighlight();
  }

  // Public API
  g.UuidHighlight = g.UuidHighlight || {
    enable() {
      ensureStyles();
      g.UuidHighlight.isEnabled = true;

      // Hover-only mode via CSS flag on <html>
      document.documentElement.classList.add('uuid-hover');

      // Mousemove fallback to enforce highlight even if :hover is overridden
      if (!g.UuidHighlight._onMove) {
        g.UuidHighlight._onMove = (e) => {
          if (!g.UuidHighlight.isEnabled) return;
          try {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const target = el && (el.closest ? el.closest('[d_uuid]') : null);
            if (target === g.UuidHighlight._currentEl) return;
            if (g.UuidHighlight._currentEl) {
              g.UuidHighlight._currentEl.classList.remove('uuid-highlight');
            }
            g.UuidHighlight._currentEl = target || null;
            if (g.UuidHighlight._currentEl) {
              g.UuidHighlight._currentEl.classList.add('uuid-highlight');
            }
          } catch (_) { /* ignore */ }
        };
      }
      window.addEventListener('mousemove', g.UuidHighlight._onMove, { passive: true });

      // Delegated click handler for all [d_uuid]
      if (!g.UuidHighlight._onClick) {
        g.UuidHighlight._onClick = (e) => {
          if (!g.UuidHighlight.isEnabled) return;
          const t = e.target && (e.target.closest ? e.target.closest('[d_uuid]') : null);
          if (!t) return;

          // Prevent normal navigation/actions unless user holds a modifier to bypass
          if (!(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          }

          const uuid = t.getAttribute('d_uuid');
          try {
            if (typeof g.UuidHighlight.handleClick === 'function') {
              g.UuidHighlight.handleClick(t, uuid, e);
            } else {
              onClickHandler(t, uuid, e);
            }
          } catch (err) {
            console.warn('UuidHighlight.handleClick error:', err);
          }
        };
      }
      document.addEventListener('click', g.UuidHighlight._onClick, true);
    },

    disable() {
      g.UuidHighlight.isEnabled = false;
      document.documentElement.classList.remove('uuid-hover');

      // Clear hover/fallback visuals
      removeHighlight();
      if (g.UuidHighlight._onMove) {
        window.removeEventListener('mousemove', g.UuidHighlight._onMove);
      }
      if (g.UuidHighlight._currentEl) {
        g.UuidHighlight._currentEl.classList.remove('uuid-highlight');
        g.UuidHighlight._currentEl = null;
      }

      // Remove click handler
      if (g.UuidHighlight._onClick) {
        document.removeEventListener('click', g.UuidHighlight._onClick, true);
      }
    },

    // Optional: manually paint all, useful for screenshots
    paintAll: applyHighlight,
    clearAll: removeHighlight,
    refresh: refreshHighlight,

    // Allow consumers to override click behavior
    setClickHandler(fn) {
      g.UuidHighlight.handleClick = typeof fn === 'function' ? fn : null;
    },

    // Default click handler (can be overridden)
    handleClick: onClickHandler,

    // State
    isEnabled: false,
    _observer: null,
    _onMove: null,
    _onClick: null,
    _currentEl: null,
  };

  function onClickHandler(element, uuid, event) {
    ShowLayerZ(uuid, element);
  }

  // Close and global listeners for the LayerZ panel
  function closeLayerZ() {
    const p = document.getElementById('layer-z');
    if (!p) return;
    try {
      if (p.__reposition) {
        window.removeEventListener('resize', p.__reposition);
        window.removeEventListener('scroll', p.__reposition, true);
      }
    } catch(_) { /* ignore */ }
    p.remove();
  }

  function onLayerZKeydown(e) {
    if (e.key === 'Escape') closeLayerZ();
  }

  function onLayerZCloseClick(e) {
    const btn = e.target && (e.target.closest ? e.target.closest('#layer-z .lz-close') : null);
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    closeLayerZ();
  }

  function installLayerZGlobalListeners() {
    if (g.__layerZListenersInstalled) return;
    document.addEventListener('keydown', onLayerZKeydown);
    document.addEventListener('click', onLayerZCloseClick, true);
    g.__layerZListenersInstalled = true;
  }

  function positionPanel(panel, element) {
    const margin = 10; // spacing from element and viewport edges
    // Ensure the panel is measurable
    panel.style.visibility = 'hidden';
    panel.style.display = 'block';

    const rect = element.getBoundingClientRect();
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;

    // Default: below the element, left-aligned
    let left = rect.left;
    let top = rect.bottom + margin;

    // If overflowing to the right, shift left within viewport
    if (left + pw > vw - margin) {
      left = Math.max(margin, vw - margin - pw);
    }
    // If overflowing bottom, try placing above
    if (top + ph > vh - margin) {
      const above = rect.top - margin - ph;
      top = above >= margin ? above : Math.max(margin, vh - margin - ph);
    }
    // Clamp to viewport
    left = Math.max(margin, left);
    top = Math.max(margin, top);

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.visibility = 'visible';
  }


  function ShowLayerZ(uuid, element) {
    //CreateInfoLayerZ(uuid, element);
    CreateForEditLayerZ(uuid, element);
  }


  function CreateInfoLayerZ(uuid, element) {
    ensureStyles();

    let panel = document.getElementById('layer-z');
    if (!panel) {      
      panel = document.createElement('div');
      panel.id = 'layer-z';
      // Close interactions are now global (keydown Escape and .lz-close click)
    }

    // If the panel already had a reposition handler (from a previous open), remove it to avoid duplicates
    if (panel.__reposition) {
      try {
        window.removeEventListener('resize', panel.__reposition);
        window.removeEventListener('scroll', panel.__reposition, true);
      } catch(_) { /* ignore */ }
      panel.__reposition = null;
    }
    panel.innerHTML = `
        <div class="lz-head">
          <span>Element info</span>
          <button class="lz-close" aria-label="Close">✕</button>
        </div>
        <div class="lz-body"></div>
      `;
    if (!panel.isConnected) {
      document.body.appendChild(panel);
    }


    const body = panel.querySelector('.lz-body');
    const escaped = (element.outerHTML || '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    body.innerHTML = `
      <div style="margin-bottom:6px;">UUID: <b>${uuid}</b></div>
      <div>Tag: <code>${element.tagName.toLowerCase()}</code></div>
      <div style="margin-top:6px;"><code>${escaped}</code></div>
    `;
    panel.style.display = 'block';
    // Position panel relative to the element and keep it within viewport
    positionPanel(panel, element);
    // Reposition on resize/scroll
    const rep = () => positionPanel(panel, element);    
    window.addEventListener('resize', rep);
    window.addEventListener('scroll', rep, true);
    panel.__reposition = rep;        
  }

// Alternative version for edit mode (if needed in future)
// add textarea for editing and buttons to save/cancel
function CreateForEditLayerZ(uuid, element) {
    ensureStyles();

    // fixed size for width and height
    let panel = document.getElementById('layer-z');
    if (!panel) {      
      panel = document.createElement('div');
      panel.id = 'layer-z';
    // Close interactions are now global (keydown Escape and .lz-close click)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        panel.style.display = 'none';
      }
    });
    panel.addEventListener('click', (e) => {
      if (e.target.classList.contains('lz-close')) {
        panel.style.display = 'none';
      }
    });
    }
    // for panel fixed size for width and height
    panel.style.width = '500px';
    panel.style.height = '250px';


    // If the panel already had a reposition handler (from a previous open), remove it to avoid duplicates
    if (panel.__reposition) {
      try {
        window.removeEventListener('resize', panel.__reposition);
        window.removeEventListener('scroll', panel.__reposition, true);
      } catch(_) { /* ignore */ }
      panel.__reposition = null;
    }    
    panel.innerHTML = `
        <div class="lz-head">
          <span>Edit Element</span>
          <button class="lz-close" aria-label="Close">✕</button>
        </div>
        <div class="lz-body"></div>
      `;
    if (!panel.isConnected) {
      document.body.appendChild(panel);
    }
    const body = panel.querySelector('.lz-body');
    const escaped = (element.outerHTML || '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // textarea for editing  
    text_str1 = element.textContent || element.value || '';
    body.innerHTML = `        
        <textarea style="width:100%; height:100px;">${text_str1}</textarea>
    `;
    panel.style.display = 'block';
    
    // add buttons for save and cancel
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => {
      const newText = body.querySelector('textarea').value;
      element.textContent = newText;
      panel.style.display = 'none';
    });
    body.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
      panel.style.display = 'none';
    });
    body.appendChild(cancelButton);

    // Position panel relative to the element and keep it within viewport
    positionPanel(panel, element);
    // Reposition on resize/scroll
    const rep = () => positionPanel(panel, element);
    window.addEventListener('resize', rep);
    window.addEventListener('scroll', rep, true);
    panel.__reposition = rep;
    
  }





  function setupObserver() {
    // For hover mode no action is needed on mutations, but keep this for optional paintAll usage.
    try {
      const mo = new MutationObserver(() => {
        // Developers can call UuidHighlight.refresh() if using paintAll.
      });
      mo.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['d_uuid']
      });
      g.UuidHighlight._observer = mo;
    } catch (_) {
      // MutationObserver not available; safe to ignore.
    }
  }

  function init() {
    ensureStyles();
    // Enable when:
    // - GL_Settings.debugHighlight === true
    // - URL has ?debugHighlight=1 (or any value)
    // - URL has ?uuid=1 (shorthand)
    // - Hash contains #debugHighlight or #uuid
    // Detect debug flag from global settings in a robust way
    // Support both window.GL_Settings and a top-level const/let GL_Settings
    let dbg = false;
    try {
      if (g.GL_Settings && g.GL_Settings.debugHighlight === true) {
        dbg = true;
      } else if (typeof GL_Settings !== 'undefined' && GL_Settings && GL_Settings.debugHighlight === true) {
        dbg = true;
      }
    } catch(_) { /* ignore */ }
    try {
      const params = new URLSearchParams(g.location.search || '');
      const hash = (g.location.hash || '').toLowerCase();
      // Case-insensitive param detection: debugHighlight and uuid
      for (const [k, v] of params.entries()) {
        const kk = (k || '').toLowerCase();
        const vv = (v || '').toString().toLowerCase();
        if (kk === 'debughighlight') {
          dbg = true;
        }
        if (kk === 'uuid' && (vv === '' || vv === '1' || vv === 'true')) {
          dbg = true;
        }
      }
      if (hash.includes('debughighlight') || hash.includes('uuid')) {
        dbg = true;
      }
    } catch(_) { /* ignore */ }

    if (dbg) {
      g.UuidHighlight.enable();
      setupObserver();
    } else {
      // Surface a helpful tip once for developers
      if (!g.__uuidHLWarned) {
        g.__uuidHLWarned = true;
        try {
          console.info('[UuidHighlight] Not enabled. To enable, set GL_Settings.debugHighlight = true before load, or add ?debugHighlight=1 to the URL.');
        } catch(_) { /* ignore */ }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
  // Install global listeners for LayerZ panel once
  installLayerZGlobalListeners();
})();
