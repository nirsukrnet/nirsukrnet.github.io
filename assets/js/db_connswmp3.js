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
    const lessonsData = await requestByPath('../data_base3/lessons_audio_phrases', 'GET');
    gv.sts.lessons_audio_phrases = lessonsData || [];

    // Fetch mp3 files metadata (if needed, but maybe not strictly for phrases list if we iterate audio_phrases)
    const mp3FilesData = await requestByPath('../data_base3/ref_mp3_files', 'GET');
    gv.sts.ref_mp3_files = mp3FilesData || [];

    // Initialize empty audio_phrases
    gv.sts.audio_phrases = [];
    
    // If a lesson is already selected, load it
    if (gv.sts.selected_lesson_id) {
        await Load_DB3_Lesson_Phrases(gv.sts.selected_lesson_id);
    }
}

// Load phrases for a specific lesson
window.Load_DB3_Lesson_Phrases = async function(lessonId) {
    if (!lessonId) return;
    
    // Find lessonKey
    let lessonKey = null;
    if (gv.sts.lessons_audio_phrases) {
        // Handle array with potential nulls
        const lessonObj = Array.isArray(gv.sts.lessons_audio_phrases) 
            ? gv.sts.lessons_audio_phrases.find(l => l && String(l.rec_id) === String(lessonId))
            : null;
        if (lessonObj) lessonKey = lessonObj.json_key_item;
    }
    
    if (!lessonKey) {
        console.warn(`Lesson key not found for id ${lessonId}`);
        return;
    }

    // Fetch phrases for this lesson
    const lessonPhrases = await requestByPath(`../data_base3/audio_phrases/${lessonKey}`, 'GET');
    
    // Fetch translations for this lesson
    let lessonTransPhrases = null;
    try {
        lessonTransPhrases = await requestByPath(`../data_base3/audio_trans_phrases/${lessonKey}`, 'GET');
    } catch (e) {
        console.warn(`[Load_DB3] Translation fetch failed for ${lessonKey} (or none exist)`, e);
    }
    
    // Flatten into gv.sts.audio_phrases (replacing previous content)
    gv.sts.audio_phrases = [];
    
    if (lessonPhrases) {
        for (const fileKey in lessonPhrases) {
            const phrases = lessonPhrases[fileKey];
            const transPhrases = (lessonTransPhrases && lessonTransPhrases[fileKey]) ? lessonTransPhrases[fileKey] : [];

            if (Array.isArray(phrases)) {
                phrases.forEach((phrase, index) => {
                    if (phrase) {
                        // Capture source text_sv
                        const sourceSv = phrase.text_sv;

                        // Clear translation fields from source to ensure we only rely on audio_trans_phrases
                        phrase.text_en = '';
                        phrase.text_uk = '';
                        phrase.datetimetrans = '';

                        // Merge translation if available
                        if (transPhrases[index]) {
                            Object.assign(phrase, transPhrases[index]);
                        }

                        // Restore source text_sv to ensure consistency with audio_phrases
                        if (sourceSv !== undefined) {
                            phrase.text_sv = sourceSv;
                        }

                        // Add metadata for saving back
                        phrase._lesson_key = lessonKey;
                        phrase._file_key = fileKey;
                        phrase._index = index;
                        phrase.lesson_id = lessonId; // For filtering
                        gv.sts.audio_phrases.push(phrase);
                    }
                });
            }
        }
    }
    console.log(`Loaded ${gv.sts.audio_phrases.length} phrases for lesson ${lessonId}`);
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
    // Construct path: ../data_base3/audio_trans_phrases/{lessonKey}/{fileKey}/{index}
    
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

    let addurl = `../data_base3/audio_trans_phrases/${lessonKey}/${fileKey}/${index}`;
    let ObjRequest = gv.URL_DS.GetObjForRequest();
    ObjRequest.vobj = dataToSave;
    ObjRequest.ametod = 'PUT';
    ObjRequest.addUrl = addurl;      
    ObjRequest.CallBackFunction = function(vdata, ametod) {        
        console.log("Saved to DB3 (trans):", vdata);
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


