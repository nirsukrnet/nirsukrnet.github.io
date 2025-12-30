window.ExpImpForTrans_loadDataToHTML = async function() {
   const selected_lesson_id = window.gv && window.gv.sts ? window.gv.sts.selected_lesson_id : null;
   if (selected_lesson_id) {
       const data = await window.CollectLessonData(selected_lesson_id);
       ExpImpForTrans_Sentence_loadDataToHTML(data);
   } else {
       console.warn("No lesson selected");
       ExpImpForTrans_Sentence_loadDataToHTML([]);
   }
}

function Click_SetModeCollectedWords(athis) {
  const mode1 = athis.className.includes('button_control_transl_on') ? true : false;
  if (!mode1) {
    athis.className = 'button_control_transl button_control_transl_on';
  }
  else {
    athis.className = 'button_control_transl';
  }
  ExpImpForTrans_Sentence_loadDataToHTML(); 
}


function testOnUkrainianLanguage(sentence1) {
    // Check if the sentence contains any Ukrainian characters, if minimum one character then true
    const ukrainianPattern = /[А-Яа-яЁёІіЇїЄєҐґ]/;
    return ukrainianPattern.test(sentence1);
}

function testOnEnglishLanguage(sentence1) {
    // Check if the sentence contains any English characters, if minimum one character then true
    const englishPattern = /[A-Za-z]/;
    return englishPattern.test(sentence1);
}

function testOnSwedishLanguage(sentence1) {
    // Check if the sentence contains any Swedish characters, if minimum one character then true
    // add also english characters using for writing swedish words
    const swedishPattern = /[ÅåÄäÖöA-Za-z]/; 
    return swedishPattern.test(sentence1);
}


function transformData(inputData) {
    const translationFrom = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationFrom) || 'uk';
    const translationTo = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationTo) || 'en';

    // Use inputData if provided, otherwise fallback to empty array
    const rows = Array.isArray(inputData) ? inputData : [];
    
    console.log(`[trans] transformData called. Rows: ${rows.length}`);

    const output_data = [];
    for (let i = 0; i < rows.length; i++) {
        const seg = rows[i] || {};
        
        // Map fields based on instruction
        // text_sv -> source_text
        // text_en -> target_text
        // _partid + _txtid -> id (d_uuid)
        
        const sentence_from = seg.text_sv || '';
        const sentence_to = seg.text_en || '';
        
        const needs_translation = translationFrom === translationTo
            ? true
            : !(String(sentence_to || '').trim().length > 0);

        output_data.push({
            idsentence: i + 1,
            d_uuid: `${seg._partid}_${seg._txtid}`,
            sentence_from: String(sentence_from || ''),
            sentence_to: String(sentence_to || ''),
            needs_translation,
            _srcIndex: i
        });
    }
    return output_data;
}

function displayBigSmall_sentencesFromBlock(id_block, valSize) {
    let sentencesFromBlock = document.getElementById(`sentences-fromblock-${id_block}`);
    if (!sentencesFromBlock) {
        console.error(`Element with id sentences-fromblock-${id_block} not found.`);
        return;
    }
    const minSize1 = '30px';
    if (valSize < 1){
        // Collapse to 30px with scroll
        sentencesFromBlock.style.minHeight = minSize1;
        sentencesFromBlock.style.maxHeight = '30px';
        sentencesFromBlock.style.overflowY = 'auto';
    } else {
        // Expand fully (keep min-height)
        sentencesFromBlock.style.minHeight = minSize1;
        sentencesFromBlock.style.removeProperty('max-height');
        sentencesFromBlock.style.overflowY = 'visible';
    }
}



function onclick_sentencesFromBlock(id_block) {
    let sentencesFromBlock = document.getElementById(`sentences-fromblock-${id_block}`);
    if (!sentencesFromBlock) {
        console.error(`Element with id sentences-fromblock-${id_block} not found.`);
        return;
    }
    const minSize1 = '30px';
    // Toggle collapse/expand based on current maxHeight
    const isCollapsed = sentencesFromBlock.style.maxHeight === '30px';
    if (!isCollapsed) {
        // Collapse
        sentencesFromBlock.style.minHeight = minSize1;
        sentencesFromBlock.style.maxHeight = '30px';
        sentencesFromBlock.style.overflowY = 'auto';
    } else {
        // Expand
        sentencesFromBlock.style.minHeight = minSize1;
        sentencesFromBlock.style.removeProperty('max-height');
        sentencesFromBlock.style.overflowY = 'visible';
    }    
}


