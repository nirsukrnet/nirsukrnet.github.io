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
    }

    Outputaudiotext_createStyles_oap();

    const listEl = document.getElementById('list');
    const filterEl = document.getElementById('filter');
    let rows = [];
    let currentAudio = null;

	rows = source_phrases.map(makeRow);
	render(rows);

			function render(list) {
				// Remove old rows
				while (listEl.children.length > 0) {
					listEl.removeChild(listEl.lastChild);
				}
				list.forEach(r => {
					r.elms.forEach(e => listEl.appendChild(e));
				});
			}

			function applyFilter() {
				const q = filterEl.value.trim().toLowerCase();
				if (!q) return render(rows);
				const filtered = rows.filter(r => r.textLower.includes(q));
				render(filtered);
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
                const baseAudioRel = 'phrase_audio/';				
				const src = baseAudioRel + encodeURIComponent(fileAbs);

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
				const audioEl = document.createElement('audio');
				audioEl.controls = true;
				audioEl.preload = 'none';
				audioEl.src = src;
                audioEl.className = 'audio_row';
                // Ensure audio row is visible in the new 3-rows layout
                audioEl.style.display = 'block';
				audioCell.appendChild(audioEl);

                addButtonsPlay_oap(playBlockEl, audioEl, idx);
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


