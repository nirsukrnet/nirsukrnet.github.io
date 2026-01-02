class URL_DataSet {

    constructor(initial = {}) {
       this.firebaseConfig = this.getFirebaseConfig();
       this.DataSet_RootPath = this.firebaseConfig.URL_RelDatabaseRoot;
       this.Url_identity =  this.firebaseConfig.URL_identity + this.firebaseConfig.apiKey;
       this.UrlRequest = this.firebaseConfig.databaseURL + '/' + this.DataSet_RootPath;
       this.email = this.firebaseConfig.email;
       this.password = this.firebaseConfig.password;
       this.idToken = null;
       this.normalize_null_values();
    }


    getFirebaseConfig() {       
       let GCP_FirebaseConfig = {
            apiKey: "AIzaSyCh5Fs3-KtOSw5HNssAwNDLc1Z5jIiaaFU",
            authDomain: "storage-eu.firebaseapp.com",
            databaseURL: "https://storage-eu-default-rtdb.firebaseio.com",
            projectId: "storage-eu",
            storageBucket: "storage-eu.firebasestorage.app",
            messagingSenderId: "303630306461",
            appId: "1:303630306461:web:8e1f1a63d099ef9d015874",
            measurementId: "G-5TZBCESGB2"
       };

       let GCP_AdditionalConst = {
            URL_identity: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=`,
            email:"saps1@nukr.net",
            password:"B0u_1hg81apAqw",
            URL_RelDatabaseRoot: 'data_base2'
       };
        GCP_FirebaseConfig['URL_identity'] = GCP_AdditionalConst.URL_identity;
        GCP_FirebaseConfig['email'] = GCP_AdditionalConst.email;
        GCP_FirebaseConfig['password'] = GCP_AdditionalConst.password;
        GCP_FirebaseConfig['URL_RelDatabaseRoot'] = GCP_AdditionalConst.URL_RelDatabaseRoot;
        return GCP_FirebaseConfig;
    }


    normalize_null_values() {
        this.DataSet_Basic = this.DataSet_Basic || '';
        this.Url_identity = this.Url_identity || '';
        this.UrlPost1 = this.UrlPost1 || '';
        this.email = this.email || '';
        this.password = this.password || '';
        this.idToken = this.idToken || '';
    }

    fill_after_sign_in(data) {
        this.idToken = data.idToken || null;
        this.refreshToken = data.refreshToken || null;
    }

  
    async SignIn_User() {
        const email = this.email;
        const password = this.password;
        const url = this.Url_identity;

        const body = JSON.stringify({ email, password, returnSecureToken: true });

        try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: body
        });
        const data = await response.json();
        if (data.idToken) {
            this.fill_after_sign_in(data);
            return data;
        } else {
            throw new Error('Sign-in failed');
        }
        } catch (error) {
        console.error('Error signing in:', error);
        throw error;
        }
    }


    GetObjForRequest() {
        let ObjRequest = {    
            vobj: null,
            ametod: null,
            addUrl: null,
            CallBackFunction: null
        };
        return ObjRequest;
    }


    async requestData_By_URL_Path(objRequest) {
        const { vobj, ametod, addUrl } = objRequest;
        const CallBackFunction = objRequest.CallBackFunction;
        const ErrorCallback = objRequest.ErrorCallback;

        if (!this.idToken) {
            const err = new Error('Not authenticated: idToken is missing. Call SignIn_User() first.');
            if (ErrorCallback) return ErrorCallback(err);
            throw err;
        }

        const makeRequestInit = () => {
            if (vobj == null) return { method: ametod || 'GET' };
            return {
                method: ametod || 'POST',
                body: JSON.stringify(vobj),
                headers: { 'Content-Type': 'application/json' }
            };
        };

        const doFetch = async () => {
            const url = `${this.UrlRequest}/${addUrl}.json?auth=${this.idToken}`;
            const res = await fetch(url, makeRequestInit());
            if (!res.ok) {
                // Attempt one silent re-sign-in on 401 then retry once
                if (res.status === 401) {
                    try {
                        await this.SignIn_User();
                        const url2 = `${this.UrlRequest}/${addUrl}.json?auth=${this.idToken}`;
                        const res2 = await fetch(url2, makeRequestInit());
                        if (!res2.ok) {
                            const txt2 = await safeReadText(res2);
                            throw new Error(`DB request failed after retry: ${res2.status} ${res2.statusText} ${txt2}`);
                        }
                        return res2.json();
                    } catch (e) {
                        throw e;
                    }
                }
                const txt = await safeReadText(res);
                throw new Error(`DB request failed: ${res.status} ${res.statusText} ${txt}`);
            }
            return res.json();
        };

        try {
            const data = await doFetch();
            if (CallBackFunction) await CallBackFunction(data, ametod);
        } catch (err) {
            if (ErrorCallback) return ErrorCallback(err);
            throw err;
        }
    }

}

// Helper to safely read response body text when possible
async function safeReadText(res) {
    try { return await res.text(); } catch { return ''; }

  
}



class GlobalVars {
  constructor(initial = {}) {

    //this.firebaseConfig = this.getFirebaseConfig();    
    this.URL_DS = new URL_DataSet({});

    this.cst = {
      FBSets: null,
      ...(initial.cst || {})
    };
    this.sts = {
      vdata1: null,
            // Canonical lesson id is DB3 json_key_item like "lesson_1".
            // Keep null by default; loaders/menu will restore from Firebase or choose a default lesson.
            selected_lesson_id: null,
      tables_meta: [],
      audio_phrases: [],
      lessons_audio_phrases: [],
      ...(initial.sts || {})
    };


  }

  SignIn_User() {
    return this.URL_DS.SignIn_User();
  }


//   SaveToFB_Content_By_Index(IndexContent, var_item_content, content_text) {
//     let addurl = "root_content/tables/0/rows"+"/"+IndexContent+"/"+var_item_content;
//     let ObjRequest = this.URL_DS.GetObjForRequest();
//     ObjRequest.vobj = content_text;
//     ObjRequest.ametod = 'PUT';
//     ObjRequest.addUrl = addurl;      
//     ObjRequest.CallBackFunction = function(vdata, ametod) {        
//         let contenttext_fb = vdata;
//     };
//     gv.URL_DS.requestData_By_URL_Path(ObjRequest);
//   }

}