function onclick_sentencesToBlock(id_block) {
    let sentencesToBlock = document.getElementById(`sentences-to-block-${id_block}`);
    if (!sentencesToBlock) {
        console.error(`Element with id sentences-to-block-${id_block} not found.`);
        return;
    }
    const minSize1 = '30px';
    // Toggle collapse/expand based on current maxHeight
    const isCollapsed = sentencesToBlock.style.maxHeight === '30px';
    if (!isCollapsed) {
        // Collapse
        sentencesToBlock.style.minHeight = minSize1;
        sentencesToBlock.style.maxHeight = '30px';
        sentencesToBlock.style.overflowY = 'auto';
    } else {
        // Expand
        sentencesToBlock.style.minHeight = minSize1;
        sentencesToBlock.style.removeProperty('max-height');
        sentencesToBlock.style.overflowY = 'visible';
    }
}



function hideAllBlocksInFrame(id_block){
    function hideitemBlock(vdiv1){
        if(vdiv1){
            const minSize1 = '30px';
            vdiv1.style.minHeight = minSize1;
            vdiv1.style.maxHeight = '30px';
            vdiv1.style.overflowY = 'auto';
        }
    }
    let div1 = document.getElementById(`sentences-to-block-${id_block}`);
    if(div1){
        hideitemBlock(div1);
    }
}


