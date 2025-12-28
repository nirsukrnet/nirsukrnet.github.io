let gv = new GlobalVars();
window.gv = gv;


function MainFunc() {  
  init().then(() => {
    console.log("MainFunc() complete.");
  }).catch(error => {
    console.error("Error during MainFunc() initialization:", error);
  });
}


// Promise wrapper around the callback-style request
function requestByPath(addurl, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const ObjRequest = gv.URL_DS.GetObjForRequest();
    ObjRequest.addUrl = addurl;
    ObjRequest.ametod = method;
    ObjRequest.vobj = body;
    ObjRequest.CallBackFunction = function(vdata, ametod) {
      resolve(vdata);
    };
    ObjRequest.ErrorCallback = function(err) {
      reject(err || new Error('requestData_By_URL_Path failed'));
    };
    gv.URL_DS.requestData_By_URL_Path(ObjRequest);
  });
}

async function init() {    
  try {
    await gv.SignIn_User();    
    // await Get_All_Tables_Meta(); // Not needed for data_base3
    await Get_Rows_All_Tables();
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

async function Get_Rows_All_Tables() {
   // Fetch data from data_base3
   await Get_DB3_All_Data();

   try {
     if (typeof window.loadContentData === 'function') {
       loadContentData();
     }
   } catch (e) {
     console.warn('loadContentData() unavailable on this page');
   }
   try {
     // Notify UI components (like the lessons menu) that data is ready
     const detail = {
       lessons: gv.sts.lessons_audio_phrases,
       phrases: gv.sts.audio_phrases,
       selected_lesson_id: gv.sts.selected_lesson_id
     };
     window.dispatchEvent(new CustomEvent('oap:data-loaded', { detail }));
   } catch (e) {
     console.warn('oap:data-loaded dispatch failed', e);
   }
}

// New function to fetch all data from data_base3
async function Get_DB3_All_Data() {
    // Fetch lessons metadata
    const lessonsData = await requestByPath('../ref_lessons_audio_phrases', 'GET');
    gv.sts.lessons_audio_phrases = lessonsData || [];

    // Fetch mp3 files metadata (if needed, but maybe not strictly for phrases list if we iterate audio_phrases)
    const mp3FilesData = await requestByPath('../ref_mp3_files', 'GET');
    gv.sts.ref_mp3_files = mp3FilesData || [];

    // Fetch parts list from text_trans_phrases
    const partsData = await requestByPath('../data_base3/text_trans_phrases', 'GET');
    gv.sts.parts_list = partsData ? Object.keys(partsData) : [];
    console.log('[Get_DB3_All_Data] Loaded parts list:', gv.sts.parts_list);

    // Build txt_to_part_map
    gv.sts.txt_to_part_map = {};
    if (partsData) {
        for (const [partKey, partContent] of Object.entries(partsData)) {
            if (partContent && typeof partContent === 'object') {
                Object.keys(partContent).forEach(txtKey => {
                    gv.sts.txt_to_part_map[txtKey] = partKey;
                });
            }
        }
    }
    console.log('[Get_DB3_All_Data] Built txt_to_part_map with entries:', Object.keys(gv.sts.txt_to_part_map).length);

    // Initialize empty audio_phrases
    gv.sts.audio_phrases = [];
    
    // If a lesson is already selected, load it
    if (gv.sts.selected_lesson_id) {
        await Load_DB3_Lesson_Phrases(gv.sts.selected_lesson_id);
    }
}

// Load phrases for a specific lesson (now interpreted as a PART)
window.Load_DB3_Lesson_Phrases = async function(partKey) {
    console.log(`[Load_DB3] Loading phrases for partKey: ${partKey}`);
    if (!partKey) return;
    
    // In the new "parts" mode, the ID passed in IS the part key (e.g., "parttxt_1")
    // We don't need to look up a lesson object anymore.
    
    // Fetch translations (which are now the primary source) from the selected part
    let lessonTransPhrases = null;
    try {
        lessonTransPhrases = await requestByPath(`../data_base3/text_trans_phrases/${partKey}`, 'GET');
        console.log(`[Load_DB3] Loaded translations from text_trans_phrases/${partKey}`);
    } catch (e) {
        console.warn(`[Load_DB3] Translation fetch failed for ${partKey}`, e);
    }
    
    // Flatten into gv.sts.audio_phrases
    gv.sts.audio_phrases = [];
    
    // We need to construct "phrases" from the translation data since that's our source now.
    // The structure of lessonTransPhrases is expected to be: { fileKey: [ { ...phrase... }, ... ] }
    
    if (lessonTransPhrases) {
        // Sort keys naturally (txt1, txt2, ... txt10)
        const sortedKeys = Object.keys(lessonTransPhrases).sort((a, b) => {
            const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
            const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
            return numA - numB;
        });
        console.log('[Load_DB3] Sorted keys:', sortedKeys);

        for (const fileKey of sortedKeys) {
            const phrases = lessonTransPhrases[fileKey];
            console.log(`[Load_DB3] Processing fileKey: ${fileKey}, type: ${typeof phrases}, isArray: ${Array.isArray(phrases)}`);

            const processPhrase = (phrase, index) => {
                if (phrase) {
                    // Ensure metadata is present
                    phrase._lesson_key = partKey; // Using partKey as lesson_key for saving
                    phrase._file_key = fileKey;
                    phrase._index = index;
                    phrase.lesson_id = partKey; // For filtering in UI
                    
                    // Ensure text fields exist
                    if (!phrase.text_sv) phrase.text_sv = '';
                    if (!phrase.text_en) phrase.text_en = '';
                    if (!phrase.text_uk) phrase.text_uk = '';

                    gv.sts.audio_phrases.push(phrase);
                }
            };

            if (Array.isArray(phrases)) {
                phrases.forEach(processPhrase);
            } else if (typeof phrases === 'object' && phrases !== null) {
                // Check if it looks like a single phrase (has text fields directly)
                if (phrases.text_sv !== undefined || phrases.text_en !== undefined || phrases.text_uk !== undefined) {
                     // It's a single phrase object
                     processPhrase(phrases, null);
                } else if (phrases['0'] && (phrases['0'].text_sv !== undefined || phrases['0'].text_en !== undefined)) {
                     // DETECTED BAD STRUCTURE: Parent lacks fields, but child '0' has them.
                     // Promote '0' content to root by passing null index. 
                     // Next save will overwrite parent with this content, fixing the structure.
                     console.warn(`[Load_DB3] Detected nested '0' for ${fileKey}, promoting to root.`);
                     processPhrase(phrases['0'], null);
                } else {
                    // Handle object-based arrays (Firebase sparse arrays) or map of phrases
                    for (const key in phrases) {
                        processPhrase(phrases[key], key);
                    }
                }
            }
        }
    }
    console.log(`[Load_DB3] Loaded ${gv.sts.audio_phrases.length} phrases for part ${partKey}`);
};


function Update_And_Save_Audio_Phrase_ItemByIndex(item_data, itemindex) {  
  let rows_audio_phrases = gv.sts.audio_phrases;
  if (!rows_audio_phrases || !Array.isArray(rows_audio_phrases)) return;
  
  if (itemindex !== -1 && itemindex < rows_audio_phrases.length) {
      const originalItem = rows_audio_phrases[itemindex];
      
      // Merge new data into original item to keep metadata
      Object.assign(originalItem, item_data);

      // Save to DB3
      if (originalItem._lesson_key && originalItem._file_key && originalItem._index !== undefined) {
          SaveToFB_DB3(originalItem._lesson_key, originalItem._file_key, originalItem._index, item_data);
      } else {
          console.error("Missing metadata for saving item", originalItem);
      }
  }  
}

function SaveToFB_DB3(lessonKey, fileKey, index, item_data) {
    // Construct path: ../data_base3/text_trans_phrases/{lessonKey}/{fileKey}/{index}
    // lessonKey here is actually the partKey (e.g., parttxt_1)
    
    // Clean the object to be saved
    // We want to save: text_sv, text_en (or target), start, end, intervals_id, datetimetrans
    const dataToSave = {};
    
    // Fields to explicitly save
    const fieldsToSave = ['text_sv', 'text_en', 'text_uk', 'start', 'end', 'intervals_id', 'datetimetrans'];
    
    fieldsToSave.forEach(field => {
        if (item_data[field] !== undefined) {
            dataToSave[field] = item_data[field];
        }
    });

    // Use lessonKey (which is partKey) for the save path
    let addurl = `../data_base3/text_trans_phrases/${lessonKey}/${fileKey}`;
    if (index !== null) {
        addurl += `/${index}`;
    }
    let ObjRequest = gv.URL_DS.GetObjForRequest();
    ObjRequest.vobj = dataToSave;
    ObjRequest.ametod = 'PUT';
    ObjRequest.addUrl = addurl;      
    ObjRequest.CallBackFunction = function(vdata, ametod) {        
        console.log("Saved to DB3 (trans) part:", vdata);
    };
    gv.URL_DS.requestData_By_URL_Path(ObjRequest);
}


////////////////////////////////////////////////////////////////////////////

async function Get_All_Tables_Meta() {  
  // Deprecated for data_base3, but kept for compatibility if needed
  // const addurl = "tables_meta";
  // const vdata = await requestByPath(addurl, 'GET');
  // gv.sts.tables_meta = vdata || [];  
}

function Get_IndexOf_Table_By_Name(table_name) {  
  // Deprecated
  return -1;
}


