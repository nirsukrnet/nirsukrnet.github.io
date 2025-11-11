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
            URL_RelDatabaseRoot: 'data_base1'
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

    // ---- Firebase Storage (upload one file) ----
    getStorageBucket() {
        let b = (this.firebaseConfig && this.firebaseConfig.storageBucket) || '';
        // Normalize common misconfig: 'project.firebasestorage.app' -> 'project.appspot.com'
        if (b && /\.firebasestorage\.app$/i.test(b)) {
            b = b.replace(/\.firebasestorage\.app$/i, '.appspot.com');
        }
        return b;
    }

    getStorageBaseUrl() {
        const bucket = this.getStorageBucket();
        if (!bucket) return '';
        return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}`;
    }

    /**
     * Upload a single file (Blob/File/Uint8Array) to Firebase Storage using REST API.
     * Requires the user to be signed in (this.idToken must be set).
     *
     * @param {Blob|Uint8Array} fileBlob - the binary content (File from <input type="file"> works)
     * @param {string} storagePath - destination path in the bucket, e.g. 'phrase_audio/myclip.wav'
     * @param {string=} contentType - MIME type (falls back to fileBlob.type or 'application/octet-stream')
     * @returns {Promise<{meta: any, downloadUrl: string|null}>}
     */
    async uploadFileToStorage(fileBlob, storagePath, contentType) {
        if (!this.refreshToken) {
            throw new Error('Not authenticated: call SignIn_User() first (need refreshToken).');
        }
        const base = this.getStorageBaseUrl();
        if (!base) {
            throw new Error('Storage bucket not configured.');
        }
        if (!fileBlob) {
            throw new Error('fileBlob is required');
        }
        if (!storagePath || typeof storagePath !== 'string') {
            throw new Error('storagePath is required');
        }

        const url = `${base}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
        const ct = contentType || (fileBlob.type || 'application/octet-stream');

        // Obtain an OAuth access token (Firebase Storage REST prefers Google OAuth token, not raw idToken)
        const accessToken = await this.getAccessToken();

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': ct
            },
            body: fileBlob
        });

        if (!res.ok) {
            let txt = '';
            try { txt = await res.text(); } catch (_) {}
            throw new Error(`Storage upload failed: ${res.status} ${res.statusText} ${txt}`);
        }
        const meta = await res.json();
        const downloadUrl = this.getDownloadUrlFromMeta(meta);
        return { meta, downloadUrl };
    }

    /**
     * Construct a public download URL (requires downloadTokens in metadata and open rules or token in query).
     */
    getDownloadUrlFromMeta(meta) {
        try {
            const bucket = meta.bucket;
            const name = meta.name; // path inside bucket
            const token = (meta.downloadTokens || '').split(',')[0] || null;
            if (!bucket || !name) return null;
            const base = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(name)}`;
            return token ? `${base}?alt=media&token=${encodeURIComponent(token)}` : `${base}?alt=media`;
        } catch (e) {
            return null;
        }
    }

    /**
     * Convenience: fetch a local URL (served by your http server) and upload its bytes to Firebase Storage.
     * Example localUrl: '/Html/phrase_audio/sample.wav' or 'phrase_audio/sample.wav' relative to current page.
     * @param {string} localUrl - URL path reachable by the browser (same-origin)
     * @param {string} storagePath - destination in storage bucket, e.g. 'phrase_audio/sample.wav'
     * @param {string=} contentType - explicit MIME type; autodetects from response if not given
     */
    async uploadFileFromLocalUrl(localUrl, storagePath, contentType) {
        if (!localUrl) throw new Error('localUrl is required');
        const res = await fetch(localUrl);
        if (!res.ok) {
            throw new Error(`Failed to read localUrl: ${res.status} ${res.statusText}`);
        }
        const ct = contentType || res.headers.get('Content-Type') || undefined;
        const blob = await res.blob();
        try {
            return await this.uploadFileToStorage(blob, storagePath, ct);
        } catch (e) {
            // Likely CORS on REST path; fallback to Firebase Web SDK upload which handles CORS
            console.warn('REST upload failed, falling back to Firebase SDK upload:', e);
            return await this.uploadFileToStorageViaSdk(blob, storagePath, ct);
        }
    }

    /**
     * Fallback path: upload via Firebase Web SDK (modular) to avoid REST CORS issues.
     * Dynamically imports SDK modules from gstatic.
     */
    async uploadFileToStorageViaSdk(fileBlob, storagePath, contentType) {
        const rawCfg = this.firebaseConfig;
        if (!rawCfg) throw new Error('Missing firebaseConfig');
        const bucket = this.getStorageBucket();
        if (!bucket) throw new Error('Cannot determine storage bucket');
        // Prepare a clean config with normalized bucket
        const cfg = { ...rawCfg, storageBucket: bucket };
        // Dynamic imports of ESM modules
        const [{ initializeApp }, { getAuth, signInWithEmailAndPassword }, { getStorage, ref, uploadBytes, getDownloadURL }] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js')
        ]);
        const app = initializeApp(cfg);
        const auth = getAuth(app);
        if (!auth.currentUser) {
            await signInWithEmailAndPassword(auth, this.email, this.password);
        }
        const storage = getStorage(app, `gs://${bucket}`);
        const storageRef = ref(storage, storagePath.replace(/^\/+/, ''));
        const meta = contentType ? { contentType } : undefined;
        const snap = await uploadBytes(storageRef, fileBlob, meta);
        let downloadUrl = null;
        try {
            downloadUrl = await getDownloadURL(storageRef);
        } catch {}
        return { meta: { bucket, name: storagePath }, downloadUrl, snapshot: snap };
    }

    /**
     * Exchange refreshToken for an OAuth access_token using SecureToken service.
     * Firebase returns: access_token, expires_in, token_type (Bearer), id_token, user_id
     */
    async getAccessToken() {
        if (!this.refreshToken) {
            throw new Error('Missing refreshToken; call SignIn_User first.');
        }
        // Cache token until near expiry to avoid repeated exchanges.
        const now = Date.now();
        if (this._cachedAccess && this._cachedAccess.expiresAt > now + 30000) {
            return this._cachedAccess.token;
        }
        const url = `https://securetoken.googleapis.com/v1/token?key=${this.firebaseConfig.apiKey}`;
        const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: this.refreshToken });
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (!res.ok) {
            const txt = await safeReadText(res);
            throw new Error(`Failed to obtain access token: ${res.status} ${res.statusText} ${txt}`);
        }
        const data = await res.json();
        const accessToken = data.access_token;
        const expiresIn = parseInt(data.expires_in || '3600', 10) * 1000; // ms
        this._cachedAccess = { token: accessToken, expiresAt: Date.now() + expiresIn };
        return accessToken;
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
      content_table_name: 'content_table1',
      rows_table_content: [],
      content_tables: [],
      ...(initial.sts || {})
    };


  }

  SignIn_User() {
    return this.URL_DS.SignIn_User();
  }


  SaveToFB_Content_By_Index(IndexContent, var_item_content, content_text) {
    let addurl = "root_content/tables/0/rows"+"/"+IndexContent+"/"+var_item_content;
    let ObjRequest = this.URL_DS.GetObjForRequest();
    ObjRequest.vobj = content_text;
    ObjRequest.ametod = 'PUT';
    ObjRequest.addUrl = addurl;      
    ObjRequest.CallBackFunction = function(vdata, ametod) {        
        let contenttext_fb = vdata;
    };
    gv.URL_DS.requestData_By_URL_Path(ObjRequest);
  }

}

