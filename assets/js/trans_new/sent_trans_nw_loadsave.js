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
