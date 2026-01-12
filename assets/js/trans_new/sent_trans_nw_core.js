
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


function GenerateTimeDelim_For_Sentence(BlockSentences1, sentence_str1, index_loop, prevTotalMillisec, arr_already_generated_time_delims)  {
    function testOnContainingInAlreadyGeneratedTimeDelims(curtimeDelim1, arr_already_generated_time_delims1){
        for(let i = 0; i < arr_already_generated_time_delims1.length; i++){
            let item1 = arr_already_generated_time_delims1[i];
            let str_item1 = String(item1);
            let str_curtimeDelim1 = String(curtimeDelim1);
            // example: 
            // str_curtimeDelim1 = 125:45  
            // str_item1 = 25:45
            if (str_curtimeDelim1.indexOf(str_item1) !== -1){
                return true;
            }            
        }
        return false;
    }
    function It_Is_Unique_ID_Time(curtimeDelim1, arr_already_generated_time_delims1){        
        if (BlockSentences1.indexOf(itemTimeDelimArr[0]) !== -1){
            return true;
        }
        return testOnContainingInAlreadyGeneratedTimeDelims(curtimeDelim1, arr_already_generated_time_delims1);
    }
    const length1 = sentence_str1.length;
    const Per1CharMillisec = 10; // 10 milliseconds per character
    //const Item_Millisec = index1 * length1 * Per1CharMillisec; 
    function Get_Total_Millisec_For_Sentence(inx1, prevTotalMillisec_v) {            
        const Item_Millisec = inx1 * length1 * Per1CharMillisec;
        const totalMillisec = Item_Millisec + Number(prevTotalMillisec_v);
        const milliseconds = totalMillisec - Math.floor(totalMillisec / 100)*100;
        const totalSeconds = Math.floor(totalMillisec / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        //const timeDelim = `${String(minutes)}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
        let curtimeDelim = `${String(totalSeconds)}:${String(milliseconds).padStart(2, '0')}`;
        return [curtimeDelim, totalMillisec];
    }  
    let itemTimeDelimArr = Get_Total_Millisec_For_Sentence(index_loop, prevTotalMillisec);
    let restimeDelim = '';
    let prevTotalMillisecV1 = prevTotalMillisec;
    for (let i = 0; restimeDelim !== itemTimeDelimArr[0]; i++) {
        // if sentence_str1 contains curtimeDelim or , choose another the next or 
        if (It_Is_Unique_ID_Time(itemTimeDelimArr[0], arr_already_generated_time_delims))
        {
            prevTotalMillisecV1 = prevTotalMillisecV1 + 10; // add 10 milliseconds to avoid collision
            itemTimeDelimArr = Get_Total_Millisec_For_Sentence(index_loop, prevTotalMillisecV1);
        } else {
            restimeDelim = itemTimeDelimArr[0];
            prevTotalMillisecV1 = itemTimeDelimArr[1];
            break;
        }
    }
    

    return [restimeDelim, prevTotalMillisecV1];
}

function FirstStagePreparation_InputData(inputData, countSentences) {

        // Store raw data if provided, or use existing
    if (inputData) {
        window.raw_trans_data = inputData;
    }
    
    // Use stored data if inputData is not provided (e.g. re-render)
    const dataToTransform = inputData || window.raw_trans_data || [];

    window.for_trans_data = transformData(dataToTransform);       

    let tr_sentences = [];
    let block_id1 = 0;    
    let j = 0;
    let BlockSentences = '';
    let ArrBlockSents = [];


    for (let i = 0; i < window.for_trans_data.length; i++) {
        let sentence = window.for_trans_data[i];
        block_id1 = Math.floor(i / countSentences);
        j++;
        if (i > 0 && i % countSentences === 0) {
            ArrBlockSents.push(BlockSentences);
            j = 0;
            BlockSentences = '';            
        }
        if (sentence.needs_translation) {
            BlockSentences += sentence.sentence_from;
            tr_sentences.push({
                idsentence: sentence.idsentence,
                id_block: block_id1,
                sentence_from: sentence.sentence_from,
                sentence_to: sentence.sentence_to
            });
        }
    }
     
    block_id1 = -1;
    let prevMillisec = 0;
    j = 0;
    let arr_already_generated_time_delims = [];
    for (let i = 0; i < tr_sentences.length; i++) {        
        let sent_tr1 = tr_sentences[i];
        if (block_id1 !== sent_tr1.id_block){
            BlockSentences = ArrBlockSents[sent_tr1.id_block] || '';
            prevMillisec = 0;
            j = 0;
        }
        j++;
        block_id1 = sent_tr1.id_block;        
        const ArrtimeDelim = GenerateTimeDelim_For_Sentence(BlockSentences, sent_tr1.sentence_from, j, prevMillisec, arr_already_generated_time_delims);
        sent_tr1.id_time_delim = ArrtimeDelim[0];
        sent_tr1.val_time_millisec = ArrtimeDelim[1];
        prevMillisec = ArrtimeDelim[1];
        arr_already_generated_time_delims.push(ArrtimeDelim[0]);
    }

    //id_time_delim: sentence.id_time_delim,

    return tr_sentences;

}

function ExpImpForTrans_Sentence_loadDataToHTML(inputData) {

    const countSentences = 25;

    let tr_sentences = FirstStagePreparation_InputData(inputData, countSentences);

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

        let sent_tr = tr_sentences[i];

        let id_block = sent_tr.id_block;

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
            // let begin_delimeter_sentences = '352725_' + sentence.idsentence;
            // let end_delimeter_sentences = '973524_';
            let begin_delimeter_sentences = sentence.id_time_delim;
            let end_delimeter_sentences = '';

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
            // replace multiple spaces and new lines with single space
            TextToCopy1 = TextToCopy1.replace(/\s+/g, ' ').trim();
            // change button text to "Copied!" for 2 seconds
            this.textContent = 'Copied';
            TextArea_copyToClipboard(TextToCopy1);          
        }; 


        let parseButton = document.createElement('button');
        parseButton.textContent = 'Parse input';
        parseButton.setAttribute('to_valueid', `sentences-to-block-${id_block}`);
        parseButton.className = 'button_controlsentences';
        parseButton.onclick = function() {

            ParseButton_Onclick.call(this, id_block, tr_sentences);


        };

        let sentencesToBlock1 = document.createElement('div');
        sentencesToBlock1.id = `sentences-to-block-${id_block}`;
        sentencesToBlock1.className = 'sentences-to-block';
        sentencesToBlock1.onclick = function(){
          onclick_sentencesToBlock(id_block);
        };

        const saveToBaseButton = document.createElement('button');
        saveToBaseButton.textContent = 'Save Next';
        saveToBaseButton.className = 'button_controlsentences';
        saveToBaseButton.id = `button-save-to-db-${id_block}`;
        saveToBaseButton.style.display = 'none'; // Initially hidden
        saveToBaseButton.onclick = async function() {

            let id_block = this.id.replace('button-save-to-db-', '');
            if (!id_block) {
                console.error('ID block not found.');
                return;
            }
            // Call the function to save sentences to the database
            console.log(`Saving sentences for block ID: ${id_block}`);
            // Save current block to Firebase
            try {
                await Save_1Block_ToBase_Sent_TransTo(id_block);
            } catch (e) {
                console.error('Failed to save block', e);
                return;
            }
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
        clearToBaseButton.onclick = async function(){
            const ids = getIdsFromSentencesFromBlock(id_block);
            if (!ids.length){
                alert('No sentence ids found in this block to clear.');
                return;
            }
            const dataToSave = ids.map(id => ({ idsentence: id, sentence_to: '' }));
            try {
                await SaveTransReadyDataToFireBase(dataToSave);
            } catch (e) {
                console.error('Failed to clear translations', e);
                return;
            }
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
        // Removed Download JSON action; saving happens per block via the button above.

}

function ProccesMissedidTimeMark(idsent_begin, indx1, tr_sent_arr1, entire_text1) {
    const leader = tr_sent_arr1 && tr_sent_arr1[indx1];
    if (!leader) return null;

    const addedIdsRaw = (leader.added_ids == null) ? '' : String(leader.added_ids);
    const ids = addedIdsRaw
        .split('-')
        .map(s => String(s).trim())
        .filter(Boolean);

    // We only handle runs like "14 - 15 - 16" (>= 2 ids)
    if (ids.length < 2) return null;

    // Safety: ensure the run begins with the expected id
    if (String(ids[0]) !== String(idsent_begin)) return null;

    const beginDelim = (leader.to_begin_delim == null) ? leader.id_time_delim : leader.to_begin_delim;
    const endDelim = (leader.to_end_delim == null) ? '' : String(leader.to_end_delim);

    if (!beginDelim) return null;
    if (typeof entire_text1 !== 'string' || entire_text1.length === 0) return null;

    const posBegin = entire_text1.indexOf(beginDelim);
    if (posBegin === -1) return null;

    let posEnd = -1;
    if (endDelim) {
        posEnd = entire_text1.indexOf(endDelim, posBegin + beginDelim.length);
    }
    if (posEnd === -1) posEnd = entire_text1.length;
    if (posEnd <= posBegin) return null;

    const segment = entire_text1.substring(posBegin + beginDelim.length, posEnd);
    if (segment.length < ids.length) return null;

    // Prefer sentence/line splitting when the translator merged multiple sentences into one block.
    // Keep newlines as boundaries (do NOT normalize them away before splitting).
    function splitBySentenceOrLine(text) {
        const out = [];
        let buf = '';
        const s = String(text || '');

        function commit() {
            const part = buf.replace(/\s+/g, ' ').trim();
            if (part) out.push(part);
            buf = '';
        }

        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            buf += ch;

            // Hard line break boundary
            if (ch === '\n' || ch === '\r') {
                commit();
                continue;
            }

            const isEndPunct = ch === '.' || ch === '!' || ch === '?' || ch === '…';
            if (!isEndPunct) continue;

            const next = (i + 1 < s.length) ? s[i + 1] : '';
            // commit at punctuation followed by whitespace/end
            if (!next || next === ' ' || next === '\n' || next === '\r' || next === '\t') {
                commit();
            }
        }
        if (buf.trim()) commit();
        return out;
    }

    function trySplitByComma(parts, targetCount) {
        const list = Array.isArray(parts) ? parts.slice() : [];
        const seps = [',', ';'];

        function findBestSplitIndex(str) {
            const s = String(str || '');
            let best = -1;
            for (const sep of seps) {
                const idx = s.indexOf(sep);
                if (idx !== -1) {
                    // prefer later separators (keeps first part meaningful)
                    const last = s.lastIndexOf(sep);
                    best = Math.max(best, last);
                }
            }
            return best;
        }

        while (list.length < targetCount) {
            // split the longest item if possible
            let longestIdx = -1;
            let longestLen = -1;
            for (let i = 0; i < list.length; i++) {
                const len = String(list[i] || '').length;
                if (len > longestLen) { longestLen = len; longestIdx = i; }
            }
            if (longestIdx < 0) break;

            const cur = String(list[longestIdx] || '');
            const cut = findBestSplitIndex(cur);
            if (cut < 0) break;

            const a = cur.slice(0, cut + 1).replace(/\s+/g, ' ').trim();
            const b = cur.slice(cut + 1).replace(/\s+/g, ' ').trim();
            if (!a || !b) break;

            list.splice(longestIdx, 1, a, b);
        }
        return list;
    }

    const rawParts = splitBySentenceOrLine(segment);
    const punctParts = trySplitByComma(rawParts, ids.length);
    const segmentNorm = String(segment || '').replace(/\s+/g, ' ').trim();

    // Prefer consecutive mapping starting at indx1, but fall back to lookup by id if mismatch.
    const runSentences = [];
    for (let k = 0; k < ids.length; k++) {
        const expectedId = ids[k];
        const s = tr_sent_arr1[indx1 + k];
        if (s && String(s.idsentence) === String(expectedId)) {
            runSentences.push(s);
        } else {
            const found = tr_sent_arr1.find(x => x && String(x.idsentence) === String(expectedId));
            if (!found) return null;
            runSentences.push(found);
        }
    }

    if (punctParts.length >= runSentences.length) {
        const parts = punctParts.slice();
        // If too many pieces, merge extras into the last required slot.
        while (parts.length > runSentences.length) {
            const extra = parts.pop();
            parts[runSentences.length - 1] = (parts[runSentences.length - 1] + ' ' + extra).trim();
        }
        if (parts.length === runSentences.length) {
            let pos = 0;
            const fixed = [];
            for (let k = 0; k < runSentences.length; k++) {
                const text = parts[k];
                const startIndex = pos;
                pos += text.length;
                const endIndex = pos;
                pos += 1; // virtual space between parts
                fixed.push({
                    idsentence: runSentences[k].idsentence,
                    startIndex,
                    endIndex,
                    extractedText: text
                });
            }
            return {
                fixed,
                consumedTo: posEnd,
                nextIndex: indx1 + ids.length,
                beginDelim,
                endDelim,
                segmentLength: segmentNorm.length
            };
        }
    }

    // Fallback: proportional slicing (works even if punctuation splitting fails)

    const weights = runSentences.map(s => {
        const t = (s && s.sentence_from != null) ? String(s.sentence_from) : '';
        return Math.max(1, t.length);
    });
    const totalW = weights.reduce((a, b) => a + b, 0);
    if (!Number.isFinite(totalW) || totalW <= 0) return null;

    let start = 0;
    let acc = 0;
    const fixed = [];

    function isWs(ch){
        return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
    }

    // Snap a suggested split point to a nearby whitespace so we don't cut words.
    // Guarantees result in [minEnd, maxEnd] and tries to keep it close to suggested.
    function snapToWhitespace(text, suggested, minEnd, maxEnd) {
        const len = text.length;
        let s = Math.max(0, Math.min(len, Math.floor(suggested)));
        const minV = Math.max(0, Math.min(len, Math.floor(minEnd)));
        const maxV = Math.max(minV, Math.min(len, Math.floor(maxEnd)));

        if (s < minV) s = minV;
        if (s > maxV) s = maxV;

        // already at a boundary: ok
        if (s === minV || s === maxV) return s;

        const windowSize = Math.min(40, Math.max(6, Math.floor(len / 50)));
        const leftLimit = Math.max(minV, s - windowSize);
        const rightLimit = Math.min(maxV, s + windowSize);

        // Prefer forward whitespace (keeps earlier parts shorter rather than longer)
        for (let p = s; p <= rightLimit; p++) {
            if (p === len) return p;
            if (isWs(text[p])) return p;
        }
        for (let p = s; p >= leftLimit; p--) {
            if (p === 0) return p;
            if (isWs(text[p - 1])) return p;
        }
        return s;
    }

    for (let k = 0; k < runSentences.length; k++) {
        acc += weights[k];
        let end = (k === runSentences.length - 1)
            ? segmentNorm.length
            : Math.floor((acc / totalW) * segmentNorm.length);
        if (end < start) end = start;

        // snap end boundary to whitespace, but keep monotonic and never exceed segment length
        if (k !== runSentences.length - 1) {
            end = snapToWhitespace(segmentNorm, end, start, segmentNorm.length);
        }
        if (end < start) end = start;

        const extractedText = segmentNorm.slice(start, end).trim();
        fixed.push({
            idsentence: runSentences[k].idsentence,
            startIndex: start,
            endIndex: end,
            extractedText
        });
        start = end;
    }

    return {
        fixed,
        consumedTo: posEnd,
        nextIndex: indx1 + ids.length,
        beginDelim,
        endDelim,
        segmentLength: segmentNorm.length
    };
}

//====================================================================================================================
//====================================================================================================================
//====================================================================================================================


function Proc_Missed_idTimeMark(i, filtered_tr_sentences, fullText){
    function countWords(str){
        return str.trim().split(/\s+/).length;
    }
    function proportionabyWord_lSlicing_Str(from_str, to_str, arr_indxs, filtered_tr_sentences){
        const total_from_words = countWords(from_str);
        const total_to_words = countWords(to_str);
        if(total_from_words === 0 || total_to_words === 0){
            return;
        }
        const to_words_array = to_str.trim().split(/\s+/);
        for (let k = 0; k < arr_indxs.length; k++) {
            const sent = filtered_tr_sentences[arr_indxs[k]];
            const sent_from = (sent && sent.sentence_from != null) ? String(sent.sentence_from) : '';
            const sent_from_words = countWords(sent_from);
            const proportion = sent_from_words / total_from_words;
            const sent_to_words = Math.max(1, Math.round(proportion * total_to_words));            
            const extracted_words = to_words_array.splice(0, sent_to_words);
            const extractedText = extracted_words.join(' ');
            sent.sentence_to = extractedText;
        }                    
    }       
            

    const sent_tr1 = filtered_tr_sentences[i];
    const addedIdsStr = (sent_tr1.added_ids == null) ? '' : String(sent_tr1.added_ids);
    const ids = addedIdsStr.split('-').map(s => String(s).trim()).filter(Boolean);
    let from_str = '';
    let to_str = '';
    arr_indxs = [];
    for (let k = 0; k < ids.length; k++) {
        const Id = ids[k];
        const j = filtered_tr_sentences.findIndex(x => x && String(x.idsentence) === String(Id));
        arr_indxs.push(j);
        const sent = filtered_tr_sentences[j];
        //sent.length_from = (sent && sent.sentence_from != null) ? String(sent.sentence_from).length : 0;
        from_str += (sent && sent.sentence_from != null) ? String(sent.sentence_from) + ' ' : ' ';
    }
    let Delim_start = sent_tr1.to_begin_delim;
    let Delim_end = sent_tr1.to_end_delim;
    extractedText = fullText.substring(fullText.indexOf(Delim_start) + Delim_start.length, fullText.indexOf(Delim_end));
    to_str = extractedText;
    console.log('--------BEGIN------------------------- ProccesMissedidTimeMark ---------------------------------');
    console.log('Processing Id:', sent_tr1.idsentence);
    console.log('From string:', from_str);
    console.log('To string:', to_str);
    console.log('result slices:');
    proportionabyWord_lSlicing_Str(from_str, to_str, arr_indxs, filtered_tr_sentences);
    for (let k = 0; k < arr_indxs.length; k++) {
        const sent = filtered_tr_sentences[arr_indxs[k]];
        console.log(`id: ${sent.idsentence} from: ${sent.sentence_from}`);
        console.log(`id: ${sent.idsentence} to: ${sent.sentence_to}`);        
    }
    console.log('--------END------------------------- ProccesMissedidTimeMark ---------------------------------');
    return null;
}

//====================================================================================================================
//====================================================================================================================
//====================================================================================================================


function ParseButton_Onclick(id_block, tr_sentences) {    

    let textareaB1 = document.getElementById(`textareaB1-${id_block}`);
    if (!textareaB1) {
        console.error(`Textarea with id textareaB1-${id_block} not found.`);
        return;
    }
    textareaB1.style.display = 'block'; // Show the textarea
    let sentencesToBlock = document.getElementById(this.getAttribute('to_valueid'));
    if (!sentencesToBlock) {
        console.error(`Element with id ${this.getAttribute('to_valueid')} not found.`);
        return;
    }
    textareaB1.focus();             
    textareaB1.select(); 

    sentencesToBlock.innerHTML = ''; // Clear previous phrases

    //let text_1 = textareaB1.value;
    let text_1 = textareaB1.value;
    if (!text_1 || text_1.trim().length <= 5) {
        console.warn('No input text provided for parsing.');
        return;
    }

    // filter tr_sentences by id_block
    const filtered_tr_sentences = Array.isArray(tr_sentences)
        ? tr_sentences.filter(p => p && p.id_block == id_block)
        : [];

    // Build a stable id -> sentence_from map (used for UI display)
    const idToFrom = new Map();
    for (const it of filtered_tr_sentences) {
        if (!it) continue;
        idToFrom.set(String(it.idsentence), (it.sentence_from == null) ? '' : String(it.sentence_from));
    }

    function appendParsedRow(idsentence, sentence_to_text) {
        const item_sentencesToBlock = document.createElement('div');
        item_sentencesToBlock.className = 'item-sentences-to-block';

        const sentenceDiv = document.createElement('div');
        sentenceDiv.className = 'sentence-paste-to-item';
        sentenceDiv.id = `sentence-paste-${idsentence}`;
        sentenceDiv.setAttribute('idsentence', idsentence);
        sentenceDiv.textContent = sentence_to_text;
        item_sentencesToBlock.appendChild(sentenceDiv);

        const sentence_ToDiv = document.createElement('div');
        sentence_ToDiv.className = 'sentence-paste-to-item_dest';
        sentence_ToDiv.id = `sentence-src-${idsentence}`;
        sentence_ToDiv.setAttribute('idsentence', idsentence);
        sentence_ToDiv.textContent = idToFrom.get(String(idsentence)) || '';
        item_sentencesToBlock.appendChild(sentence_ToDiv);

        sentencesToBlock.appendChild(item_sentencesToBlock);
    }

    // 1) Detect runs: leader sentence has begin/end delim and added ids
    let prevLeaderIndex = -1;
    let prevDelimVal = '';
    let missingIds = [];

    console.clear();
    for (let i = 0; i < filtered_tr_sentences.length; i++) {
        const sent_tr1 = filtered_tr_sentences[i];
        const begin_delimeter_sentences = sent_tr1 && sent_tr1.id_time_delim;
        if (!begin_delimeter_sentences || text_1.indexOf(begin_delimeter_sentences) === -1) {
            missingIds.push(sent_tr1.idsentence);
            if (prevLeaderIndex < 0) {
                console.warn(`[parse] Delimiter ${begin_delimeter_sentences} not found for id ${sent_tr1.idsentence} (no leader yet). Paste should include the first delimiter of the block.`);
            } else if (missingIds.length === 1) {
                const leaderId = filtered_tr_sentences[prevLeaderIndex] && filtered_tr_sentences[prevLeaderIndex].idsentence;
                console.log(`[parse] Missing delimiters detected; will merge into leader id ${leaderId} until next delimiter.`);
            }
            continue;
        }

        if (prevLeaderIndex >= 0) {
            const leader = filtered_tr_sentences[prevLeaderIndex];
            leader.to_begin_delim = prevDelimVal;
            leader.to_end_delim = begin_delimeter_sentences;
            leader.added_ids = [leader.idsentence, ...missingIds].join(' - ');

            console.log(`begin: ${leader.to_begin_delim}`);
            console.log(`end: ${leader.to_end_delim}`);
            console.log(`added: ${leader.added_ids}`);
            console.log(` - - - - - - - - - - - - - - - - - - - - - - - - - `);
            missingIds = [];
        }

        prevLeaderIndex = i;
        prevDelimVal = begin_delimeter_sentences;
    }

    // Finalize the last leader (end delimiter unknown => end of text)
    if (prevLeaderIndex >= 0) {
        const leader = filtered_tr_sentences[prevLeaderIndex];
        leader.to_begin_delim = prevDelimVal;
        leader.to_end_delim = '';
        leader.added_ids = [leader.idsentence, ...missingIds].join(' - ');
    }

    // 2) Parse text into sentence_to rows
//====================================================================================================================
//====================================================================================================================
//====================================================================================================================

    const fullText = String(text_1 || '');
    let cursor = 0;

    // for (let i = 0; i < filtered_tr_sentences.length; i++) {
    //     const sent_tr1 = filtered_tr_sentences[i];
    //     if (!sent_tr1) { i++; continue; }

    //     const addedIdsStr = (sent_tr1.added_ids == null) ? '' : String(sent_tr1.added_ids);
    //     const ids = addedIdsStr.split('-').map(s => String(s).trim()).filter(Boolean);

    //     // Run recovery case
    //     if (ids.length >= 2) {
    //         const subText = fullText.substring(cursor);
    //         const res2 =  Proc_Missed_idTimeMark(i, filtered_tr_sentences, fullText);
    //     }
    // }        

//====================================================================================================================
//====================================================================================================================
//====================================================================================================================



    for (let i = 0; i < filtered_tr_sentences.length; ) {
        const sent_tr1 = filtered_tr_sentences[i];
        if (!sent_tr1) { i++; continue; }

        const addedIdsStr = (sent_tr1.added_ids == null) ? '' : String(sent_tr1.added_ids);
        const ids = addedIdsStr.split('-').map(s => String(s).trim()).filter(Boolean);

        // Run recovery case
        if (ids.length >= 2) {
            const subText = fullText.substring(cursor);
            const res = ProccesMissedidTimeMark(sent_tr1.idsentence, i, filtered_tr_sentences, subText);    
            if (res && Array.isArray(res.fixed) && res.fixed.length === ids.length) {
                console.log('[parse] recovered run', { begin: res.beginDelim, end: res.endDelim, ids: addedIdsStr, segmentLen: res.segmentLength });
                for (const row of res.fixed) {
                    const cleaned = (row.extractedText == null) ? '' : String(row.extractedText).replace(/\r?\n/g, ' ').trim();
                    // Keep parsed value on the sentence object as well (useful for debugging / downstream logic).
                    const sObj = filtered_tr_sentences.find(x => x && String(x.idsentence) === String(row.idsentence));
                    if (sObj) sObj.sentence_to = cleaned;
                    appendParsedRow(row.idsentence, cleaned);
                }
                cursor += Number(res.consumedTo || 0);
                i = Number.isFinite(res.nextIndex) ? res.nextIndex : (i + ids.length);
                continue;
            }
            // If recovery fails, fall through and try single-sentence parsing
        }

        // Single sentence parsing using its delimiter and the next found delimiter after cursor
        const beginDelim = sent_tr1.id_time_delim;
        if (!beginDelim) { i++; continue; }

        const posBegin = fullText.indexOf(beginDelim, cursor);
        if (posBegin === -1) { i++; continue; }

        let posEnd = fullText.length;
        for (let j = i + 1; j < filtered_tr_sentences.length; j++) {
            const nextDelim = filtered_tr_sentences[j] && filtered_tr_sentences[j].id_time_delim;
            if (!nextDelim) continue;
            const p = fullText.indexOf(nextDelim, posBegin + beginDelim.length);
            if (p !== -1) { posEnd = p; break; }
        }

        const extracted = fullText.substring(posBegin + beginDelim.length, posEnd);
        cursor = posEnd;

        const cleaned = String(extracted || '').replace(/\r?\n/g, ' ').trim();
        if (cleaned) {
            sent_tr1.sentence_to = cleaned;
            appendParsedRow(sent_tr1.idsentence, cleaned);
        }
        i++;
    }

   


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

async function Save_1Block_ToBase_Sent_TransTo(id_block) {
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
            await window.SaveTransReadyDataToFireBaseTo_text_trans_phrases(dataToSave);
        } else {
            console.warn('[trans] SaveTransReadyDataToFireBaseTo_text_trans_phrases is not available, falling back to audio saver');
            await SaveTransReadyDataToFireBase(dataToSave);
        }
        console.log('Sentences saved successfully!');
    } else {
        alert('No valid sentences to save.');
    }


}


