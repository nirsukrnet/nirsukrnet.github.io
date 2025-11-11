var gv = {
  cst: {
    FBSets: null,
    config_phrase: null,
    SaveBasicUrl: 'root_data_base'
  },
  sts: {
    vdata1: null
  }
};


// Function to handle control Phrase text click END


function MainFunc() {  
  init().then(() => {
    console.log("Initialization complete.");
  }).catch(error => {
    console.error("Error during initialization:", error);
  });
}

async function init() {    
  const pltf = navigator.platform + '/root_data_base';
  gv.cst.FBSets = Init_LoginFireBaseSets(pltf);
  await this.LoginFireBase(gv.cst);
}

function get_config_firebaseConfig() {
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: "AIzaSyD_-Ne2ntzw8qOvPXH5Ic580LDkWa6L064",
        authDomain: "nirsix-eng-other.firebaseapp.com",
        databaseURL: "https://nirsix-eng-other-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "nirsix-eng-other",
        storageBucket: "nirsix-eng-other.firebasestorage.app",
        messagingSenderId: "453902617198",
        appId: "1:453902617198:web:e26a7204e380c2d73cf47f",
        measurementId: "G-99W2GK1G8V"
    };
    return firebaseConfig;
}

function Init_LoginFireBaseSets(dataset1){
    const fbConfig = get_config_firebaseConfig();
    const apiKey1 = fbConfig.apiKey;
    if (!dataset1) {
      dataset1 = "root_data_base";
    }
    // Normalize dataset and build dataset1_json safely
    if (dataset1.startsWith('/')) dataset1 = dataset1.substring(1);
    if (dataset1.endsWith('/')) dataset1 = dataset1.slice(0, -1);
    let dataset1_json = dataset1.endsWith('.json') ? dataset1 : (dataset1 + '.json');

    let oj = {
      email:"saps1@nukr.net",
      password:"B0u_1hg81apAqw",
      UrlTrans1: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey1}`,
      UrlPost1: `https://nirsix-eng-other-default-rtdb.europe-west1.firebasedatabase.app/${dataset1_json}?auth=`,
      DataSet_Basic: `${dataset1}`,
      platform: navigator.platform,
    };
    return oj;
}

