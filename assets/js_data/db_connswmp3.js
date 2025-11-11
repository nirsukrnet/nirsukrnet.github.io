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
    await Get_All_Content_Tables();
    await Get_Rows_Content(GL_Settings.page_idstr);
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}


async function Get_Rows_Content(pageIdStr) {
  const tableIndex = Get_IndexOf_Content_Table_By_Name(pageIdStr);
  if (tableIndex === -1) {
    console.error("Table not found:", pageIdStr);
    return;
  }
  let addurl = "root_content/tables/" + tableIndex + "/rows";
  const vdata = await requestByPath(addurl, 'GET');
  gv.sts.rows_table_content = vdata || [];
  loadContentData();
}

function Update_And_Save_Content_UUID(d_uuid, content_text) {
  const defaultLang = GL_Settings.language || 'uk';
  let rows_table_content = gv.sts.rows_table_content;
  if (!rows_table_content || !Array.isArray(rows_table_content)) return;
  let itemFoundIndex = -1;
  let var_item_content = null;

  for (let i = 0; i < rows_table_content.length; i++) {
    let item = rows_table_content[i];
    if (item.d_uuid === d_uuid) {
      if ( defaultLang === 'uk' ) var_item_content = "content_uk";
      else if ( defaultLang === 'en' ) var_item_content = "content_en";
      else if ( defaultLang === 'sv' ) var_item_content = "content_sv";
      item[var_item_content] = content_text;
      itemFoundIndex = i;
      break;
    }
  }
  if (itemFoundIndex !== -1) {
   gv.SaveToFB_Content_By_Index(itemFoundIndex, var_item_content, content_text);
  }  
}

////////////////////////////////////////////////////////////////////////////

async function Get_All_Content_Tables() {  
  const addurl = "root_content/tables";
  const vdata = await requestByPath(addurl, 'GET');
  gv.sts.content_tables = vdata || [];  
}

function Get_IndexOf_Content_Table_By_Name(table_name) {  
  if (!gv.sts.content_tables || !Array.isArray(gv.sts.content_tables)) {
    return -1;
  }

  for (let i = 0; i < gv.sts.content_tables.length; i++) {
    if (gv.sts.content_tables[i].name === table_name) {
      return i;
    }
  }
  return -1;
}

// async function Get_All_Content_Tables() {  
//   let addurl = "root_content/tables";
//   let ObjRequest = gv.URL_DS.GetObjForRequest();
//   ObjRequest.addUrl = addurl;
//   ObjRequest.ametod = 'GET';
//   ObjRequest.vobj = null;
//   ObjRequest.CallBackFunction = function(vdata, ametod) {        
//     gv.sts.content_tables = vdata;
//   };
//   gv.URL_DS.requestData_By_URL_Path(ObjRequest);
// }


function GetTabs_Build_Content_Tables_Index() {  
  let addurl = "root_content/tables";
  let ObjRequest = gv.URL_DS.GetObjForRequest();
  ObjRequest.addUrl = addurl;
  ObjRequest.ametod = 'GET';
  ObjRequest.vobj = null;
  ObjRequest.CallBackFunction = function(vdata, ametod) {        
    gv.sts.content_tables = vdata;
    // build and store the index
    gv.sts.content_tables_index = buildContentTablesIndex(vdata);
    Save_Content_Tables_Index(gv.sts.content_tables_index);    
  };
  gv.URL_DS.requestData_By_URL_Path(ObjRequest);
}

function Save_Content_Tables_Index(content_tables_index1) {  
  let addurl = "root_content/content_tables_index";
  let ObjRequest = gv.URL_DS.GetObjForRequest();
  ObjRequest.addUrl = addurl;
  ObjRequest.ametod = 'PUT';
  ObjRequest.vobj = content_tables_index1;
  ObjRequest.CallBackFunction = function(vdata, ametod) {        
    let content_tables_index_fb = vdata;
  };
  gv.URL_DS.requestData_By_URL_Path(ObjRequest);
}


// Build a robust index: name -> first index
function buildContentTablesIndex(content_tables) {
  const idx = [];
  if (!Array.isArray(content_tables)) return idx; 
  for (let i = 0; i < content_tables.length; i++) {
    const item = content_tables[i];
    idx.push(item.name);
  }
  return idx;
}

async function handleUploadLocalFile() {
  try {
    // Ensure signed in (refresh logic is inside requestData, but we need token here too)
    if (!gv.URL_DS.idToken) {
      await gv.SignIn_User();
    }
    const localUrl = 'http://localhost:8080/phrase_audio/swday_0001_SW_Learn_Day_1-5_srt_00-00-03.240_00-00-07.120.wav';
    const storagePath = 'phrase_audio/swday_0001_SW_Learn_Day_1-5_srt_00-00-03.240_00-00-07.120.wav';
    const { meta, downloadUrl } = await gv.URL_DS.uploadFileFromLocalUrl(localUrl, storagePath);
    console.log('Upload success meta:', meta);
    console.log('Download URL:', downloadUrl);
    alert('Upload finished.');
  } catch (e) {
    console.error('Upload failed:', e);
    alert('Upload failed: ' + e.message);
  }
}

// Expose for inline onclick handlers in HTML
window.handleUploadLocalFile = handleUploadLocalFile;
  

