(function(){
  'use strict';

  const SETTINGS_ROOT_PATH = '../test_debug_db3/default_debug';

  async function ensureSignedIn() {
    const gv = window.gv;
    if (!gv || !gv.URL_DS) throw new Error('SettingsStore: window.gv.URL_DS is not available');
    if (gv.URL_DS.idToken) return;
    if (typeof gv.SignIn_User !== 'function') throw new Error('SettingsStore: gv.SignIn_User() missing');
    await gv.SignIn_User();
  }

  function requestByPath(addurl, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      try {
        const gv = window.gv;
        if (!gv || !gv.URL_DS) throw new Error('SettingsStore: window.gv.URL_DS is not available');
        const ObjRequest = gv.URL_DS.GetObjForRequest();
        ObjRequest.addUrl = addurl;
        ObjRequest.ametod = method;
        ObjRequest.vobj = body;
        ObjRequest.CallBackFunction = function(vdata) {
          resolve(vdata);
        };
        ObjRequest.ErrorCallback = function(err) {
          reject(err || new Error('SettingsStore request failed'));
        };
        gv.URL_DS.requestData_By_URL_Path(ObjRequest);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function tryPatch(path, partial) {
    try {
      await ensureSignedIn();
      // Firebase RTDB supports PATCH.
      await requestByPath(path, 'PATCH', partial);
      return true;
    } catch {
      return false;
    }
  }

  const SettingsStore = {
    SETTINGS_ROOT_PATH,

    async load() {
      await ensureSignedIn();
      const v = await requestByPath(SETTINGS_ROOT_PATH, 'GET');
      return (v && typeof v === 'object') ? v : {};
    },

    async save(partial) {
      const obj = (partial && typeof partial === 'object') ? partial : {};
      if (Object.keys(obj).length === 0) return;

      // Prefer PATCH to avoid clobbering other keys.
      const ok = await tryPatch(SETTINGS_ROOT_PATH, obj);
      if (ok) return;

      // Fallback: GET then PUT merge.
      await ensureSignedIn();
      const current = await this.load();
      const merged = { ...(current || {}), ...obj };
      await requestByPath(SETTINGS_ROOT_PATH, 'PUT', merged);
    }
  };

  window.SettingsStore = window.SettingsStore || SettingsStore;
})();
