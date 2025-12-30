window.Create_FB_DB3_Settings_s1 = function() {
    return; // Temporarily disabled for testing


     let UserLogin = (gv && gv.sts && gv.sts.user_login) ? gv.sts.user_login : 'default_user';
    // Construct path: ../data_base3/settings/{UserLogin}/settingsData

    let settingsData = {
        theme: 'dark',
        playbackSpeed: 1.0,
        lastLessonId: {
            mp3_playing: 'lesson_1',
            trans_block: 'lesson_1'
        }
    };    
    
    let addurl = `../data_base3/settings/${UserLogin}/settingsData`;
    let ObjRequest = gv.URL_DS.GetObjForRequest();
    ObjRequest.vobj = settingsData;
    ObjRequest.ametod = 'PUT';
    ObjRequest.addUrl = addurl;      
    ObjRequest.CallBackFunction = function(vdata, ametod) {        
        console.log("Saved to DB3 (settings):", vdata);
    };
    gv.URL_DS.requestData_By_URL_Path(ObjRequest);
}




window.TestServ_OutputLesson = async function(varoutputDiv, lessonId) {

   await window.Load_DB3_Lesson_Phrases(lessonId);

    varoutputDiv.innerHTML = 'Loading data for Lesson 1...';
                
    displayData(varoutputDiv, lessonId);


    async function displayData(varoutputDiv, lessonId) {
        const phrases = window.gv && window.gv.sts ? window.gv.sts.audio_phrases : [];
        
        if (!phrases || phrases.length === 0) {
            varoutputDiv.innerHTML = 'No phrases found for Lesson 1.';
            return;
        }

        varoutputDiv.innerHTML = `<h3>Loaded ${phrases.length} phrases items:</h3>`;
        const PartsObj = await TestServ_CollectingSetof_partjtxti(lessonId);
        const partKeys = Object.keys(PartsObj);
        varoutputDiv.innerHTML += `<p>Unique parts count: ${partKeys.length}</p>`;

        
        partKeys.forEach((partid, index) => {
            const txtIds = PartsObj[partid];
            const div = document.createElement('div');
            div.className = 'item';
            div.textContent = `${partid} - [${txtIds.join(', ')}]  -***-- ${index}`;
            varoutputDiv.appendChild(div);
        });
    }
};


window.TestServ_OutputPartsFilter = async function(varoutputDiv, lessonId) {

    await window.Load_DB3_Lesson_Phrases(lessonId);

    varoutputDiv.innerHTML = 'Loading data for Lesson 1...';
                
    displayData(varoutputDiv, lessonId);


    async function displayData(varoutputDiv, lessonId) {
        function Download_FilteredItems(FilteredItems) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(FilteredItems, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "FilteredParts_Lesson.json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        const phrases = window.gv && window.gv.sts ? window.gv.sts.audio_phrases : [];
        
        if (!phrases || phrases.length === 0) {
            varoutputDiv.innerHTML = 'No phrases found for Lesson 1.';
            return;
        }

        varoutputDiv.innerHTML = `<h3>Loaded ${phrases.length} phrases items:</h3>`;
        const PartsObj = await TestServ_CollectingSetof_partjtxti(lessonId);
        const FilteredItems = await TestServ_FilterPartsByLesson(PartsObj);
        varoutputDiv.innerHTML += `<p>Unique parts count: ${FilteredItems.length}</p>`;
        
        
        FilteredItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item-card';
            div.style.cssText = "border: 1px solid #e0e0e0; padding: 12px; margin-bottom: 10px; border-radius: 6px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;";
            
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="font-size: 16px; font-weight: 600; color: #2c3e50;">${item.text_sv || '<span style="color:#ccc">(No Swedish text)</span>'}</div>
                    <div style="font-size: 12px; color: #95a5a6; white-space: nowrap; margin-left: 10px;">#${index + 1}</div>
                </div>
                
                ${item.text_en ? `
                <div style="font-size: 14px; color: #34495e; margin-bottom: 8px; font-style: italic; border-left: 3px solid #3498db; padding-left: 8px;">
                    ${item.text_en}
                </div>` : ''}
                
                <div style="display: flex; gap: 8px; font-size: 11px; font-family: monospace; color: #7f8c8d; margin-top: 8px;">
                    <span style="background-color: #f0f2f5; padding: 2px 6px; border-radius: 4px; border: 1px solid #dcdcdc;">ID: ${item._partid}</span>
                    <span style="background-color: #e8f4f8; padding: 2px 6px; border-radius: 4px; border: 1px solid #bee3f8; color: #2b6cb0;">TXT: ${item._txtid}</span>
                </div>
            `;
            varoutputDiv.appendChild(div);
        });

        Download_FilteredItems(FilteredItems);
    }
    
};


window.TestServ_CollectingSetof_partjtxti = async function(lessonId) {
            // "text_id": "parttxt_1_txt1",
            // "text_id": "parttxt_1_txt2",
            // "text_id": "parttxt_1_txt2",
            // "text_id": "parttxt_1_txt3",
            // "text_id": "parttxt_6_txt3",
    function extractpartid(text_id) {
        // "parttxt_1_txt1" => "parttxt_1"
        // "parttxt_6_txt1" => "parttxt_6"
        const parts = text_id.split('_');
        return parts.length >= 2 ? parts[0] + '_' + parts[1] : null;
    }
    function extracttxtid(text_id) {
        // "parttxt_1_txt1" => "txt1"
        // "parttxt_6_txt3" => "txt3"
        const parts = text_id.split('_');
        return parts.length >= 2 ? parts.slice(2).join('_') : null;
    }

    await window.Load_DB3_Lesson_Phrases(lessonId);    
    const phrases = window.gv && window.gv.sts ? window.gv.sts.audio_phrases : [];
    let Set_Txt = new Set();
    phrases.forEach((item, index) => {
        if (item.text_id && !Set_Txt.has(item.text_id)) {            
            Set_Txt.add(item.text_id);            
        }
    });

    let List_Txt = [];
    
    Set_Txt.forEach((text_id, index) => {
        const partid = extractpartid(text_id);
        const txtid = extracttxtid(text_id);
        List_Txt.push({ partid, txtid });
    });

    let PartsObj = {};
    List_Txt.forEach((item) => {
        if (!PartsObj[item.partid]) {
            PartsObj[item.partid] = [];
        }
        PartsObj[item.partid].push(item.txtid);
    });

    return PartsObj;
}


window.TestServ_FilterPartsByLesson = async function(PartsObj) {
    let FilteredItems = [];
    const partKeys = Object.keys(PartsObj);

    for (const partid of partKeys) {
        const txtIds = PartsObj[partid];
        // Fetch the full part data (awaiting async call)
        const partDB = await window.Load_DB3_Part_Phrases(partid);

        if (partDB) {
            txtIds.forEach((txtid) => {
                if (partDB[txtid]) {
                    let item = partDB[txtid];
                    // Inject ids for reference
                    item._partid = partid;
                    item._txtid = txtid;
                    FilteredItems.push(item);
                }
            });
        }
    }
    return FilteredItems;
}
