(function(){
  'use strict';

  // Store per-video transcript here (outside data_base2 root via ../)
  const ROOT_PATH = '../db_youtube1/youtube_transcripts';

  function nowIso() {
    try { return new Date().toISOString(); } catch { return String(Date.now()); }
  }

  function ensureGv() {
    if (window.gv && window.gv.URL_DS) return window.gv;
    // Note: top-level `class GlobalVars {}` may exist as a global binding but not as `window.GlobalVars`.
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
    throw new Error('YouTubeTranscriptStore: GlobalVars is not available (load ./assets/js/global_var.js first)');
  }

  async function ensureSignedIn() {
    const gv = ensureGv();
    if (gv.URL_DS && gv.URL_DS.idToken) return;
    if (typeof gv.SignIn_User !== 'function') throw new Error('YouTubeTranscriptStore: gv.SignIn_User missing');
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
        ObjRequest.CallBackFunction = function(vdata) {
          resolve(vdata);
        };
        ObjRequest.ErrorCallback = function(err) {
          reject(err || new Error('YouTubeTranscriptStore request failed'));
        };
        gv.URL_DS.requestData_By_URL_Path(ObjRequest);
      } catch (e) {
        reject(e);
      }
    });
  }

  function cleanVideoId(videoId) {
    const v = (videoId == null) ? '' : String(videoId).trim();
    // YouTube videoId is typically [A-Za-z0-9_-]{11}
    if (!v) return '';
    return v;
  }

  async function load(videoId) {
    const vid = cleanVideoId(videoId);
    if (!vid) throw new Error('YouTubeTranscriptStore.load: missing videoId');
    await ensureSignedIn();
    return await requestByPath(`${ROOT_PATH}/${vid}`, 'GET');
  }

  async function save(videoId, items, rawText) {
    const vid = cleanVideoId(videoId);
    if (!vid) throw new Error('YouTubeTranscriptStore.save: missing videoId');

    const list = Array.isArray(items) ? items : [];
    const payload = {
      videoId: vid,
      source: 'manual',
      updatedAt: nowIso(),
      items: list
    };
    if (rawText != null && String(rawText).trim()) payload.rawText = String(rawText);

    await ensureSignedIn();
    return await requestByPath(`${ROOT_PATH}/${vid}`, 'PUT', payload);
  }

  window.YouTubeTranscriptStore = window.YouTubeTranscriptStore || {
    load,
    save,
    ROOT_PATH
  };
})();