function ExpImpForTrans_Sentence_loadDataToHTML(inputData) {

    // Store raw data if provided, or use existing
    if (inputData) {
        window.raw_trans_data = inputData;
    }
    
    // Use stored data if inputData is not provided (e.g. re-render)
    const dataToTransform = inputData || window.raw_trans_data || [];

    window.for_trans_data = transformData(dataToTransform);   

    const countSentences = 25;

    let tr_sentences = [];

    for (let i = 0; i < window.for_trans_data.length; i++) {
        let sentence = window.for_trans_data[i];
        if (sentence.needs_translation) {
            tr_sentences.push({
                idsentence: sentence.idsentence,
                sentence_from: sentence.sentence_from,
                sentence_to: sentence.sentence_to
            });
        }
    }

    // Create the HTML structure

    const  infoDiv = document.getElementById('info_div');
    infoDiv.innerHTML = ''; // Clear previous content
    let article_name = "Translation Data";
    infoDiv.innerHTML = `
        <h3>${article_name}</h3>
    `;

    if (tr_sentences.length === 0) {
        infoDiv.innerHTML += `<p>No sentences without translation found.</p>`;
        return;
    }

    // Extract every countSentences portion in one div block with copy button to clipboard

    for (let i = 0; i < tr_sentences.length; i += countSentences) {
        //let containerUI_Block = document.createElement('div');
        //containerUI_Block.className = 'containerUI_Block';
        //infoDiv.appendChild(containerUI_Block);

        let id_block = Math.floor(i / countSentences);

        let divFrame_item = document.createElement('div');
        divFrame_item.className = 'frame_item';
        divFrame_item.id = `frame_item-${id_block}`;
        //containerUI_Block.appendChild(divFrame_item);
        infoDiv.appendChild(divFrame_item);

        let sentencesFromBlock = document.createElement('div');
        sentencesFromBlock.className = 'sentences-fromblock';        
        sentencesFromBlock.id = `sentences-fromblock-${id_block}`;
        sentencesFromBlock.onclick = function(){
            onclick_sentencesFromBlock(id_block);
        }



        for (let j = i; j < i + countSentences && j < tr_sentences.length; j++) {
            let sentence = tr_sentences[j];
            let begin_delimeter_sentences = '352725_' + sentence.idsentence;
            let end_delimeter_sentences = '973524_';
            sentencesFromBlock.innerHTML += `
                <div class="sentence-item" id="sentence-${sentence.idsentence}">                    
                    <span class="sentence-en">${begin_delimeter_sentences} ${sentence.sentence_from} ${end_delimeter_sentences}</span>
                </div>
            `;
        }

        // Add copy button
        let copyButton = document.createElement('button');
        copyButton.textContent = 'Copy to Clipboard ';
        copyButton.className = 'button_controlsentences_copy';
        copyButton.setAttribute('valueid', `sentences-fromblock-${id_block}`);        
        copyButton.onclick = function() {
            const allcopyButtons = document.querySelectorAll('.button_controlsentences_copy');
            // Reset all buttons text to "Copy to Clipboard"
            allcopyButtons.forEach(btn => {
                btn.textContent = 'Copy to Clipboard';
            });
            let valueid = this.getAttribute('valueid');
            let sentencesBlock1 = document.getElementById(valueid);
            if (!sentencesBlock1) {
                console.error(`Element with id ${valueid} not found.`);
                return;
            }
            let TextToCopy1 = sentencesBlock1.innerText;
            // change button text to "Copied!" for 2 seconds
            this.textContent = 'Copied';
            TextArea_copyToClipboard(TextToCopy1);          
        };        

        let parseButton = document.createElement('button');
        parseButton.textContent = 'Parse input';
        parseButton.setAttribute('to_valueid', `sentences-to-block-${id_block}`);
        parseButton.className = 'button_controlsentences';
        parseButton.onclick = function() {
            let textareaB1 = document.getElementById(`textareaB1-${id_block}`);
            textareaB1.style.display = 'block'; // Show the textarea
            let sentencesToBlock = document.getElementById(this.getAttribute('to_valueid'));
            if (!sentencesToBlock) {
                console.error(`Element with id ${this.getAttribute('to_valueid')} not found.`);
                return;
            }
            if (!textareaB1) {
                console.error(`Textarea with id textareaB1-${id_block} not found.`);
                return;
            }
            textareaB1.focus();             
            textareaB1.select(); 

            sentencesToBlock.innerHTML = ''; // Clear previous phrases

            let text_1 = textareaB1.value;
            let sentences = text_1.split('973524_');
            sentences.forEach(sentence => {
                let trimmedSentence = sentence.trim();
                trimmedSentence = trimmedSentence.replace('\n', '');
                if (trimmedSentence) { // Check if sentence is not empty
                    // extract the id from the sentence
                    let idsentenceMatch = trimmedSentence.match(/352725_(\d+)/); // Match the id at the beginning
                    const item_sentencesToBlock = document.createElement('div');
                    item_sentencesToBlock.className = 'item-sentences-to-block';

                    if (idsentenceMatch) {
                        let idSentence = idsentenceMatch[1]; // Get the matched id
                        trimmedSentence = trimmedSentence.replace(/352725_\d+ /, ''); // Remove the id from the sentence

                        let sentenceDiv = document.createElement('div');
                        sentenceDiv.className = 'sentence-paste-to-item';
                        sentenceDiv.id = `sentence-paste-${idSentence}`;
                        sentenceDiv.setAttribute('idsentence', idSentence);
                        sentenceDiv.textContent = trimmedSentence;            
                        item_sentencesToBlock.appendChild(sentenceDiv);

                        let sentence_ToDiv = document.createElement('div');
                        sentence_ToDiv.className = 'sentence-paste-to-item_dest';
                        sentence_ToDiv.id = `sentence-paste-${idSentence}`;
                        sentence_ToDiv.setAttribute('idsentence', idSentence);        
                        const inx1 = tr_sentences.findIndex(p => p.idsentence == idSentence);
                        const sentence_from = tr_sentences[inx1].sentence_from;
                        sentence_ToDiv.textContent = sentence_from;
                        item_sentencesToBlock.appendChild(sentence_ToDiv);

                        sentencesToBlock.appendChild(item_sentencesToBlock);
                    }

                }
            });

            // Show the save button
            let saveToBaseButton = document.getElementById(`button-save-to-db-${id_block}`);
            if (saveToBaseButton) {
                if (sentencesToBlock.childElementCount > 0) {
                   saveToBaseButton.style.display = 'block'; // Show the button
                   displayBigSmall_sentencesFromBlock(id_block, 0);
                }
                else {
                    saveToBaseButton.style.display = 'none'; // Hide the button if no phrases
                    displayBigSmall_sentencesFromBlock(id_block, 1); 
                }
            } else {
                console.error(`Save button with id button-save-to-db-${id_block} not found.`);
            }
        };

        let sentencesToBlock1 = document.createElement('div');
        sentencesToBlock1.id = `sentences-to-block-${id_block}`;
        sentencesToBlock1.className = 'sentences-to-block';
        sentencesToBlock1.onclick = function(){
          onclick_sentencesToBlock(id_block);
        };

        saveToBaseButton = document.createElement('button');
    saveToBaseButton.textContent = 'Save Next';
        saveToBaseButton.className = 'button_controlsentences';
        saveToBaseButton.id = `button-save-to-db-${id_block}`;
        saveToBaseButton.style.display = 'none'; // Initially hidden
        saveToBaseButton.onclick = function() {
            let id_block = this.id.replace('button-save-to-db-', '');
            if (!id_block) {
                console.error('ID block not found.');
                return;
            }
            // Call the function to save sentences to the database
            console.log(`Saving sentences for block ID: ${id_block}`);
            // Save current block to Firebase
            Save_1Block_ToBase_Sent_TransTo(id_block);
            hideAllBlocksInFrame(id_block);
            // Scroll to the next block if exists
            let nextBlock = document.getElementById(`frame_item-${parseInt(id_block) + 1}`);
            if (nextBlock) {
                nextBlock.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('This is the last block.');
            }
        };

        // Clear translations for this block (sets target text_* to empty string for each sentence in the block)
        const clearToBaseButton = document.createElement('button');
        clearToBaseButton.textContent = 'Clear Trans';
        clearToBaseButton.className = 'button_controlsentences button_clear_trans';
        clearToBaseButton.id = `button-clear-to-db-${id_block}`;
        clearToBaseButton.onclick = function(){
            const ids = getIdsFromSentencesFromBlock(id_block);
            if (!ids.length){
                alert('No sentence ids found in this block to clear.');
                return;
            }
            const dataToSave = ids.map(id => ({ idsentence: id, sentence_to: '' }));
            SaveTransReadyDataToFireBase(dataToSave);
            hideAllBlocksInFrame(id_block);
        };

                // textareaB1 Create a textarea for the block
        let textareaB1 = document.createElement('textarea');
        textareaB1.className = 'textareaB1';        
        textareaB1.id = `textareaB1-${id_block}`;
        textareaB1.style.display = 'none';
        textareaB1.rows = 3;
        textareaB1.cols = 50;
        // Add the textarea to the block
        textareaB1.innerHTML = ''; // Clear any previous content

        
         const tittle1 = document.createElement('div');
         tittle1.className = 'headliner_tittle';
         tittle1.id = `headliner_tittle-${id_block}`;
         tittle1.textContent = `Block ${id_block + 1}`;        
         divFrame_item.appendChild(tittle1);


        const div_block_portion_ui_ctrl = document.createElement('div');
        div_block_portion_ui_ctrl.className = 'block_portion_ui_ctrl';
        div_block_portion_ui_ctrl.appendChild(tittle1);
        div_block_portion_ui_ctrl.appendChild(copyButton);
        div_block_portion_ui_ctrl.appendChild(parseButton);
        div_block_portion_ui_ctrl.appendChild(textareaB1);
        
        
        
        divFrame_item.appendChild(sentencesFromBlock);
        divFrame_item.appendChild(div_block_portion_ui_ctrl);
        divFrame_item.appendChild(sentencesToBlock1);
        divFrame_item.appendChild(saveToBaseButton);
    divFrame_item.appendChild(clearToBaseButton);
    }
    downloadButton = document.createElement("button");
        // Removed Download JSON action; saving happens per block via the button above.

}

