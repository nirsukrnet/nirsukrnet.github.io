(function(){
  'use strict';

  const ROOT_PATH = (function() {
    const gv = ensureGv();
    return gv.cst.getcst('DB_CONST_COLLECTION_WORDS');
  })();

  function nowIso() {
    try { return new Date().toISOString(); } catch { return String(Date.now()); }
  }

  function ensureGv() {
    if (window.gv && window.gv.URL_DS && window.gv.cst && typeof window.gv.cst.getcst === 'function') return window.gv;
    const GVClass = (typeof GlobalVars === 'function')
      ? GlobalVars
      : (typeof globalThis !== 'undefined' && typeof globalThis.GlobalVars === 'function')
        ? globalThis.GlobalVars
        : (typeof window.GlobalVars === 'function')
          ? window.GlobalVars
          : null;

    if (GVClass) {
      const gv = new GVClass();
      window.gv = gv;
      return gv;
    }
    throw new Error('CollectionWordsStore: GlobalVars is not available');
  }

  async function ensureSignedIn() {
    const gv = ensureGv();
    if (gv.URL_DS && gv.URL_DS.idToken) return;
    if (typeof gv.SignIn_User !== 'function') throw new Error('CollectionWordsStore: gv.SignIn_User missing');
    await gv.SignIn_User();
  }

  function requestByPath(addurl, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      try {
        const gv = ensureGv();
        const ObjRequest = gv.URL_DS.GetObjForRequest();
        ObjRequest.addUrl = addurl;
        ObjRequest.ametod = method;
        ObjRequest.vobj = body;
        ObjRequest.CallBackFunction = function(vdata) { resolve(vdata); };
        ObjRequest.ErrorCallback = function(err) { reject(err || new Error('CollectionWordsStore request failed')); };
        gv.URL_DS.requestData_By_URL_Path(ObjRequest);
      } catch (e) {
        reject(e);
      }
    });
  }

  function cleanVideoId(videoId) {
    return (videoId == null) ? '' : String(videoId).trim();
  }

  function emptyDoc(videoId) {
    return {
      videoId: cleanVideoId(videoId),
      updatedAt: nowIso(),
      items: []
    };
  }

  async function load(videoId) {
    const vid = cleanVideoId(videoId);
    if (!vid) throw new Error('CollectionWordsStore.load: missing videoId');
    await ensureSignedIn();
    const data = await requestByPath(`${ROOT_PATH}/${vid}`, 'GET');
    if (!data || typeof data !== 'object') return emptyDoc(vid);
    if (!Array.isArray(data.items)) data.items = [];
    data.videoId = vid;
    return data;
  }

  async function save(videoId, doc) {
    const vid = cleanVideoId(videoId);
    if (!vid) throw new Error('CollectionWordsStore.save: missing videoId');
    const payload = (doc && typeof doc === 'object') ? { ...doc } : emptyDoc(vid);
    payload.videoId = vid;
    payload.updatedAt = nowIso();
    if (!Array.isArray(payload.items)) payload.items = [];
    await ensureSignedIn();
    return await requestByPath(`${ROOT_PATH}/${vid}`, 'PUT', payload);
  }

  window.CollectionWordsStore = window.CollectionWordsStore || {
    load,
    save,
    emptyDoc,
    ROOT_PATH
  };
})();
