
// Simple shared audio playback controller living on window to avoid ReferenceError
// and guarantee only one phrase audio plays at a time.
window._oapAudioController = window._oapAudioController || {
    current: null,
    play(audioEl) {
        if (this.current && this.current !== audioEl) {
            try { this.current.pause(); } catch(e) { /* ignore */ }
        }
        this.current = audioEl;
        try {
            audioEl.currentTime = 0;
            return audioEl.play();
        } catch(e) {
            console.warn('play failed', e);
        }
    }
};

function addButtonsPlay_oap(playEl, audioEl, index1) {
    const btn_play = document.createElement('button');
    btn_play.textContent = 'Play';
    btn_play.className = 'control-button';
    btn_play.id = `btn-play-${index1}`;
    playEl.appendChild(btn_play);
    btn_play.addEventListener('click', () => {
        window._oapAudioController.play(audioEl);
    });
}

// function setClickListener_BtnPlay_oap(btn_play, audioEl) {
//     btn_play.addEventListener('click', () => {
//         window._oapAudioController.play(audioEl);
//     });
// }

function addButtonsTrans_oap(playBlockEl, index1){
    const btn_trans1 = document.createElement('button');
    btn_trans1.id = `btn-trans1-${index1}`;
    btn_trans1.textContent = 'Trans1';
    playBlockEl.appendChild(btn_trans1);
    btn_trans1.addEventListener('click', () => {
        const textEnEl = document.getElementById(`text-en-${index1}`);
        if (textEnEl) {
            if (textEnEl.style.display === 'none') {
                textEnEl.style.display = 'block';
            } else {
                textEnEl.style.display = 'none';
            }
        }
    });
}

function HideOtherTrans_oap(playBlockEl, index1){
    const textEnEl = document.getElementById(`text-en-${index1}`);
    if (textEnEl) {
        textEnEl.style.display = 'none';
    }
}

function addButtonsMark_oap(seg1, typemark, parentEl) {
    const btn1 = document.createElement('button');
    btn1.setAttribute('data-rec-id', seg1.rec_id);
    btn1.setAttribute('data-lesson-id', seg1.lesson_id);
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

        // .control-button{
        //             margin-left: 14px;
        //             margin-right: 14px;
        //             border: 1px solid var(--oap-btn-border);
        //   border-radius: 6px;
        //             background: var(--oap-btn-bg);
        //   cursor: pointer;
        // }


function getButtonsControlsStyles_oap(){
    let style1 = `
    `;
    return style1;
} 