// Extract all ids present in the source sentences block for a given block
function getIdsFromSentencesFromBlock(id_block){
    const el = document.getElementById(`sentences-fromblock-${id_block}`);
    if (!el) return [];
    const txt = el.textContent || '';
    const ids = [];
    const rx = /352725_(\d+)/g;
    let m;
    while ((m = rx.exec(txt))){
        ids.push(m[1]);
    }
    return ids;
}

function Save_1Block_ToBase_Sent_TransTo(id_block) {
    // Get all sentences in the block
    let sentencesToBlock = document.getElementById(`sentences-to-block-${id_block}`);
    if (!sentencesToBlock) {
        console.error(`Element with id sentences-to-block-${id_block} not found.`);
        return;
    }

    let sentences = sentencesToBlock.querySelectorAll('.sentence-paste-to-item');
    if (sentences.length === 0) {
        alert('No sentences to save.');
        return;
    }

    // Prepare data to save
    let dataToSave = [];
    sentences.forEach(sentence => {
        let idsentence = sentence.getAttribute('idsentence');
        let sentenceText = sentence.innerText.trim();
        if (idsentence && sentenceText) {
            dataToSave.push({
                idsentence: idsentence,
                sentence_to: sentenceText
            });
        }
    });

    // Save to Firebase or any other database
    if (dataToSave.length > 0) {
        // Save to DB3 text_trans_phrases
        if (typeof window.SaveTransReadyDataToFireBaseTo_text_trans_phrases === 'function') {
            window.SaveTransReadyDataToFireBaseTo_text_trans_phrases(dataToSave);
        } else {
            console.warn('[trans] SaveTransReadyDataToFireBaseTo_text_trans_phrases is not available, falling back to audio saver');
            SaveTransReadyDataToFireBase(dataToSave);
        }
        console.log('Sentences saved successfully!');
    } else {
        alert('No valid sentences to save.');
    }


}


