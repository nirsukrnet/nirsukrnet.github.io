# Instruction: Refactor `FB_Patch_text_trans_phrases(items)` to batch PATCH by `partid`

## Goal
Refactor `window.FB_Patch_text_trans_phrases(items)` to reduce the number of Firebase writes.

Today the implementation PATCHes each item individually:

`../data_base3/text_trans_phrases/{partid}/{txtid}`

Target behavior: group all items by `partid`, update a single in-memory part object, then PATCH once per `partid`:

`../data_base3/text_trans_phrases/{partid}`

## Why
- Performance: avoids N network calls (one per sentence) and replaces with P calls (one per part).
- Consistency: all updates for a part are applied together.
- Easier debugging: you can download / inspect the full updated part payload.

## Important (Firebase PATCH semantics)
If you PATCH at the part level like:
```js
// ⚠️ Risky
await requestByPath(`../data_base3/text_trans_phrases/${partid}`, 'PATCH', {
  [txtid]: { text_en: '...', datetimetrans: '...' }
});
```
Firebase will set the whole `txtid` node to that object, which can **erase sibling fields** that already exist under that `txtid` (for example `text_sv`, `text_uk`).

That’s why the safe batching approach is:
1) Load existing part data (so every `txtid` object contains all its current fields)
2) Merge the changed fields into `partDB[txtid]`
3) PATCH the full merged `partDB`

## Inputs
`items` is an array (usually produced by `SaveTransReadyDataToFireBaseTo_text_trans_phrases`) with shape:
```js
[{ partid, txtid, payload, _uiItem?, _newText? }, ...]
```

### Required dependencies
- `requestByPath(path, method, payload)` must exist
- `window.Load_DB3_Part_Phrases(partid)` should return the part object from
  `../data_base3/text_trans_phrases/{partid}`

Expected return shape for the part object:
```js
{
  txt1:   { text_en, text_sv, text_uk, datetimetrans, ... },
  txt989: { ... },
  ...
}
```

## Algorithm
1. Validate that `requestByPath` exists.
2. Normalize `items` to an array and filter out invalid entries.
3. Group items by `partid`.
4. For each `partid` group:
   - Load current part data: `partDB = await Load_DB3_Part_Phrases(partid)`.
   - Ensure `partDB` is an object (fallback `{}` if missing).
   - For each item in the group:
     - Merge payload into `partDB[txtid]`:
       - `partDB[txtid] = { ...(partDB[txtid]||{}), ...payload }`
   - PATCH one request:
     - `requestByPath('../data_base3/text_trans_phrases/{partid}', 'PATCH', partDB)`
   - If PATCH succeeds: update in-memory UI (`_uiItem.sentence_to = _newText`) for items in the group.
   - If PATCH fails: log the error (and do not update `_uiItem` for that group).

## Edge cases / notes
- If `Load_DB3_Part_Phrases(partid)` returns `null` or `undefined`, treat it as `{}`.
- Do not store `_uiItem` or any non-serializable fields into Firebase.
- PATCHing the whole `partDB` at `/text_trans_phrases/{partid}` can overwrite concurrent edits.
  If you expect concurrent writers, batching becomes more complex because you still must avoid overwriting
  sibling fields under each `txtid`. Only switch to “smaller PATCH objects” if you confirm your REST layer
  supports safe multi-path updates (field-level) at the part node.

## Draft code (ready to paste)
```js
window.FB_Patch_text_trans_phrases = async function (items) {
    if (typeof requestByPath !== 'function') {
        console.error('[trans] requestByPath is not available');
        return;
    }
    if (typeof window.Load_DB3_Part_Phrases !== 'function') {
        console.error('[trans] Load_DB3_Part_Phrases is not available');
        return;
    }

    const list = Array.isArray(items) ? items : [];

    // Group by partid
    const byPart = new Map();
    for (const it of list) {
        const partid = it && it.partid;
        const txtid = it && it.txtid;
        const payload = it && it.payload;
        if (!partid || !txtid || !payload) continue;

        if (!byPart.has(partid)) byPart.set(partid, []);
        byPart.get(partid).push(it);
    }

    for (const [partid, partItems] of byPart.entries()) {
        const path = `../data_base3/text_trans_phrases/${partid}`;

        try {
            const loaded = await window.Load_DB3_Part_Phrases(partid);
            const partDB = (loaded && typeof loaded === 'object') ? { ...loaded } : {};

            for (const it of partItems) {
                const { txtid, payload } = it;
                const prev = (partDB[txtid] && typeof partDB[txtid] === 'object') ? partDB[txtid] : {};
                partDB[txtid] = { ...prev, ...payload };
            }

            await requestByPath(path, 'PATCH', partDB);
            console.log('[trans] Saved part:', path);

            // Update UI only after successful write
            for (const it of partItems) {
                const { _uiItem, _newText } = it || {};
                if (_uiItem) _uiItem.sentence_to = _newText;
            }
        } catch (e) {
            console.error('[trans] Failed to save part:', path, e);
        }
    }
};
```
