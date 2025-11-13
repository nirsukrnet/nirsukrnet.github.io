
// Quick jump to CSS in VS Code (Ctrl+Click):
// file:///C:/Python/AuTr/html/assets/css/oap.css

function Outputaudiotext_createStyles_oap() {
  // Ensure the external stylesheet is loaded once
  const href = './assets/css/oap.css';
  if (!document.querySelector('link[data-oap-styles]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-oap-styles', '');
    document.head.appendChild(link);
  }

  // Minimal API for tweaking CSS variables at runtime
  window.oapStyles = window.oapStyles || {
    setVar(name, value) {
      try { document.documentElement.style.setProperty(name, value); } catch {}
    },
    getVar(name) {
      try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch { return ''; }
    }
  };
}
