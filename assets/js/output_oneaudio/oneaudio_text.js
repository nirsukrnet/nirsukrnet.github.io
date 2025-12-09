function loadContentData() {
    const rows_phrases = gv.sts.audio_phrases;
    const selected_lesson_id = gv.sts.selected_lesson_id;
    if (!rows_phrases || !Array.isArray(rows_phrases)) return;

    // Filter phrases strictly by selected lesson id without parsing/normalizing
    let source_phrases = [];
    if (selected_lesson_id === null || selected_lesson_id === undefined || String(selected_lesson_id) === '') {
        source_phrases = rows_phrases.slice();
    } else {
        const sel = String(selected_lesson_id);
        for (const seg of rows_phrases) {
            if (String(seg.lesson_id) === sel) source_phrases.push(seg);
        }
        // Fallback: if filter produced 0 rows (e.g., mismatch between menu id field and phrase lesson_id), show all
        if (source_phrases.length === 0) {
            console.warn('[oap] No phrases matched lesson_id =', sel, ' — falling back to all phrases.');
            source_phrases = rows_phrases.slice();
        }
    }

    Outputaudiotext_createStyles_oap();

    const listEl = document.getElementById('list');
    const filterEl = document.getElementById('filter');
    let rows = [];

    // Define filter function
    function applyFilter() {
        if (!filterEl) return;
        const q = filterEl.value.trim().toLowerCase();
        // first search id if contains only char "P" + digits
        if (/^p\d+$/i.test(q)) {
            const idNum = q.slice(1);
            
            // Ensure all rows are visible (do not filter)
            render(rows);

            // Find the row with the matching ID and scroll to it
            const targetRow = rows.find(r => {
                const idMatch = r.elms[0].querySelector('.control-button')?.textContent;
                return idMatch === `P${idNum}`;
            });

            if (targetRow) {
                // Changed block: 'center' to 'start' to scroll element to the top
                targetRow.elms[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else if (!q) {
            render(rows);
        } else {
            const filtered = rows.filter(r => r.textLower.includes(q));
            render(filtered);
        }
    }

    // Setup Event Listener safely (remove old one if exists to prevent stacking)
    if (filterEl) {
        if (filterEl._onInputHandler) {
            filterEl.removeEventListener('input', filterEl._onInputHandler);
        }
        filterEl._onInputHandler = applyFilter;
        filterEl.addEventListener('input', applyFilter);
    }

    // Build rows
    rows = source_phrases.map(makeRow);

    // Initial Render: Check if filter has text and apply it, otherwise show all
    if (filterEl && filterEl.value.trim()) {
        applyFilter();
    } else {
        render(rows);
    }

    function render(list) {
        if (!listEl) return;
        // Remove old rows
        while (listEl.children.length > 0) {
            listEl.removeChild(listEl.lastChild);
        }
        list.forEach(r => {
            r.elms.forEach(e => listEl.appendChild(e));
        });
    }

    function makeRow(seg, idx) {
        const text_sv = (seg.text_sv || '').trim();
        // Prefer a user-selected translation target if provided; fall back smartly to a non-SV text
        const transPref = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationTo) || 'en';
        const pickText = (lang) => {
            if (!lang) return '';
            const key = `text_${lang}`;
            return (seg[key] || '').trim();
        };
        const eq = (a,b) => (a||'').trim().toLowerCase() === (b||'').trim().toLowerCase();
        let text_trans = pickText(transPref);
        if (!text_trans || eq(text_trans, text_sv)) {
            const fallbacks = ['en','uk','sv'].filter(l => l !== transPref);
            for (const fb of fallbacks) {
                const cand = pickText(fb);
                if (cand && !eq(cand, text_sv)) { text_trans = cand; break; }
            }
        }
        // If still empty or same as source after fallback, blank it to avoid sv->sv duplicate
        if (!text_trans || eq(text_trans, text_sv)) {
            text_trans = '';
        }
        const text_en = text_trans;
        const fileAbs = seg.file_name || '';
        
        // Row 1: phrase text
        const textEl_SV = document.createElement('div');
        textEl_SV.className = 'seg-row text';
        textEl_SV.id = `text-sv-${idx}`;
        textEl_SV.textContent = text_sv || '(no text)';

        // Row 2: phrase text
        const textEl_EN = document.createElement('div');
        textEl_EN.className = 'seg-row text trans';
        textEl_EN.id = `text-en-${idx}`;
        textEl_EN.textContent = text_en || '(no translation)';
        // Row 2: controls
        const playBlockEl = document.createElement('div');
        playBlockEl.className = 'seg-row seg-controls';
        
        // Row 3: audio element (kept hidden by CSS class)
        const audioCell = document.createElement('div');
        audioCell.className = 'seg-row audio';
        // Removed individual audio element creation

        addButtonsPlay_oap(playBlockEl, fileAbs, idx); // Pass fileAbs instead of audioEl
        addButtonsTrans_oap(playBlockEl, idx);
        addButtonsMark_oap(seg, 'mark1', playBlockEl);
        addButtonsMark_oap(seg, 'mark2', playBlockEl);
        addButtonsMark_oap(seg, 'mark3', playBlockEl);

        // Wrap into one segment container so 1 segment = 3 stacked rows
        const segmentEl = document.createElement('div');
        segmentEl.className = 'segment';
        // Make each segment span all grid columns in the parent grid (full-width row)
        segmentEl.style.gridColumn = '1 / -1';
        segmentEl.appendChild(textEl_SV);                
        segmentEl.appendChild(playBlockEl);
        segmentEl.appendChild(textEl_EN);
        segmentEl.appendChild(audioCell);

        // Use both languages for filtering text
        const textFilter = `${text_sv} ${text_en}`.trim().toLowerCase();
        return { elms: [segmentEl], textLower: textFilter };
    }
}

// Ensure callable via window from other components
try { window.loadContentData = loadContentData; } catch {}