async function SaveAllFramesToDatabase() {
    const  infoDiv = document.getElementById('info_div');
    const sentencesToBlocks = infoDiv.querySelectorAll('.sentences-to-block');
    for (const block of sentencesToBlocks) {
        let sentences = block.querySelectorAll('.sentence-paste-to-item');
        if (sentences.length === 0) {
            console.warn('No sentences to save in this block.');
            continue;
        }
        
        // Prepare data to save
       const blockDataToSave = [];
       sentences.forEach(sentence => {
           let idsentence = sentence.getAttribute('idsentence');
           let sentenceText = sentence.innerText.trim();
           if (idsentence && sentenceText) {
               blockDataToSave.push({
                   idsentence: idsentence,
                   sentence_to: sentenceText
               });
           }
       });

       // Save to Firebase or any other database
       if (blockDataToSave.length > 0) {
           // Save to DB3 text_trans_phrases
           if (typeof window.SaveTransReadyDataToFireBaseTo_text_trans_phrases === 'function') {
               await window.SaveTransReadyDataToFireBaseTo_text_trans_phrases(blockDataToSave);
           } else {
               console.warn('[trans] SaveTransReadyDataToFireBaseTo_text_trans_phrases is not available, falling back to audio saver');
               await SaveTransReadyDataToFireBase(blockDataToSave);
           }
           console.log('Sentences saved successfully for one block!');
       } else {
           alert('No valid sentences to save.');
       }
   }
    
   
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


// ------------------------------------------------------------
// YouTube translation saver (used by yout_transl.html)
// ------------------------------------------------------------
// Save translations back into DB_CONST_YOUTUBE_TRANSCRIPTS/<videoId>/items[*].text_<toLang>
// This function is intentionally additive so transl.html keeps working unchanged.
window.SaveTransReadyDataToFireBaseTo_youtube_transcripts = async function (videoId, toLang, fromLang, dataToSave) {
    const vid = (videoId == null) ? '' : String(videoId).trim();
    const langTo = (toLang == null) ? '' : String(toLang).trim().toLowerCase();
    const langFrom = (fromLang == null) ? '' : String(fromLang).trim().toLowerCase();
    const list = Array.isArray(dataToSave) ? dataToSave : [];

    if (!vid) {
        console.error('[yout_trans] SaveTransReadyDataToFireBaseTo_youtube_transcripts: missing videoId');
        return;
    }
    if (!langTo) {
        console.error('[yout_trans] SaveTransReadyDataToFireBaseTo_youtube_transcripts: missing toLang');
        return;
    }
    if (!window.YouTubeTranscriptStore || typeof window.YouTubeTranscriptStore.load !== 'function' || typeof window.YouTubeTranscriptStore.save !== 'function') {
        console.error('[yout_trans] YouTubeTranscriptStore.load/save not available');
        return;
    }

    const uiList = Array.isArray(window.for_trans_data) ? window.for_trans_data : [];

    // Build map idsentence -> _srcIndex
    const idToSrcIndex = new Map();
    for (const it of uiList) {
        const id = it && it.idsentence;
        const srcIndex = it && it._srcIndex;
        if (id == null) continue;
        const n = Number(srcIndex);
        if (!Number.isFinite(n)) continue;
        idToSrcIndex.set(String(id), n);
    }

    let data;
    try {
        data = await window.YouTubeTranscriptStore.load(vid);
    } catch (e) {
        console.error('[yout_trans] Failed to load transcript', e);
        return;
    }

    const items = (data && Array.isArray(data.items)) ? data.items.slice() : [];
    const key = `text_${langTo}`;
    const srcKey = langFrom ? `text_${langFrom}` : '';

    // Apply updates
    for (const row of list) {
        const idsentence = row && row.idsentence;
        const sentence_to = (row && row.sentence_to != null) ? String(row.sentence_to) : '';
        if (idsentence == null) continue;

        const srcIndex = idToSrcIndex.get(String(idsentence));
        if (!Number.isFinite(Number(srcIndex))) continue;

        const idx = Number(srcIndex);
        if (idx < 0 || idx >= items.length) continue;

        const cur = (items[idx] && typeof items[idx] === 'object') ? items[idx] : {};

        // Update destination translation field
        cur[key] = sentence_to;

        // Backfill source language field when the transcript uses `text` but not `text_<fromLang>`.
        // This makes persisted items look like: { t, text_en, text_uk, ... }.
        const uiItem = uiList.find(x => x && x.idsentence == idsentence);
        if (srcKey) {
            const existingSrc = (cur[srcKey] != null) ? String(cur[srcKey]).trim() : '';
            if (!existingSrc) {
                const fromUi = (uiItem && uiItem.sentence_from != null) ? String(uiItem.sentence_from).trim() : '';
                const fromText = (cur.text != null) ? String(cur.text).trim() : '';
                const best = fromUi || fromText;
                if (best) cur[srcKey] = best;
            }
        }

        // If `t` is missing, try to infer from d_uuid like "yt_<vid>_t_<seconds>".
        if (cur.t == null || !Number.isFinite(Number(cur.t))) {
            const du = uiItem && uiItem.d_uuid;
            if (typeof du === 'string') {
                const m = /(?:^|_)t_([0-9]+(?:\.[0-9]+)?)/.exec(du);
                if (m) {
                    const tVal = Number(m[1]);
                    if (Number.isFinite(tVal)) cur.t = tVal;
                }
            }
        }

        items[idx] = cur;

        // Update UI cache immediately
        if (uiItem) {
            uiItem.sentence_to = sentence_to;
            uiItem.datetimetrans = new Date().toISOString();
        }
    }

    try {
        const rawText = (data && typeof data.rawText === 'string') ? data.rawText : '';
        await window.YouTubeTranscriptStore.save(vid, items, rawText, {
            lang1_show: langFrom,
            lang2_show: langTo
        });
    } catch (e) {
        console.error('[yout_trans] Failed to save transcript', e);
    }
};

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

