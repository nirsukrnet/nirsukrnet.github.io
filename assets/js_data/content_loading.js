
function loadContentData() {
  const data = window.CONTENT_DATA_JSON;
  if (!data || !Array.isArray(data.content_data)) return;

  const contentData = data.content_data;
  //const defaultLang = data.default_lang || 'uk';
  const defaultLang = GL_Settings.language || 'uk';
  const lang = defaultLang;

  for (const item of contentData) {
    // Choose language-specific content with safe fallbacks
    const primary = item[`content_${lang}`];
    const fallback = item[`content_${defaultLang}`];
    const content = (primary ?? fallback ?? item.content_uk ?? item.content_en ?? item.content_sv ?? item.content ?? '');

    const allElements = document.querySelectorAll(`[d_uuid='${item.d_uuid}']`);
    allElements.forEach(el => {
      // Optional: only update text-owner elements
      // if (el.getAttribute('typeuuid') !== 'text') return;

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = content;
      } else {
        el.textContent = content; // keep safe, no HTML injection
      }
      // Optional: reflect language on element
      // el.setAttribute('lang', lang);
    });
  }
}