function SaveAllFramesToDatabase(dataToSave) {
    const  infoDiv = document.getElementById('info_div');
    let sentencesToBlocks = infoDiv.querySelectorAll('.sentences-to-block');
    sentencesToBlocks.forEach(block => {
        let sentences = block.querySelectorAll('.sentence-paste-to-item');
        if (sentences.length === 0) {
            console.warn('No sentences to save in this block.');
            return;
        }
        
        // Prepare data to save
       let dataToSave = [];
       sentences.forEach(sentence => {
           let idsentence = sentence.getAttribute('idsentence');
           let sentenceText = sentence.innerText.trim();
           if (idsentence && sentenceText) {
               dataToSave.push({
                   idsentence: idsentence,
                   sentence_to: sentenceText
               });
           }
       });

       // Save to Firebase or any other database
       if (dataToSave.length > 0) {
           // Save to DB3 text_trans_phrases
           if (typeof window.SaveTransReadyDataToFireBaseTo_text_trans_phrases === 'function') {
               window.SaveTransReadyDataToFireBaseTo_text_trans_phrases(dataToSave);
           } else {
               console.warn('[trans] SaveTransReadyDataToFireBaseTo_text_trans_phrases is not available, falling back to audio saver');
               SaveTransReadyDataToFireBase(dataToSave);
           }
           console.log('Sentences saved successfully for one block!');
       } else {
           alert('No valid sentences to save.');
       }
   });
    
   
    // Build downloadable JSON from current in-memory data instead of legacy content_data
    // If CONTENT_DATA_JSON.content_data exists and contains matching d_uuid, update it; otherwise, construct anew.
       // Removed JSON download; this helper now only saves all parsed blocks to Firebase when called programmatically.


}



async function SaveTransReadyDataToFireBase(dataToSave) {
    // Save directly to audio_phrases at the original indices
    const translationTo = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationTo) || 'en';

    // Update in-memory for_trans_data
    for (let i = 0; i < dataToSave.length; i++) {
        const { idsentence, sentence_to } = dataToSave[i];
        const existingSentence = window.for_trans_data.find(item => item.idsentence == idsentence);
        if (existingSentence) {
            existingSentence.sentence_to = sentence_to;
            let strdt1 = new Date().toISOString();
            strdt1 = strdt1.replace('T', ' ').substring(0, 19);
            existingSentence.datetimetrans = strdt1;
        }
    }

    // const tableIndex = (typeof window.Get_IndexOf_Table_By_Name === 'function') ? Get_IndexOf_Table_By_Name('audio_phrases') : -1;
    // if (tableIndex < 0) { console.error('audio_phrases table not available'); return; }

    const rows = (window.gv && window.gv.sts && Array.isArray(window.gv.sts.audio_phrases)) ? window.gv.sts.audio_phrases : [];

    for (let i = 0; i < dataToSave.length; i++) {
        const { idsentence, sentence_to } = dataToSave[i];
        const itm = window.for_trans_data.find(x => x.idsentence == idsentence);
        if (!itm || itm._srcIndex == null) continue;
        const srcIndex = itm._srcIndex;
        const srcRow = rows[srcIndex];
        if (!srcRow) continue;

        // Prepare updated row
        const updatedRow = { ...srcRow };
        if (translationTo === 'uk') updatedRow.text_uk = sentence_to;
        else if (translationTo === 'en') updatedRow.text_en = sentence_to;
        else if (translationTo === 'sv') updatedRow.text_sv = sentence_to;
        updatedRow.datetimetrans = new Date().toISOString();

        try {
            if (typeof window.Update_And_Save_Audio_Phrase_ItemByIndex === 'function') {
                Update_And_Save_Audio_Phrase_ItemByIndex(updatedRow, srcIndex);
            } else {
                console.error('Update_And_Save_Audio_Phrase_ItemByIndex not available');
            }
            // Update local cache so UI reflects immediately
            try { window.gv.sts.audio_phrases[srcIndex] = updatedRow; } catch {}
        } catch (e) {
            console.error('Failed to save row to audio_phrases', e);
        }
    }
}


