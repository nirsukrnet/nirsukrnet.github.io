function loadContentData() {
    const rows_phrases = gv.sts.audio_phrases;
    if (!rows_phrases || !Array.isArray(rows_phrases)) return;    
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

                function addButtonsMark(seg1, typemark, parentEl) {
                    const btn1 = document.createElement('button');
                    btn1.setAttribute('data-rec-id', seg1.rec_id);
                    btn1.setAttribute('data-lesson-id', seg1.lesson_id);
                    // Determine initial value from data; default to '0' when empty/undefined
                    let initialVal = '0';
                    if (typemark === 'mark1') {
                        btn1.textContent = 'Mark1';
                        initialVal = (seg1.mark1 === '1') ? '1' : '0';
                    } else if (typemark === 'mark2') {
                        btn1.textContent = 'Mark2';
                        initialVal = (seg1.mark2 === '1') ? '1' : '0';
                    } else if (typemark === 'mark3') {
                        btn1.textContent = 'Mark3';
                        initialVal = (seg1.mark3 === '1') ? '1' : '0';
                    } else {
                        btn1.textContent = 'Mark';
                    }
                    btn1.setAttribute('varmark', initialVal);
                    if (initialVal === '1') {
                        btn1.style.backgroundColor = 'lightgreen';
                    }
                    btn1.addEventListener('click', () => {
                        const recId = btn1.getAttribute('data-rec-id');
                        const lessonId = btn1.getAttribute('data-lesson-id');
                        const varMark = btn1.getAttribute('varmark');
                        const nameMarkField = btn1.textContent.toLowerCase();
                        if (varMark === '1') {
                            btn1.setAttribute('varmark', '0');
                            btn1.style.backgroundColor = '';
                        } else {
                            btn1.setAttribute('varmark', '1');
                            btn1.style.backgroundColor = 'lightgreen';
                        }
                        // Update in gv.sts.audio_phrases
                        let segFound = null;
                        let itemindex = -1;
                        for (let i = 0; i < gv.sts.audio_phrases.length; i++) {
                            let item = gv.sts.audio_phrases[i];
                            if (item.rec_id === recId && item.lesson_id === lessonId) {
                                segFound = item;
                                itemindex = i;
                                segFound[nameMarkField] = btn1.getAttribute('varmark');
                                break;
                            }
                        }
                        Update_And_Save_Audio_Phrase_ItemByIndex(segFound, itemindex);
                    });
                    parentEl.appendChild(btn1);
                }

// {
//   "file_name": "swday_0001_SW_Learn_Day_1-5_srt_00-00-03.240_00-00-07.120.wav",
//   "lesson_id": "1",
//   "mark1": "",
//   "mark2": "",
//   "mark3": "",
//   "rec_id": "0",
//   "text_en": "",
//   "text_sv": "Lyssna och se jefter.",
//   "text_uk": ""
// }                
				const text = (seg.text_sv || '').trim();
				const fileAbs = seg.file_name || '';
                const baseAudioRel = 'phrase_audio/';				
				const src = baseAudioRel + encodeURIComponent(fileAbs);

				// Column 1: phrase text
				const textEl = document.createElement('div');
				textEl.className = 'text row';
				textEl.textContent = text || '(no text)';

				// Column 2: controls
				const playEl = document.createElement('div');
				playEl.className = 'row controls';
				const btn = document.createElement('button');
				btn.textContent = 'Play';
				playEl.appendChild(btn);
                // Add Mark buttons
                addButtonsMark(seg, 'mark1', playEl);
                addButtonsMark(seg, 'mark2', playEl);
                addButtonsMark(seg, 'mark3', playEl);
				

				// Column 3: audio element (kept hidden by CSS class)
				const audioCell = document.createElement('div');
				audioCell.className = 'row';
				const audioEl = document.createElement('audio');
				audioEl.controls = true;
				audioEl.preload = 'none';
				audioEl.src = src;
				audioEl.className = 'audio_row';
				audioCell.appendChild(audioEl);

				btn.addEventListener('click', () => {
					try {
						if (currentAudio && currentAudio !== audioEl) {
							currentAudio.pause();
						}
						currentAudio = audioEl;
						audioEl.currentTime = 0;
						audioEl.play();
					} catch (e) {
						console.warn('play failed', e);
					}
				});

				// Return three cells so that 1 segment = 1 grid row
				return { elms: [textEl, playEl, audioCell], textLower: text.toLowerCase() };
			}

}

