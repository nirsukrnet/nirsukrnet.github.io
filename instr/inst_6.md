# Instruction: Save translations into `data_base3/text_trans_phrases`

## Goal
Add a new save pipeline that takes translated sentences from the UI and writes them into Firebase under:

`../data_base3/text_trans_phrases/{partid}/{txtid}`

This is similar to the existing `SaveTransReadyDataToFireBase(dataToSave)` but targets the **text** collection (`text_trans_phrases`) instead of `audio_trans_phrases`.

## Where
- Source reference: `assets/js/help_js/sent_trans_loadsave.js`
- New functions to implement (same file is fine):
    - `SaveTransReadyDataToFireBaseTo_text_trans_phrases(dataToSave)`
    - `FB_Patch_text_trans_phrases(items)`

## Input / dependencies
### Input
`dataToSave` is an array of objects:
```js
[{ idsentence, sentence_to }, ...]
```

### Required globals
- `window.for_trans_data`: UI model array; must contain an entry for each `idsentence` with a `d_uuid`.
- `window.CONTENT_DATA_JSON.translationTo`: the target language code (`sv`, `en`, `uk`).
- `requestByPath(path, method, payload)`: existing helper that performs Firebase REST calls.

## Data model
### `d_uuid` parsing
Assume `d_uuid` is a composite key that encodes both:
- `partid` (the parent node)
- `txtid` (the child node)

Confirmed from Firebase snapshots (`audio_phrases-export.json`): `text_id` / `d_uuid` has the shape:

`parttxt_<n>_txt<m>`

So parsing can be defined precisely:
- `partid = first 2 tokens joined with '_'` (e.g., `parttxt_1`)
- `txtid = remaining tokens joined with '_'` (e.g., `txt989`)

This matches the logic used by `CollectLessonData()`.

Examples:
- `parttxt_1_txt1`    => `partid = parttxt_1`, `txtid = txt1`
- `parttxt_1_txt1000` => `partid = parttxt_1`, `txtid = txt1000`

If you later introduce a different id format where `partid` has more than 2 underscore-separated tokens, update parsing accordingly (or store `_partid`/`_txtid` separately in the UI model).

## Target field mapping
The destination property name depends on the chosen translation language:

- `translationTo === 'sv'` → `text_sv`
- `translationTo === 'uk'` → `text_uk`
- otherwise → `text_en`

## Payload schema (match Firebase snapshot style)
Snapshot example (per `.../partid/txtid` object):
```json
{
    "datetimetrans": "2025-12-27T22:23:52.898Z",
    "text_en": "Listen and repeat.",
    "text_sv": "Lyssna och säg efter.",
    "text_uk": ""
}
```

For `text_trans_phrases`, keep the same timestamp format: `new Date().toISOString()`.

About an `_id` field:
- The snapshot doesn’t include `_id`.
- If you want strict schema parity: do **not** write `_id`.
- If you want traceability for the new collection: optionally store `_id: d_uuid`.

Default decision for implementation: **don’t write `_id`**, unless you confirm you need it.

## Algorithm
1. Determine `targetField` from `translationTo`.
2. For each item in `dataToSave`:
     - Find corresponding UI model row in `window.for_trans_data` by `idsentence`.
     - Read `d_uuid`.
    - Parse `d_uuid` into `{partid, txtid}` using the **2+ tokens rule** (see above).
     - Build payload `{ [targetField]: sentence_to, datetimetrans: ISOString }`.
3. Call `FB_Patch_text_trans_phrases(items)`.
4. In `FB_Patch_text_trans_phrases`:
     - PATCH each payload to `../data_base3/text_trans_phrases/{partid}/{txtid}`.
     - Optionally update the in-memory UI model on success.