// Save translations into DB3: ../data_base3/text_trans_phrases/{partid}/{txtid}
// Uses d_uuid format confirmed by snapshots: parttxt_<n>_txt<m>
window.SaveTransReadyDataToFireBaseTo_text_trans_phrases = async function (dataToSave) {
    const translationTo = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationTo) || 'en';
    const targetField = translationTo === 'uk' ? 'text_uk' : (translationTo === 'sv' ? 'text_sv' : 'text_en');

    const list = Array.isArray(dataToSave) ? dataToSave : [];
    const uiList = Array.isArray(window.for_trans_data) ? window.for_trans_data : [];

    // Update in-memory (so UI reflects immediately)
    for (let i = 0; i < list.length; i++) {
        const row = list[i] || {};
        const idsentence = row.idsentence;
        const sentence_to = row.sentence_to;
        const existingSentence = uiList.find(item => item && item.idsentence == idsentence);
        if (existingSentence) {
            existingSentence.sentence_to = sentence_to;
            existingSentence.datetimetrans = new Date().toISOString();
        }
    }

    const items = [];

    for (const row of list) {
        const idsentence = row && row.idsentence;
        const sentenceTo = row && row.sentence_to;
        if (idsentence == null) continue;

        const uiItem = uiList.find(x => x && x.idsentence == idsentence);
        const d_uuid = uiItem && uiItem.d_uuid;
        if (!d_uuid || typeof d_uuid !== 'string') continue;

        const parts = d_uuid.split('_');
        if (parts.length < 3) {
            console.warn('[trans] Could not parse d_uuid (need parttxt_N_txtM):', d_uuid);
            continue;
        }

        const partid = parts[0] + '_' + parts[1];
        const txtid = parts.slice(2).join('_');

        const payload = {
            [targetField]: sentenceTo,
            datetimetrans: new Date().toISOString()
        };

        items.push({ partid, txtid, payload, _uiItem: uiItem, _newText: sentenceTo });
    }

    if (!items.length) return;

    if (typeof window.FB_Patch_text_trans_phrases !== 'function') {
        console.error('[trans] FB_Patch_text_trans_phrases is not available');
        return;
    }

    await window.FB_Patch_text_trans_phrases(items);
    //await window.FB_Download_text_trans_phrases(items);
};


window.FB_Patch_text_trans_phrases = async function (items) {
    if (typeof requestByPath !== 'function') {
        console.error('[trans] requestByPath is not available');
        return;
    }

    if (typeof window.Load_DB3_Part_Phrases !== 'function') {
        console.error('[trans] Load_DB3_Part_Phrases is not available');
        return;
    }

    const list = Array.isArray(items) ? items : [];

    // Group items by partid
    const byPart = new Map();
    for (const it of list) {
        const partid = it && it.partid;
        const txtid = it && it.txtid;
        const payload = it && it.payload;
        if (!partid || !txtid || !payload) continue;

        if (!byPart.has(partid)) byPart.set(partid, []);
        byPart.get(partid).push(it);
    }

    for (const [partid, partItems] of byPart.entries()) {
        const path = `../data_base3/text_trans_phrases/${partid}`;

        try {
            const loaded = await window.Load_DB3_Part_Phrases(partid);
            const partDB = (loaded && typeof loaded === 'object') ? loaded : {};

            // Build a PATCH object that updates only the touched txtids.
            // IMPORTANT: each txtid value must include existing sibling fields
            // (text_sv/text_uk/...) to avoid erasing them.
            const patchPayload = {};

            for (const it of partItems) {
                const txtid = it && it.txtid;
                const payload = it && it.payload;
                if (!txtid || !payload) continue;

                const prev = (partDB[txtid] && typeof partDB[txtid] === 'object') ? partDB[txtid] : {};
                patchPayload[txtid] = { ...prev, ...payload };
            }

            const changedCount = Object.keys(patchPayload).length;
            if (!changedCount) continue;

            await requestByPath(path, 'PATCH', patchPayload);
            console.log('[trans] Saved part:', path, `(${changedCount} items)`);

            // Update UI only after successful write
            for (const it of partItems) {
                const { _uiItem, _newText } = it || {};
                if (_uiItem) _uiItem.sentence_to = _newText;
            }
        } catch (e) {
            console.error('[trans] Failed to save part:', path, e);
        }
    }
};


