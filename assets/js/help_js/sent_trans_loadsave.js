function ExpImpForTrans_loadDataToHTML() {
   ExpImpForTrans_Sentence_loadDataToHTML();  
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


function transformData() {
    // Use Firebase data (gv.sts.audio_phrases) instead of hardcoded JSON
    const translationFrom = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationFrom) || 'uk';
    const translationTo = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationTo) || 'en';

    const rows = (window.gv && window.gv.sts && Array.isArray(window.gv.sts.audio_phrases)) ? window.gv.sts.audio_phrases : [];
    const selected_lesson_id = window.gv && window.gv.sts ? window.gv.sts.selected_lesson_id : null;
    
    console.log(`[trans] loadContentData called. Rows: ${rows.length}, Selected Lesson: ${selected_lesson_id}`);

    let filtered = rows;

    // Strict filtering by lesson_id (string comparison)
    if (selected_lesson_id !== null && selected_lesson_id !== undefined && String(selected_lesson_id) !== '') {
        const sel = String(selected_lesson_id);
        const matches = rows.filter(r => String(r.lesson_id) === sel);

        if (matches.length > 0) {
            filtered = matches;
            console.log(`[trans] Filtered to ${filtered.length} rows for lesson ${sel}`);
        } else {
            console.warn('[trans] selected_lesson_id', sel, 'did not match any lesson_id; using all rows. Total rows:', rows.length);
            filtered = rows;
        }
    }

    const output_data = [];
    for (let i = 0; i < filtered.length; i++) {
        const seg = filtered[i] || {};
        const srcIndex = rows.indexOf(seg);
        const idSentence = (typeof seg.index === 'number') ? seg.index : (i + 1);

        const pickText = (lang) => {
            if (lang === 'uk') return seg.text_uk || '';
            if (lang === 'en') return seg.text_en || '';
            if (lang === 'sv') return seg.text_sv || '';
            return '';
        };
        const sentence_from = pickText(translationFrom) || '';
        const sentence_to = pickText(translationTo) || '';
        // needs_translation when target is empty OR translationFrom === translationTo (force review scenario)
        const needs_translation = translationFrom === translationTo
            ? true
            : !(String(sentence_to || '').trim().length > 0);

        output_data.push({
            idsentence: idSentence,
            d_uuid: seg.glob_id || seg.file_name || '',
            sentence_from: String(sentence_from || ''),
            sentence_to: String(sentence_to || ''),
            needs_translation,
            _srcIndex: srcIndex < 0 ? null : srcIndex
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


function ExpImpForTrans_Sentence_loadDataToHTML() {

    window.for_trans_data = transformData();   

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
        // Call your save function here, e.g., SaveSentencesToFirebase(dataToSave);
        SaveTransReadyDataToFireBase(dataToSave);
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
           // Call your save function here, e.g., SaveSentencesToFirebase(dataToSave);
           SaveTransReadyDataToFireBase(dataToSave);           
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
    ExpImpForTrans_Sentence_loadDataToHTML();
});

// Listen for data loaded event to trigger initial render
window.addEventListener('oap:data-loaded', () => {
    console.log('[trans] Data loaded, refreshing view...');
    ExpImpForTrans_Sentence_loadDataToHTML();
});

