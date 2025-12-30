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

// ------------------------------
// settingsData helpers (Firebase)
// ------------------------------
// Store per-app last selected lesson id under:
// data_base3/settings/default_user/settingsData/lastLessonId/{Owner}
function normalizeLessonKeyString(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (!s) return '';
  // Normalize legacy values like "lesson_01" -> "lesson_1".
  const m = /^lesson_0*(\d+)$/i.exec(s);
  if (m) return `lesson_${Number(m[1])}`;
  return s;
}

window.Save_To_FBDB_Current_Lesson = window.Save_To_FBDB_Current_Lesson || async function(Lesson_ID, Owner) {
  try {
    const owner = (Owner == null) ? '' : String(Owner).trim();
    if (!owner) {
      console.warn('[settings] Save_To_FBDB_Current_Lesson: missing Owner');
      return null;
    }

    const lessonIdStr = normalizeLessonKeyString(Lesson_ID);
    const rootPath = `../data_base3/settings/default_user/settingsData/lastLessonId`;

    let current = null;
    try {
      current = await requestByPath(rootPath, 'GET');
    } catch {
      current = null;
    }

    let nextObj = null;
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      nextObj = { ...current };
    } else if (current !== null && current !== undefined && current !== '') {
      const legacy = normalizeLessonKeyString(current);
      nextObj = { mp3_playing: legacy, trans_block: legacy };
    } else {
      nextObj = {};
    }

    nextObj[owner] = lessonIdStr;
    return await requestByPath(rootPath, 'PUT', nextObj);
  } catch (e) {
    console.warn('[settings] Save_To_FBDB_Current_Lesson failed', e);
    return null;
  }
};

window.Load_From_FBDB_Current_Lesson = window.Load_From_FBDB_Current_Lesson || async function(Owner) {
  try {
    const owner = (Owner == null) ? '' : String(Owner).trim();
    if (!owner) return null;
    const rootPath = `../data_base3/settings/default_user/settingsData/lastLessonId`;

    const v = await requestByPath(rootPath, 'GET');
    if (v === null || v === undefined) return null;

    // New shape: object keyed by owner.
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const vv = v[owner];
      if (vv === null || vv === undefined) return null;
      return normalizeLessonKeyString(vv);
    }

    // Legacy shape: primitive string/number. Auto-migrate.
    const legacy = normalizeLessonKeyString(v);
    if (legacy) {
      try {
        const migrated = { mp3_playing: legacy, trans_block: legacy };
        await requestByPath(rootPath, 'PUT', migrated);
      } catch (e) {
        console.warn('[settings] Load_From_FBDB_Current_Lesson migration PUT failed', e);
      }
    }
    return legacy;
  } catch (e) {
    console.warn('[settings] Load_From_FBDB_Current_Lesson failed', e);
    return null;
  }
};

