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
    await Get_All_Tables_Meta();
    await Get_Rows_All_Tables();
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

async function Get_Rows_All_Tables() {
   gv.sts.audio_phrases = await Get_Rows_Of_Table("audio_phrases");
   gv.sts.lessons_audio_phrases = await Get_Rows_Of_Table("lessons_audio_phrases");
   loadContentData();
}

async function Get_Rows_Of_Table(pageIdStr) {
  const tableIndex = Get_IndexOf_Table_By_Name(pageIdStr);
  if (tableIndex === -1) {
    console.error("Table not found:", pageIdStr);
    return;
  }
  let addurl = "tables_rows/" + tableIndex + "/rows";
  const vdata = await requestByPath(addurl, 'GET'); 
  return vdata;
}

function Update_And_Save_Audio_Phrase_ItemByIndex(item_data, itemindex) {  
  let rows_audio_phrases = gv.sts.audio_phrases;
  if (!rows_audio_phrases || !Array.isArray(rows_audio_phrases)) return;
  if (itemindex !== -1) {
    const tableIndex = Get_IndexOf_Table_By_Name("audio_phrases"); 
    SaveToFB_Table_Row_Item_By_Index( tableIndex, itemindex, item_data );
  }  
}

function SaveToFB_Table_Row_Item_By_Index(TableIndex, ItemIndex, item_data) {
    let addurl = "tables_rows/"+TableIndex+"/rows"+"/"+ItemIndex;//+"/";
    let ObjRequest = gv.URL_DS.GetObjForRequest();
    ObjRequest.vobj = item_data;
    ObjRequest.ametod = 'PUT';
    ObjRequest.addUrl = addurl;      
    ObjRequest.CallBackFunction = function(vdata, ametod) {        
        let contenttext_fb = vdata;
    };
    gv.URL_DS.requestData_By_URL_Path(ObjRequest);
}


////////////////////////////////////////////////////////////////////////////

async function Get_All_Tables_Meta() {  
  const addurl = "tables_meta";
  const vdata = await requestByPath(addurl, 'GET');
  gv.sts.tables_meta = vdata || [];  
}

function Get_IndexOf_Table_By_Name(table_name) {  
  if (!gv.sts.tables_meta || !Array.isArray(gv.sts.tables_meta)) {
    return -1;
  }

  for (let i = 0; i < gv.sts.tables_meta.length; i++) {
    if (gv.sts.tables_meta[i].name === table_name) {
      return i;
    }
  }
  return -1;
}


