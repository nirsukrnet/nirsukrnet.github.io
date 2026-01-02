(function(){
  'use strict';

  // Store reference videos here (outside data_base2 root via ../)
  const ROOT_PATH = '../db_youtube2/ref_youtube_videos';

  function nowIso() {
    try { return new Date().toISOString(); } catch { return String(Date.now()); }
  }

  function ensureGv() {
    if (window.gv && window.gv.URL_DS) return window.gv;

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
    throw new Error('YouTubeRefVideosStore: GlobalVars is not available (load ./assets/js/global_var.js first)');
  }

  async function ensureSignedIn() {
    const gv = ensureGv();
    if (gv.URL_DS && gv.URL_DS.idToken) return;
    if (typeof gv.SignIn_User !== 'function') throw new Error('YouTubeRefVideosStore: gv.SignIn_User missing');
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
          reject(err || new Error('YouTubeRefVideosStore request failed'));
        };
        gv.URL_DS.requestData_By_URL_Path(ObjRequest);
      } catch (e) {
        reject(e);
      }
    });
  }

  function toBase64Url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function encodeKey(raw) {
    const s = (raw == null) ? '' : String(raw);
    if (!s) return '';
    try {
      return toBase64Url(new TextEncoder().encode(s));
    } catch {
      // Fallback for older browsers
      try {
        return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      } catch {
        return '';
      }
    }
  }

  function cleanString(x) {
    return (x == null) ? '' : String(x).trim();
  }

  function parseOrder(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 9999;
  }

  function extractVideoIdFromUrl(url) {
    const u = cleanString(url);
    if (!u) return '';
    try {
      const parsed = new URL(u);
      // youtu.be/<id>
      if (parsed.hostname.endsWith('youtu.be')) {
        const p = parsed.pathname.replace(/^\//, '').trim();
        return p.split('/')[0] || '';
      }
      // youtube.com/watch?v=<id>
      const v = parsed.searchParams.get('v');
      if (v) return v;
      // shorts/<id>
      const m = /^\/shorts\/([^/?#]+)/.exec(parsed.pathname);
      if (m) return m[1];
      return '';
    } catch {
      return '';
    }
  }

  async function listAll() {
    await ensureSignedIn();
    const data = await requestByPath(`${ROOT_PATH}`, 'GET');
    if (!data || typeof data !== 'object') return [];
    return Object.values(data).filter(Boolean);
  }

  async function save(record) {
    const url = cleanString(record && record.url);
    let indent_id = cleanString(record && record.indent_id);

    if (!indent_id) indent_id = extractVideoIdFromUrl(url);
    if (!indent_id) throw new Error('YouTubeRefVideosStore.save: missing indent_id (or cannot extract from url)');
    if (!url) throw new Error('YouTubeRefVideosStore.save: missing url');

    const key = encodeKey(indent_id);
    if (!key) throw new Error('YouTubeRefVideosStore.save: cannot encode key');

    const payload = {
      indent_id,
      url,
      description: cleanString(record && record.description),
      title: cleanString(record && record.title),
      short_name: cleanString(record && record.short_name),
      tag: cleanString(record && record.tag),
      order: parseOrder(record && record.order),
      updatedAt: nowIso()
    };

    await ensureSignedIn();
    await requestByPath(`${ROOT_PATH}/${key}`, 'PUT', payload);
    return payload;
  }

  window.YouTubeRefVideosStore = window.YouTubeRefVideosStore || {
    ROOT_PATH,
    encodeKey,
    extractVideoIdFromUrl,
    listAll,
    save
  };
})();