// ------------------------------
// text_trans_phrases helpers (service_test)
// ------------------------------
function getPhraseTextId(phrase) {
  if (!phrase || typeof phrase !== 'object') return '';
  const raw = phrase.text_id ?? phrase.d_uuid ?? phrase.textId ?? phrase.textID;
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

function parseTextId(textId) {
  if (!textId || typeof textId !== 'string') return null;
  const tid = textId.trim();
  if (!tid) return null;
  const parts = tid.split('_');
  if (parts.length < 3) return null;
  return {
    partid: parts[0] + '_' + parts[1],
    txtid: parts.slice(2).join('_')
  };
}

window._db3_text_trans_part_cache = window._db3_text_trans_part_cache || new Map();

async function loadPartCached(partid) {
  try {
    const cache = window._db3_text_trans_part_cache;
    if (cache && cache.has(partid)) return cache.get(partid);
    if (typeof window.Load_DB3_Part_Phrases !== 'function') return null;
    const partDB = await window.Load_DB3_Part_Phrases(partid);
    if (cache && partDB && typeof partDB === 'object') cache.set(partid, partDB);
    return partDB;
  } catch (e) {
    console.warn('[Load_DB3] loadPartCached failed for', partid, e);
    return null;
  }
}

async function buildTextTransMapFromLessonPhrases(phrases) {
  const list = Array.isArray(phrases) ? phrases : [];
  const ids = new Set();
  for (const p of list) {
    const id = getPhraseTextId(p);
    if (id) ids.add(id);
  }
  if (ids.size === 0) {
    console.warn('[Load_DB3] No phrase.text_id found; cannot join text_trans_phrases. Example phrase:', list && list[0]);
  }

  const byPart = new Map();
  for (const id of ids) {
    const parsed = parseTextId(id);
    if (!parsed) continue;
    if (!byPart.has(parsed.partid)) byPart.set(parsed.partid, []);
    byPart.get(parsed.partid).push({ fullId: id, txtid: parsed.txtid });
  }

  const map = {};
  for (const [partid, arr] of byPart.entries()) {
    const partDB = await loadPartCached(partid);
    const partObj = (partDB && typeof partDB === 'object') ? partDB : {};
    if (!partDB) console.warn('[Load_DB3] text_trans part missing:', partid);
    for (const it of arr) {
      const row = partObj[it.txtid];
      if (row && typeof row === 'object') map[it.fullId] = row;
    }
  }
  return map;
}

function applyTextTranslationsToPhrases(phrases, transMap) {
  const list = Array.isArray(phrases) ? phrases : [];
  const map = (transMap && typeof transMap === 'object') ? transMap : {};
  let applied = 0;
  let missingTextId = 0;
  let invalidFormat = 0;
  const re = /^parttxt_\d+_txt\d+$/;

  for (const p of list) {
    const idRaw = getPhraseTextId(p);
    if (!idRaw) { missingTextId++; continue; }
    if (p && typeof p === 'object' && typeof p.text_id === 'string' && p.text_id !== idRaw) p.text_id = idRaw;
    if (!re.test(idRaw)) { invalidFormat++; continue; }
    const row = map[idRaw];
    if (!row) continue;
    const sourceSv = p.text_sv;
    Object.assign(p, row);
    if (sourceSv !== undefined) p.text_sv = sourceSv;
    applied++;
  }

  if (missingTextId > 0 || invalidFormat > 0) {
    console.warn('[Load_DB3] text_id validation:', { total: list.length, missingTextId, invalidFormat });
  }
  return applied;
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
    const lessonsData = await requestByPath('../data_base3/ref_lessons_audio_phrases', 'GET');
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
    console.log(`[Load_DB3] Loading phrases for lessonId: ${lessonId}`);
    if (!lessonId) return;
    
    // Find lessonKey
    let lessonKey = null;
    if (gv.sts.lessons_audio_phrases) {
        // Handle array or object (dictionary)
        let list = [];
        if (Array.isArray(gv.sts.lessons_audio_phrases)) {
            list = gv.sts.lessons_audio_phrases;
        } else if (typeof gv.sts.lessons_audio_phrases === 'object') {
            list = Object.values(gv.sts.lessons_audio_phrases);
        }
        console.log(`[Load_DB3] Searching in lessons list (len=${list.length})`);

        const lessonObj = list.find(l => l && String(l.rec_id) === String(lessonId));
        if (lessonObj) {
            lessonKey = lessonObj.json_key_item;
            console.log(`[Load_DB3] Found lessonKey: ${lessonKey}`);
        } else {
            console.warn(`[Load_DB3] Lesson object not found for id ${lessonId}`);
        }
    } else {
        console.warn('[Load_DB3] gv.sts.lessons_audio_phrases is missing/empty');
    }
    
    if (!lessonKey) {
        console.warn(`Lesson key not found for id ${lessonId}`);
        return;
    }

    // Fetch phrases for this lesson
    console.log(`[Load_DB3] Fetching phrases from ../data_base3/audio_phrases/${lessonKey}`);
    const lessonPhrases = await requestByPath(`../data_base3/audio_phrases/${lessonKey}`, 'GET');
    console.log(`[Load_DB3] Fetched phrases raw:`, lessonPhrases);
    console.log(`[Load_DB3] Fetched phrases keys:`, lessonPhrases ? Object.keys(lessonPhrases) : 'null');
    
    if (lessonPhrases) {
        const fileKey = Object.keys(lessonPhrases)[0]; // Assuming one file per lesson
        if (fileKey && gv.sts.ref_mp3_files) {
             // Handle array or object for ref_mp3_files
            let mp3List = [];
            if (Array.isArray(gv.sts.ref_mp3_files)) {
                mp3List = gv.sts.ref_mp3_files;
            } else if (typeof gv.sts.ref_mp3_files === 'object') {
                mp3List = Object.values(gv.sts.ref_mp3_files);
            }

            const fileMeta = mp3List.find(f => f && f.json_key_item === fileKey);
            if (fileMeta) {
                // Use url_path from Firebase if available and valid, otherwise fallback to local phrase_audio/filename
                const audioUrl = (fileMeta.url_path && fileMeta.url_path.trim()) 
                                ? fileMeta.url_path 
                                : `phrase_audio/${fileMeta.file_name}`;

                console.log(`[Load_DB3] Initializing audio controller with: ${audioUrl}`);
                if (window._oapAudioController && typeof window._oapAudioController.init === 'function') {
                    window._oapAudioController.init(audioUrl);
                }
            } else {
                 console.warn(`[Load_DB3] No file metadata found for fileKey: ${fileKey}`);
            }
        }
    }

    // Flatten into gv.sts.audio_phrases (replacing previous content)
    gv.sts.audio_phrases = [];
    
    if (lessonPhrases) {
        for (const fileKey in lessonPhrases) {
            const phrases = lessonPhrases[fileKey];
            console.log(`[Load_DB3] Processing fileKey: ${fileKey}, isArray: ${Array.isArray(phrases)}, length: ${phrases ? phrases.length : 0}`);
            if (Array.isArray(phrases)) {
                phrases.forEach((phrase, index) => {
                    if (phrase) {
                        // Capture source text_sv
                        const sourceSv = phrase.text_sv;

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

              // New translations source: text_trans_phrases (parts-based) via phrase.text_id
              try {
                const map = await buildTextTransMapFromLessonPhrases(gv.sts.audio_phrases);
                const appliedCount = applyTextTranslationsToPhrases(gv.sts.audio_phrases, map);
                console.log('[Load_DB3] Applied text_trans_phrases translations:', appliedCount);
                if (appliedCount === 0 && gv.sts.audio_phrases && gv.sts.audio_phrases.length) {
                  console.warn('[Load_DB3] No translations applied from text_trans_phrases. Check text_id format and DB path.');
                }
              } catch (e) {
                console.warn('[Load_DB3] Applying text_trans_phrases translations failed', e);
              }

    console.log(`[Load_DB3] Loaded ${gv.sts.audio_phrases.length} phrases for lesson ${lessonId}`);
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

// Load Part by Keypart
window.Load_DB3_Part_Phrases = async function(Key_Parts) {
   const PartTxt = await requestByPath(`../data_base3/text_trans_phrases/${Key_Parts}`, 'GET');
   return PartTxt;
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


