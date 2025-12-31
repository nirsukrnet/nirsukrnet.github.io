
// Single Audio Playback Controller
window._oapAudioController = window._oapAudioController || {
    audio: null,
    timeUpdateHandler: null,
    
    async init(src) {
        const _cdbgCtx = (window.cdebug && typeof window.cdebug.ctx === 'function')
            ? window.cdebug.ctx('oneaudio_controlbuttons.js', '_oapAudioController.init')
            : null;

        // Stop existing playback if any
        if (this.audio) {
            this.audio.pause();
            if (this.timeUpdateHandler) {
                this.audio.removeEventListener('timeupdate', this.timeUpdateHandler);
                this.timeUpdateHandler = null;
            }
            // Revoke old blob URL to free memory
            if (this.audio.src && this.audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.audio.src);
            }
            this.audio.removeAttribute('src');
            this.audio.load();
        } else {
            this.audio = new Audio();
            this.audio.preload = 'auto';
            this.audio.onerror = (e) => {
                console.error("[OneAudio] Audio element error:", this.audio.error);
            };
        }
        
        try {
            console.log(`[OneAudio] Fetching audio file into memory: ${src}`);
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            // Force MIME type to ensure browser recognizes it as MP3
            const audioBlob = new Blob([blob], { type: 'audio/mpeg' });
            const blobUrl = URL.createObjectURL(audioBlob);
            this.audio.src = blobUrl;
            if (_cdbgCtx) {
                _cdbgCtx.log('audioLoaded', { src });
            }
        } catch (e) {
            console.error("[OneAudio] Failed to load audio file:", e);
            alert("Failed to load audio file. Check console.");
        }
    },

    playSegment(startTime, endTime) {
        if (!this.audio) return;

        // Remove previous listener if any
        if (this.timeUpdateHandler) {
            this.audio.removeEventListener('timeupdate', this.timeUpdateHandler);
            this.timeUpdateHandler = null;
        }

        const startPlayback = async () => {
            try {
                // Robust seeking logic (Blob Method)
                this.audio.currentTime = startTime;
                
                // Wait for seek to complete (polling)
                const checkSeek = setInterval(() => {
                    if (this.audio.currentTime >= startTime - 0.5) {
                        clearInterval(checkSeek);
                        
                        this.audio.play().catch(e => console.error("Play failed:", e));

                        this.timeUpdateHandler = () => {
                            if (this.audio.currentTime >= endTime) {
                                this.audio.pause();
                                this.audio.removeEventListener('timeupdate', this.timeUpdateHandler);
                                this.timeUpdateHandler = null;
                            }
                        };
                        this.audio.addEventListener('timeupdate', this.timeUpdateHandler);
                    }
                }, 50); // Check every 50ms

                // Safety timeout to prevent infinite loop if seek fails
                setTimeout(() => clearInterval(checkSeek), 2000);

            } catch (e) {
                console.error("Playback failed:", e);
            }
        };

        if (this.audio.readyState >= 1) { // HAVE_METADATA
            startPlayback();
        } else {
            this.audio.addEventListener('loadedmetadata', () => {
                startPlayback();
            }, { once: true });
        }
    }
};

// Initialize with the single MP3 file
// window._oapAudioController.init('phrase_audio/SW_Learn_Day_1-5.mp3');


function addButtonsPlay_oap(playEl, segmentData, index1) {
    const btn_play = document.createElement('button');
    btn_play.textContent = `P${index1}`;
    btn_play.className = 'control-button';
    btn_play.id = `btn-play-${index1}`;
    playEl.appendChild(btn_play);
    
    btn_play.addEventListener('click', () => {
        // Use start/end from segment data directly
        let startTime = parseFloat(segmentData.start);
        let endTime = parseFloat(segmentData.end);
        
        console.log(`Button P${index1} clicked. Start: ${startTime}, End: ${endTime}`);

        if (!isNaN(startTime) && !isNaN(endTime)) {
             window._oapAudioController.playSegment(startTime, endTime);
        } else {
             console.warn('Invalid timestamps for segment:', segmentData);
        }
    });
}

function parseTime(timeStr) {
    // timeStr format: HH:MM:SS.mmm
    const parts = timeStr.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    
    return (hours * 3600) + (minutes * 60) + seconds;
}

function addButtonsTrans_oap(playBlockEl, index1){
    const _cdbgCtx = (window.cdebug && typeof window.cdebug.ctx === 'function')
        ? window.cdebug.ctx('oneaudio_controlbuttons.js', 'addButtonsTrans_oap')
        : null;

    const btn_trans1 = document.createElement('button');
    btn_trans1.id = `btn-trans1-${index1}`;
    const transPref = (typeof window.getTranslationTo === 'function') ? window.getTranslationTo() : ((window.gv?.sts?.translationTo) || (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationTo) || 'en');
    const labelMap = { en: 'Trans EN', uk: 'Trans UK', sv: 'Trans SV' };
    btn_trans1.textContent = labelMap[transPref] || 'Trans';
    // Copy text_id onto the button for easier debugging.
    let _textId = '';
    try {
        const tid = playBlockEl && playBlockEl.getAttribute('data-text-id');
        if (tid) {
            _textId = tid;
            btn_trans1.setAttribute('data-text-id', tid);
        }
    } catch {}
    playBlockEl.appendChild(btn_trans1);
    btn_trans1.addEventListener('click', () => {
        try {
            const tid = btn_trans1.getAttribute('data-text-id') || (playBlockEl && playBlockEl.getAttribute('data-text-id'));
            console.log('[Trans] click idx=', index1, 'text_id=', tid || '(missing)');
        } catch {}
        const textEnEl = document.getElementById(`text-en-${index1}`);
        if (textEnEl) {
            textEnEl.classList.toggle('is-visible');
        }
    });
    
    if (_cdbgCtx) {
        _cdbgCtx.log('addedTransButton', { index: index1, translationTo: transPref, text_id: _textId || null });
    };
}

function HideOtherTrans_oap(playBlockEl, index1){
    const textEnEl = document.getElementById(`text-en-${index1}`);
    if (textEnEl) {
        textEnEl.classList.remove('is-visible');
    }
}

function addButtonsMark_oap(seg1, typemark, parentEl) {
    const btn1 = document.createElement('button');
    btn1.setAttribute('data-rec-id', seg1.rec_id);
    btn1.setAttribute('data-lesson-id', seg1.lesson_id);
    // Also include the currently selected group/lesson selector id for clarity
    try { btn1.setAttribute('data-group-id', (window.gv?.sts?.selected_lesson_id ?? '')); } catch {}
    btn1.className = 'control-button';
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

function getButtonsControlsStyles_oap(){
    let style1 = `
    `;
    return style1;
} 
