(function () {
  const CONFIG_URL = 'config/main_menu.json';

  function renderMainMenu(sections, rootEl) {
    rootEl.replaceChildren();

    for (const section of sections) {
      const titleEl = document.createElement('p');
      titleEl.textContent = section.title || '';
      rootEl.appendChild(titleEl);

      const listEl = document.createElement('ul');
      for (const item of section.items || []) {
        const liEl = document.createElement('li');
        const linkEl = document.createElement('a');
        linkEl.href = item.href;
        linkEl.textContent = item.label;
        liEl.appendChild(linkEl);
        listEl.appendChild(liEl);
      }
      rootEl.appendChild(listEl);
    }
  }

  async function loadMainMenu() {
    const rootEl = document.getElementById('mainMenuRoot');
    if (!rootEl) return;

    try {
      const response = await fetch(CONFIG_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const sections = Array.isArray(data.sections) ? data.sections : [];
      renderMainMenu(sections, rootEl);
    } catch (err) {
      rootEl.replaceChildren();
      const errorEl = document.createElement('p');
      errorEl.textContent = `Failed to load menu config: ${String(err)}`;
      rootEl.appendChild(errorEl);
    }
  }

  document.addEventListener('DOMContentLoaded', loadMainMenu);
})();
