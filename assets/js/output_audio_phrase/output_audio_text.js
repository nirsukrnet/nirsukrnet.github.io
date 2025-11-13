function loadContentData() {
    const rows_phrases = gv.sts.audio_phrases;
    if (!rows_phrases || !Array.isArray(rows_phrases)) return;    
    Outputaudiotext_createStyles_oap();

    const listEl = document.getElementById('list');
    const filterEl = document.getElementById('filter');
    let rows = [];
    let currentAudio = null;

	rows = rows_phrases.map(makeRow);
	render(rows);

			function render(list) {
				// Remove old rows
				while (listEl.children.length > 3) {
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
				const text_en = (seg.text_en || '').trim();
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
                // add display: none;
                textEl_EN.style.display = 'none';
                textEl_EN.id = `text-en-${idx}`;
                textEl_EN.textContent = text_en || '(no text)';
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