## Draft code (ready to paste)
```javascript
window.SaveTransReadyDataToFireBaseTo_text_trans_phrases = async function (dataToSave) {
    const translationTo = (window.CONTENT_DATA_JSON && window.CONTENT_DATA_JSON.translationTo) || 'en';
    const targetField = translationTo === 'uk' ? 'text_uk' : (translationTo === 'sv' ? 'text_sv' : 'text_en');

    const list = Array.isArray(dataToSave) ? dataToSave : [];
    const uiList = Array.isArray(window.for_trans_data) ? window.for_trans_data : [];

    const items = [];

    for (const row of list) {
        const idsentence = row && row.idsentence;
        const sentenceTo = row && row.sentence_to;
        if (idsentence == null) continue;

        const uiItem = uiList.find(x => x && x.idsentence == idsentence);
        const d_uuid = uiItem && uiItem.d_uuid;
        if (!d_uuid || typeof d_uuid !== 'string') continue;

        const parts = d_uuid.split('_');
        if (parts.length < 3) {
            console.warn('Could not parse d_uuid (need parttxt_N_txtM):', d_uuid);
            continue;
        }

        const partid = parts[0] + '_' + parts[1];
        const txtid = parts.slice(2).join('_');

        const payload = {
            [targetField]: sentenceTo,
            datetimetrans: new Date().toISOString()
        };

        items.push({ partid, txtid, payload, _uiItem: uiItem, _newText: sentenceTo });
    }

    if (items.length) {
        await window.FB_Patch_text_trans_phrases(items);
    }
};


window.FB_Patch_text_trans_phrases = async function (items) {
    const list = Array.isArray(items) ? items : [];

    for (const item of list) {
        const { partid, txtid, payload, _uiItem, _newText } = item || {};
        if (!partid || !txtid || !payload) continue;

        const path = `../data_base3/text_trans_phrases/${partid}/${txtid}`;

        try {
            await requestByPath(path, 'PATCH', payload);
            console.log('Saved:', path);

            if (_uiItem) {
                _uiItem.sentence_to = _newText;
            }
        } catch (e) {
            console.error('Failed to save:', path, e);
        }
    }
};
```

## Verified with snapshots
- `audio_phrases-export.json` contains ids like `parttxt_1_txt989` and lessons that include multiple parts (e.g., `lesson_16` contains `parttxt_1_*` and `parttxt_2_*`).
- `parttxt_1-export.json` structure matches `../data_base3/text_trans_phrases/{partid}/{txtid}` keys (`txt1`, `txt2`, ...).



lets develop new function also for testing for downloading items into json:


window.FB_Download_text_trans_phrases = async function (items) {

}


### Testing helper: `FB_Download_text_trans_phrases(items)`

Goal: download the prepared `items` array (the same one passed to `FB_Patch_text_trans_phrases`) into a local `.json` file so you can inspect it or share it.

Important: Firebase export files (like `storage-eu-default-rtdb-text_trans_phrases-export.json`) are NOT a list — they are a nested object:

`{ [partid]: { [txtid]: { ...payload } } }`

So the downloader supports two formats:
- Default (`firebase-export`): matches the Firebase export-like shape (nested object)
- Optional (`patch-list`): a debug-friendly list with `{exportedAt, count, items:[...]}`

Important: `items` may contain non-serializable fields like `_uiItem` (DOM / cyclic refs). The downloader must strip these fields.

**Draft code (ready to paste):**
```javascript
window.FB_Download_text_trans_phrases = async function (items, options) {
    const list = Array.isArray(items) ? items : [];

    // options.format:
    // - 'firebase-export' (default)
    // - 'patch-list'
    const format = (options && options.format) ? String(options.format) : 'firebase-export';

    // Keep only serializable fields.
    const clean = list.map(it => {
        const partid = it && it.partid;
        const txtid = it && it.txtid;
        const payload = it && it.payload;
        return { partid, txtid, payload };
    }).filter(x => x.partid && x.txtid && x.payload);

    let out;
    let filePrefix;

    if (format === 'patch-list') {
        out = {
            exportedAt: new Date().toISOString(),
            count: clean.length,
            items: clean
        };
        filePrefix = 'text_trans_phrases_patch_items';
    } else {
        out = {};
        for (const it of clean) {
            if (!out[it.partid]) out[it.partid] = {};
            out[it.partid][it.txtid] = it.payload;
        }
        filePrefix = 'text_trans_phrases_export_like';
    }

    const json = JSON.stringify(out, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filePrefix}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};
```