async function LoginFireBase(cst1) {
  const FBSets = cst1.FBSets;
  const email = FBSets.email;
  const password = FBSets.password;
  const aUrlTrans1 = FBSets.UrlTrans1;
  const body1 = JSON.stringify({ email, password, returnSecureToken: true });
  const post_obj = {
    method: 'post',
    body: body1,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const response = await fetch(aUrlTrans1, post_obj);
  const vdata = await response.json();
  if (!response.ok || !vdata || !vdata.idToken) {
    const msg = (vdata && (vdata.error && vdata.error.message)) ? vdata.error.message : `HTTP ${response.status}`;
    throw new Error(`Firebase auth failed: ${msg}`);
  }
  FBSets.idToken = vdata.idToken;
  FBSets.refreshToken = vdata.refreshToken;
  FBSets.localId = vdata.localId;
  await this.CallBackLoginFireBase();
}

async function CallBackLoginFireBase() {
  let arr1 = null;
  await RequestArrFireBase(arr1, 'GET');
}


async function RequestArrFireBase(vobj, ametod) {
  let cst1 = window.gv && window.gv.cst ? window.gv.cst : (this.gv ? this.gv.cst : null);
  if (!cst1 || !cst1.FBSets || !cst1.FBSets.idToken) {
    throw new Error('Not authenticated: idToken is missing.');
  }
    let jsn1 = "";
    let post_obj = null;
    if (vobj != null) {
        jsn1 = JSON.stringify(vobj);
        post_obj = {
            method: ametod,
            body: jsn1,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
  let aurl = cst1.FBSets.UrlPost1 + cst1.FBSets.idToken;
    const response = await fetch(aurl, post_obj);
    let vdata = await response.json();
    if (ametod == 'GET') {
        if (typeof CB_AfterGet === 'function') {
            await CB_AfterGet(vdata);
        }
    }
    if (ametod == 'PATCH') {
        if (typeof CB_AfterPatch === 'function') {
            await CB_AfterPatch(vdata);
        }
    }
}


function GetObjForRequest() {
    let ObjRequest = {    
        vobj: null,
        ametod: null,
        addUrl: null,
        CallBackFunction: null
    };
    return ObjRequest;
}

function GetUrlPathWithAddUrl(addUrl) {
  let cst1 = window.gv && window.gv.cst ? window.gv.cst : (this.gv ? this.gv.cst : null);
  const DS_Basic1 = cst1.FBSets.DataSet_Basic;

  // Normalize the extra path segment
  let part = '';
  if (addUrl) {
    part = String(addUrl).replace(/^\/+/, '').replace(/\/+$/, '');
  }

  // If no part provided, return dataset root URL
  if (!part) {
    return GetUrlForDataSetBasicRoot();
  }

  // Build URL: no trailing slash after .json
  const base = `https://nirsix-eng-other-default-rtdb.europe-west1.firebasedatabase.app/${DS_Basic1}/${part}.json?auth=`;
  return base + cst1.FBSets.idToken;
}

// Build URL to the root of the current DataSet_Basic (…/<DataSet_Basic>.json?auth=<token>)
function GetUrlForDataSetBasicRoot() {
  let cst1 = window.gv && window.gv.cst ? window.gv.cst : (this.gv ? this.gv.cst : null);
  const DS_Basic1 = cst1.FBSets.DataSet_Basic;
  const base = `https://nirsix-eng-other-default-rtdb.europe-west1.firebasedatabase.app/${DS_Basic1}.json?auth=`;
  return base + cst1.FBSets.idToken;
}



//async function RequestArrFireBase_AddUrl(vobj, ametod, addUrl) {
async function RequestArrFireBase_AddUrl(ObjRequest) {
    let { vobj, ametod, addUrl } = ObjRequest;
  let cst1 = window.gv && window.gv.cst ? window.gv.cst : (this.gv ? this.gv.cst : null);
  if (!cst1 || !cst1.FBSets || !cst1.FBSets.idToken) {
    throw new Error('Not authenticated: idToken is missing.');
  }

    let jsn1 = "";
    let post_obj = null;
    if (vobj != null) {
        jsn1 = JSON.stringify(vobj);
        post_obj = {
            method: ametod,
            body: jsn1,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
  let aurl = (ObjRequest && ObjRequest.useBasicRoot)
    ? GetUrlForDataSetBasicRoot()
    : GetUrlPathWithAddUrl(addUrl);
    const response = await fetch(aurl, post_obj);
    let vdata = await response.json();
    let CallBackFunction = ObjRequest.CallBackFunction;
    if (CallBackFunction && typeof CallBackFunction === 'function') {
        await CallBackFunction(vdata, ametod);
    }
    // if (ametod == 'GET') {
    //     if (typeof CB_AfterGet_URL === 'function') {
    //         await CB_AfterGet_URL(vdata, ametod);
    //     }
    // }
    // if (ametod == 'PATCH') {
    //     if (typeof CB_AfterPatch_URL === 'function') {
    //         await CB_AfterPatch_URL(vdata, ametod);
    //     }
    // }
}

async function CB_AfterPatch_URL(vdata, ametod) {
 //   AfterRequest_FireBase();
 if (vdata) {
   console.log("updated");
   console.log(vdata);
 }
}

async function CB_AfterGet_URL(vdata, ametod) {
 //   AfterRequest_FireBase();
}


async function CB_AfterGet(vdata) {
   Update_StateData(vdata);
   AfterRequest_FireBase();
}

async function CB_AfterPatch(vdata) {
   Update_StateData(vdata);    
   AfterRequest_FireBase();
}


function AfterRequest_FireBase() {    

}


function SetDBCurProgramType(programType) {  
  gv.sts.config_phrase.CurProgramType = programType;
  SetDBConfigPhrase(gv.sts.config_phrase);
}

function SetDBCurArticleText(cur_idarticle_text) {  
  gv.sts.config_phrase.cur_idarticle_text = cur_idarticle_text;
  SetDBConfigPhrase(gv.sts.config_phrase);
}

function SetDBConfigPhrase(configPhrase) {
  gv.sts.config_phrase = configPhrase;
  let vdata = gv.vdata1;
  if (!vdata) return;
  vdata["config_phrase"] = configPhrase;
  RequestArrFireBase(vdata, 'PATCH');
}

function Update_StateData(vdata) {
    if (!vdata) return;
    let sts1 = gv.sts;
    sts1.sentences = vdata["sentences"];
    sts1.phrases = vdata["phrases"];
    sts1.article_text = vdata["article_text"];
    sts1.config_phrase = vdata["config_phrase"];
    sts1.collect_new_words = vdata["collect_new_words"];
    sts1.device_info = vdata["device_info"];
    sts1.sentences_for_processing = null;        
    gv.vdata1 = vdata;    
    Save_DeviceInfo_ToFB();
    All_Configs_IfNotExists_CreateAndSaveDefault();
}

function Click_Main_SaveAllBase() {
    return;
    let vdata = gv.data1;
    if (!vdata) return;
    let datetime1 = new Date().toISOString();
    datetime1 = datetime1.replace(/[-:T]/g, '').slice(0, 15); // Format datetime to YYYYMMDDHHMMSS
    Init_LoginFireBaseSets('text_phrase_obj'+datetime1);
}


function Main_Backup_Text_Phrase_Obj_WithTS(){
  let vdata = gv.vdata1;
  if (!vdata) return;
  let datetime1 = get_nowBackUp_n19_datefromat_fb();
  let addUrl = `text_phrase_obj_${datetime1}`;
  //let addUrl = `text_phrase_obj`;
  let ObjRequest = GetObjForRequest();
  ObjRequest.vobj = vdata;
  ObjRequest.ametod = 'PATCH';
  ObjRequest.addUrl = addUrl;  
  let pltf = 'backups_all_big/'+navigator.platform;
  gv.cst.FBSets.DataSet_Basic = `${pltf}`;
  ObjRequest.CallBackFunction = function(vdata, ametod) {
     gv.cst.FBSets.DataSet_Basic = gv.cst.SaveBasicUrl;  
  };
  RequestArrFireBase_AddUrl(ObjRequest);
  console.log("Backup Text Phrase Object with timestamp: " + datetime1);
  alert("Backup Text Phrase Object with timestamp: " + datetime1);
}

function Save_DeviceInfo_ToFB() {
  let deviceInfo  = gv.sts.device_info;
  let deviceInfo_item = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  };
  if (!deviceInfo) {
    deviceInfo = [];
  }
  if (!Array.isArray(deviceInfo)) {
    deviceInfo = [];
  }
  if (IfExists_DeviceInfo_Item(deviceInfo_item)) {
    console.log("Device info already exists.");
    return;
  }
  deviceInfo.push(deviceInfo_item);
  gv.sts.device_info = deviceInfo;
  let addurl = 'device_info';
  let ObjRequest = GetObjForRequest();
  ObjRequest.vobj = deviceInfo;
  ObjRequest.ametod = 'PUT';
  ObjRequest.addUrl = addurl;      
  ObjRequest.CallBackFunction = function(vdata, ametod) {        
  };
  RequestArrFireBase_AddUrl(ObjRequest);    
}

function IfExists_DeviceInfo_Item(deviceInfo_item) {
  let deviceInfo = gv.sts.device_info;
  if (!deviceInfo) {
    return false;
  }
  if (!Array.isArray(deviceInfo)) {
    return false;
  }
  if (deviceInfo.length === 0) {
    return false;
  }
  for (let i = 0; i < deviceInfo.length; i++) {
    let item = deviceInfo[i];
    if (item.userAgent === deviceInfo_item.userAgent && item.platform === deviceInfo_item.platform) {
      return true;
    }
  }
  return false;
}


function All_Configs_IfNotExists_CreateAndSaveDefault() {
  // Ensure the root config object exists to avoid null deref
  if (!gv.sts.config_phrase) {
    gv.sts.config_phrase = {};
  }
  Cnf_Phr_New_IfNotExists_CreateAndSaveDefault();
}

function Cnf_Phr_New_IfNotExists_CreateAndSaveDefault() {
  if (!gv.sts.config_phrase) gv.sts.config_phrase = {};
  let cnf_phr_new = gv.sts.config_phrase.phr_new;
    if (!cnf_phr_new) {
        cnf_phr_new = {
            speech_phrase_after_adding: true,
            filter_marked_sent: false
        };
        gv.sts.config_phrase.phr_new = cnf_phr_new;
    }
    save_config_phr_new_all(cnf_phr_new);
}

function save_config_phr_new_all(cnf_phr_new){
    gv.sts.config_phrase.phr_new = cnf_phr_new;
    let addurl = "config_phrase/phr_new";
    let ObjRequest = GetObjForRequest();
    ObjRequest.addUrl = addurl;
    ObjRequest.ametod = 'PUT';
    ObjRequest.vobj = cnf_phr_new; // Use the item found above
    RequestArrFireBase_AddUrl(ObjRequest);
}

/**
 * Create the root_data_base structure in Firebase.
 * By default writes to "/root_data_base" at the database root.
 * Pass { forPlatform: true } to create it under "/<platform>/root_data_base".
 *
 * Example:
 *   await create_database_root();
 *   await create_database_root({ forPlatform: true });
 */
async function create_database_root(options) {
  const opts = options || {};
  const token = gv && gv.cst && gv.cst.FBSets ? gv.cst.FBSets.idToken : null;
  if (!token) {
    throw new Error('Not authenticated. Call init()/LoginFireBase() first to obtain idToken.');
  }

  const payload = {
    database_1: {},
    database_2: {},
    database_3: {}
  };

  // Temporarily switch DataSet_Basic to desired scope, then restore after request
  const prevDS = gv.cst.FBSets.DataSet_Basic;
  try {
    if (opts.forPlatform) {
      gv.cst.FBSets.DataSet_Basic = `${navigator.platform}/${gv.cst.SaveBasicUrl || 'root_data_base'}`;
    } else {
      gv.cst.FBSets.DataSet_Basic = gv.cst.SaveBasicUrl || 'root_data_base';
    }

    const ObjRequest = GetObjForRequest();
    ObjRequest.vobj = payload;
    ObjRequest.ametod = 'PUT';
    ObjRequest.addUrl = null; // not used when useBasicRoot = true
    ObjRequest.useBasicRoot = true; // write to <DataSet_Basic>.json

    const result = await new Promise((resolve, reject) => {
      ObjRequest.CallBackFunction = function(vdata, ametod) {
        resolve(vdata || payload);
      };
      RequestArrFireBase_AddUrl(ObjRequest).catch(reject);
    });
    return result;
  } finally {
    gv.cst.FBSets.DataSet_Basic = prevDS;
  }
}

// Expose for callers in browser context
if (typeof window !== 'undefined') {
  window.create_database_root = create_database_root;
}

// Ensure the dataset root exists; create it if missing (no overwrite)
async function EnsureRootDatabaseExists(forPlatform) {
  // If not authenticated, skip and let caller handle login first
  if (!gv || !gv.cst || !gv.cst.FBSets || !gv.cst.FBSets.idToken) {
    throw new Error('EnsureRootDatabaseExists called without idToken');
  }
  const exists = await new Promise((resolve, reject) => {
    const ObjRequest = GetObjForRequest();
    ObjRequest.vobj = null;
    ObjRequest.ametod = 'GET';
    ObjRequest.addUrl = null;
    ObjRequest.useBasicRoot = true;
    ObjRequest.CallBackFunction = function(vdata) {
      resolve(vdata !== null);
    };
    RequestArrFireBase_AddUrl(ObjRequest).catch(reject);
  });
  if (!exists) {
    await create_database_root({ forPlatform: !!forPlatform });
  }
}