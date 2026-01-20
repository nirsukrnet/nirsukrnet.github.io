/* Shared rendering logic for HTML catalog pages.
   This file is intentionally written in a simple, global style (no bundler).
   Requirements: marked, Prism must already be loaded on the page.
*/

(function () {
  'use strict';

  function copyToClipboard(container) {
    try {
      var el = container;
      if (!el || !el.querySelector) return;
      var textEl = el.querySelector('.text-to-copy-clp') || el;
      var text = (textEl.innerText || textEl.textContent || '').trim();
      if (!text) return;

      function flashSelected() {
        try {
          el.classList.add('textseld-clp');
          setTimeout(function () { el.classList.remove('textseld-clp'); }, 350);
        } catch (e) {}
      }

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).then(flashSelected).catch(function () {
          // fall through to legacy path
        });
        return;
      }

      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        flashSelected();
      } catch (e) {
        // ignore
      }
      document.body.removeChild(ta);
    } catch (e) {
      // ignore
    }
  }

  function DeleteCursorPointStyle() {
    var styles = document.styleSheets;
    for (var i = 0; i < styles.length; i++) {
      var rules;
      try {
        rules = styles[i].cssRules || styles[i].rules;
      } catch (e) {
        // SecurityError: cannot read cross-origin stylesheet rules
        continue;
      }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        if (rules[j].style && rules[j].style.cursor === 'pointer') {
          rules[j].style.cursor = '';
        }
      }
    }
  }

  function setFontSize() {
    var codeBlocks = document.querySelectorAll('code');
    codeBlocks.forEach(function (block) {
      if (block.classList.contains('language-python')) {
        block.style.fontSize = '0.8em';
      } else {
        block.style.fontSize = '1em';
      }
    });
  }

  function AddToMenuNewItem(index, menuTitle) {
    var menu = document.getElementById('menu');
    if (!menu) return;
    var newItem = document.createElement('a');
    newItem.href = '#section_' + index;
    newItem.innerText = menuTitle;
    menu.appendChild(newItem);
  }

  function ReadFromMainData(main_data_content, delimiter) {
    var arr_sections = [];
    var data1 = String(main_data_content || '').split(delimiter);
    data1.forEach(function (item) {
      if (String(item).trim() !== '') {
        arr_sections.push(String(item).trim());
      }
    });
    return arr_sections;
  }

  function ExtractFromSection_VarSection(data1, name_varsection) {
    var regex = new RegExp('<' + name_varsection + '>(.*?)<\\/' + name_varsection + '>', 's');
    var match = String(data1 || '').match(regex);
    return match ? match[1] : null;
  }

  function ensureVisibleContainerAfterMenu() {
    var DivMenu = document.getElementById('menu');
    if (!DivMenu) return null;

    var existing = document.getElementById('visible_block1');
    if (existing) return existing;

    var newDivParent = document.createElement('div');
    newDivParent.id = 'visible_block1';
    DivMenu.parentNode.insertBefore(newDivParent, DivMenu.nextSibling);
    return newDivParent;
  }

  function renderSections(main_data_content, opts) {
    opts = opts || {};
    var delimiter = opts.delimiter || '<delimeter7823892367>';

    var container = ensureVisibleContainerAfterMenu();
    if (!container) return;

    // clear old content
    container.innerHTML = '';

    var sections = ReadFromMainData(main_data_content, delimiter);
    var inx = 0;

    sections.forEach(function (section) {
      var s_menuTitle = ExtractFromSection_VarSection(section, 'menu_title');
      var s_menuTitleShort = ExtractFromSection_VarSection(section, 'menu_title_short');
      var s_response = ExtractFromSection_VarSection(section, 'response');

      if (!s_response) {
        console.log('No response found', 'last section index', inx);
      }

      var menuTitleShort = String(s_menuTitleShort || '').trim();
      var responseText = String(s_response || '').trim();

      inx++;
      AddToMenuNewItem(inx, menuTitleShort);

      var Html1 = (window.marked && typeof window.marked.parse === 'function')
        ? window.marked.parse(responseText)
        : responseText;

      var newSection = document.createElement('section');
      newSection.id = 'section_' + inx;
      newSection.className = 'section';
      newSection.innerHTML =
        '   <div><a class="href-clp" href="#menu">menu</a> <div class="descr_copy-clp">' +
        menuTitleShort +
        '</div> </div>' +
        '   <div class="container-clp">' +
        '     <div class="text-to-copy-clp">' + Html1 + '</div>' +
        '   </div>';

      container.appendChild(newSection);

      if (window.Prism && typeof window.Prism.highlightAll === 'function') {
        window.Prism.highlightAll();
      }
    });

    setFontSize();
  }

  function MainFunc(opts) {
    opts = opts || {};
    var delimiter = opts.delimiter || '<delimeter7823892367>';

    DeleteCursorPointStyle();

    // Default to global main_data_content (provided by data/<slug>.data.js)
    var data = (typeof window.main_data_content !== 'undefined') ? window.main_data_content : '';
    renderSections(data, { delimiter: delimiter });
  }

  // Expose globals (to keep compatibility with existing pages)
  window.MainFunc = MainFunc;
  window.renderSections = renderSections;
  window.ReadFromMainData = ReadFromMainData;
  window.ExtractFromSection_VarSection = ExtractFromSection_VarSection;
  window.copyToClipboard = copyToClipboard;
})();