// Testing helper: download prepared patch items into a JSON file.
window.FB_Download_text_trans_phrases = async function (items, options) {
    const list = Array.isArray(items) ? items : [];
    const format = (options && options.format) ? String(options.format) : 'firebase-export';

    const clean = list.map(it => {
        const partid = it && it.partid;
        const txtid = it && it.txtid;
        const payload = it && it.payload;
        return { partid, txtid, payload };
    }).filter(x => x.partid && x.txtid && x.payload);

    // Default: match Firebase export shape
    // {
    //   "parttxt_1": { "txt989": { ...payload }, ... },
    //   "parttxt_2": { "txt1": { ...payload }, ... }
    // }
    let out;
    let filePrefix;

    if (format === 'patch-list') {
        out = {
            exportedAt: new Date().toISOString(),
            count: clean.length,
            items: clean
        };
        filePrefix = 'text_trans_phrases_patch_items';
    } else {
        out = {};
        for (const it of clean) {
            if (!out[it.partid]) out[it.partid] = {};
            out[it.partid][it.txtid] = it.payload;
        }
        filePrefix = 'text_trans_phrases_export_like';
    }

    const json = JSON.stringify(out, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filePrefix}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

async function ensureTableExists(tableName){
    try {
        if (typeof window.Get_IndexOf_Table_By_Name === 'function'){
            const idx = Get_IndexOf_Table_By_Name(tableName);
            if (idx !== -1) return idx;
        }
        // Create new table meta and empty rows
        const meta = (window.gv && window.gv.sts && Array.isArray(window.gv.sts.tables_meta)) ? window.gv.sts.tables_meta : [];
        const newIndex = meta.length;
        // Write meta entry
        await requestByPath(`tables_meta/${newIndex}`, 'PUT', { name: tableName });
        // Init empty rows array
        await requestByPath(`tables_rows/${newIndex}/rows`, 'PUT', []);
        // Update local cache
        try { window.gv.sts.tables_meta.push({ name: tableName }); } catch {}
        return newIndex;
    } catch(e){ console.error('ensureTableExists failed', e); return -1; }
}

function TextArea_copyToClipboard(TextToCopy1) {

    // Create a temporary textarea element to copy the content
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = TextToCopy1;
    document.body.appendChild(tempTextarea);

    // Select and copy the content
    tempTextarea.select();
    document.execCommand('copy');

    // Remove the temporary textarea
    document.body.removeChild(tempTextarea);
}

function RemoveAllStylesExpImpForTrans() {
    const styles = document.querySelectorAll('style');
    styles.forEach(style => {
             style.remove(); 
    });
}




function ExpImpForTrans_createStyles_2() {
   if (document.getElementById('style_ExpImpForTrans_2')) return;
   const style = document.createElement('style');
   style.id = 'style_ExpImpForTrans_2';
   style.innerHTML = `

       .sentence-item {
           margin-bottom: 8px;
       }
       .sentence-to {
           color: blue;
       }
       .sentence-from {
           color: green;
       }
       .sentence-paste-to-item {           
           padding: 4px;
           border-bottom: 1px solid #ddd;
       }
       .sentence-paste-to-item_dest {           
           padding: 4px;
           border-bottom: 1px solid #ddd;
           background-color: #def4f7f5;
       }
    .item-sentences-to-block{
        border: 1px solid #aaa;
        border-radius: 10px;
        margin-bottom: 8px;
        background-color: #ffffff;
    }


       .button_controlsentences_copy {
           border-radius: 10px;
           background: #2b68a5ff;
           color: white;
       }
       .button_controlsentences{      
           border-radius: 10px;
           background: #2b5d22ff;
           padding: 5px;        
           color: white;
        }
       .button_clear_trans{
           background: #8b1d1d;
           margin-left: 10px;
       }
       .headliner_tittle{      
           border-radius: 10px;
           background: #672564ff;
           padding: 5px;        
           color: white;
        }





        .sentences-fromblock{
            border-radius: 15px;
            border: 1px solid #ccc;
            padding: 8px;
            background-color: #b2f75750;
        }

       .block_portion_ui_ctrl{
            border-radius: 15px;
            border: 1px solid #ccc;
            padding: 8px;
            background-color: #f0797933;       
       }

       .sentences-to-block {
           border-radius: 15px;
           border: 1px solid #ccc;
           padding: 8px;
           margin-top: 8px;
           background-color: #f9f9f9;
       }

       .frame_item{           
            border-radius: 30px;
            border: 2px solid #031629ff;
            margin-top: 20px;
            margin-bottom: 20px;
            padding: 10px;            
            background-color: #ffffff;
        }

         .containerUI_Block{
            border-radius: 30px;
            border: 2px solid #031629ff;
            margin-top: 20px;
            margin-bottom: 20px;
            padding: 10px;            
            background-color: #ffffff;
        }

   `;
   document.head.appendChild(style);
}

function RemoveAllStylesExpImpForTrans() {
    const s2 = document.getElementById('style_ExpImpForTrans_2');
    if (s2) s2.remove();
}

function ExpImpForTrans_createStyles() {
    // Stub
}

window.ExpImpForTrans_createStyles_2 = ExpImpForTrans_createStyles_2;
window.RemoveAllStylesExpImpForTrans = RemoveAllStylesExpImpForTrans;
window.ExpImpForTrans_createStyles = ExpImpForTrans_createStyles;

// Listen for lesson selection events from the menu to update the view
window.addEventListener('oap:lesson-selected', () => {
    console.log('[trans] Lesson selected, refreshing view...');
    window.ExpImpForTrans_loadDataToHTML();
});

// Listen for data loaded event to trigger initial render
window.addEventListener('oap:data-loaded', () => {
    console.log('[trans] Data loaded, refreshing view...');
    window.ExpImpForTrans_loadDataToHTML();
});


window.CollectLessonData = async function(lessonId) {
    function extractpartid(text_id) {
        const parts = text_id.split('_');
        return parts.length >= 2 ? parts[0] + '_' + parts[1] : null;
    }
    function extracttxtid(text_id) {
        const parts = text_id.split('_');
        return parts.length >= 3 ? parts.slice(2).join('_') : null;
    }

    // Normalize to canonical lesson key (json_key_item like "lesson_1") so filtering works.
    const lessonIdStr = String(lessonId ?? '');
    let lessonKey = null;
    if (/^lesson_\d+$/i.test(lessonIdStr)) {
        lessonKey = lessonIdStr;
    } else {
        try {
            const lessonsRaw = window.gv?.sts?.lessons_audio_phrases;
            const list = Array.isArray(lessonsRaw)
                ? lessonsRaw
                : (lessonsRaw && typeof lessonsRaw === 'object')
                    ? Object.values(lessonsRaw)
                    : [];
            const found = list.find(l => l && (
                String(l.rec_id) === lessonIdStr ||
                String(l.json_key_item) === lessonIdStr
            ));
            if (found) lessonKey = String(found.json_key_item);
        } catch {}
    }
    if (!lessonKey) lessonKey = lessonIdStr;

    if (window.Load_DB3_Lesson_Phrases) {
        await window.Load_DB3_Lesson_Phrases(lessonKey);
    }

    const phrasesAll = window.gv && window.gv.sts ? window.gv.sts.audio_phrases : [];
    const hasLessonTag = Array.isArray(phrasesAll) && phrasesAll.some(p => p && p.lesson_id !== undefined);
    const phrases = hasLessonTag
        ? phrasesAll.filter(p => p && String(p.lesson_id) === String(lessonKey))
        : phrasesAll;

    if (!Array.isArray(phrases) || phrases.length === 0) {
        console.warn('[trans] CollectLessonData: no phrases found for lesson', { lessonId, lessonKey });
        return [];
    }
    let Set_Txt = new Set();
    phrases.forEach((item) => {
        if (item.text_id && !Set_Txt.has(item.text_id)) {            
            Set_Txt.add(item.text_id);            
        }
    });

    let List_Txt = [];
    Set_Txt.forEach((text_id) => {
        const partid = extractpartid(text_id);
        const txtid = extracttxtid(text_id);
        if (partid && txtid) {
            List_Txt.push({ partid, txtid });
        }
    });

    let PartsObj = {};
    List_Txt.forEach((item) => {
        if (!PartsObj[item.partid]) {
            PartsObj[item.partid] = [];
        }
        PartsObj[item.partid].push(item.txtid);
    });

    let FilteredItems = [];
    const partKeys = Object.keys(PartsObj);

    for (const partid of partKeys) {
        const txtIds = PartsObj[partid];
        if (typeof window.Load_DB3_Part_Phrases !== 'function') {
            console.error('[trans] CollectLessonData: Load_DB3_Part_Phrases is not available');
            return [];
        }

        const partDB = await window.Load_DB3_Part_Phrases(partid);

        if (partDB) {
            txtIds.forEach((txtid) => {
                if (partDB[txtid]) {
                    const item = partDB[txtid];
                    FilteredItems.push({ ...item, _partid: partid, _txtid: txtid });
                }
            });
        }
    }
    return FilteredItems;
};

