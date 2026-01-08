# sent_trans_loadsave.js — functions & call order

Source file: `C:\Python\AuTr\html\assets\js\help_js\sent_trans_loadsave.js`

Goal of the module: load lesson phrases (DB3), build “sentences to translate” UI blocks, allow paste/parse translated text, and save translations back to Firebase/DB3.

---

## Call flow (what runs first)

1. Event: `oap:data-loaded` OR `oap:lesson-selected`
	- handler calls `window.ExpImpForTrans_loadDataToHTML()`.

2. `window.ExpImpForTrans_loadDataToHTML()`
	- reads `window.gv.sts.selected_lesson_id` and loads lesson rows via `window.CollectLessonData(lessonId)`.
	- output: calls `ExpImpForTrans_Sentence_loadDataToHTML(data)` to render UI (or renders empty list if no lesson).

3. `window.CollectLessonData(lessonId)`
	- loads phrases list (`gv.sts.audio_phrases`), optionally filters by lesson, groups by `text_id`, loads DB3 parts via `Load_DB3_Part_Phrases(partid)`.
	- output: returns `FilteredItems[]` (DB3 items) with `_partid` and `_txtid` added.

4. `ExpImpForTrans_Sentence_loadDataToHTML(inputData)`
	- transforms rows to UI model (`window.for_trans_data`), renders blocks into `#info_div`, wires all buttons for copy/parse/save/clear.
	- output: DOM UI + global caches used by saving.

User actions then drive the rest:
- Copy → `TextArea_copyToClipboard(...)`
- Parse input → builds “to” items in the block
- Save Next → `Save_1Block_ToBase_Sent_TransTo(id_block)` → saves to Firebase/DB3
- Clear Trans → clears translation field for ids in this block

---

## Function list (in file order)

### window.ExpImpForTrans_loadDataToHTML()
Input: `window.gv.sts.selected_lesson_id` (global) to pick lesson. Uses `window.CollectLessonData()`.
Output: calls `ExpImpForTrans_Sentence_loadDataToHTML(data)` to render; if no lesson then renders empty list.

### Click_SetModeCollectedWords(athis)
Input: clicked DOM element; toggles CSS class `button_control_transl_on`.
Output: triggers re-render by calling `ExpImpForTrans_Sentence_loadDataToHTML()` (uses stored `window.raw_trans_data`).

### testOnUkrainianLanguage(sentence1)
Input: `sentence1: string`.
Output: `boolean` true if it contains Ukrainian/Cyrillic chars.

### testOnEnglishLanguage(sentence1)
Input: `sentence1: string`.
Output: `boolean` true if it contains English letters A–Z.

### testOnSwedishLanguage(sentence1)
Input: `sentence1: string`.
Output: `boolean` true if it contains ÅÄÖ or A–Z.

### transformData(inputData)
Input: `inputData[]` (DB3 items) + globals `window.CONTENT_DATA_JSON.translationFrom/translationTo`.
Output: returns normalized `output_data[]` items with `idsentence`, `d_uuid` (`_partid + '_' + _txtid`), `sentence_from/to`, `needs_translation`, `_srcIndex`.

### displayBigSmall_sentencesFromBlock(id_block, valSize)
Input: `id_block` and `valSize` (0 collapse / 1 expand).
Output: changes styles of `#sentences-fromblock-{id_block}` (min/max height + overflow).

### onclick_sentencesFromBlock(id_block)
Input: `id_block`.
Output: toggles collapse/expand of `#sentences-fromblock-{id_block}`.

### onclick_sentencesToBlock(id_block)
Input: `id_block`.
Output: toggles collapse/expand of `#sentences-to-block-{id_block}`.

### hideAllBlocksInFrame(id_block)
Input: `id_block`.
Output: collapses the “to” block in the frame (`#sentences-to-block-{id_block}`) via inline styles.

### ExpImpForTrans_Sentence_loadDataToHTML(inputData)
Input: optional `inputData[]` (raw DB3 items). Stores it into `window.raw_trans_data`.
Output: sets `window.for_trans_data = transformData(...)`, builds UI blocks of 25 sentences needing translation, creates buttons:
- Copy button → `TextArea_copyToClipboard(text)`
- Parse button → parses textarea contents into “to” items
- Save Next button → `Save_1Block_ToBase_Sent_TransTo(id_block)`
- Clear Trans button → `getIdsFromSentencesFromBlock(id_block)` + `SaveTransReadyDataToFireBase(dataToSave)`

### getIdsFromSentencesFromBlock(id_block)
Input: `id_block`.
Output: returns string ids extracted from `#sentences-fromblock-{id_block}` using `352725_(\d+)` markers.

### Save_1Block_ToBase_Sent_TransTo(id_block)
Input: `id_block` (block number in UI).
Output: reads `.sentence-paste-to-item` nodes inside `#sentences-to-block-{id_block}`, builds `{idsentence, sentence_to}[]`.
Then saves using `window.SaveTransReadyDataToFireBaseTo_text_trans_phrases` if available, else fallback `SaveTransReadyDataToFireBase()`.

### SaveAllFramesToDatabase(dataToSave)
Input: unused parameter `dataToSave` (shadowed inside function).
Output: iterates all `.sentences-to-block` in `#info_div`, builds save payload per block, writes to DB3 or fallback saver.

### SaveTransReadyDataToFireBase(dataToSave)
Input: `dataToSave[] = { idsentence, sentence_to }` and globals `window.CONTENT_DATA_JSON.translationTo`, `window.for_trans_data`, `window.gv.sts.audio_phrases`.
Output: updates in-memory `for_trans_data` + writes translated field into `audio_phrases` via `Update_And_Save_Audio_Phrase_ItemByIndex(updatedRow, srcIndex)`.

### window.SaveTransReadyDataToFireBaseTo_text_trans_phrases(dataToSave)
Input: `dataToSave[]` and globals `window.for_trans_data` (for `d_uuid`), `window.CONTENT_DATA_JSON.translationTo`.
Output: maps each sentence to DB3 path `../data_base3/text_trans_phrases/{partid}/{txtid}`, builds patch items, calls `window.FB_Patch_text_trans_phrases(items)`.

### window.FB_Patch_text_trans_phrases(items)
Input: `items[] = { partid, txtid, payload }`.
Output: loads each part via `Load_DB3_Part_Phrases(partid)`, merges payload into existing records, PATCHes via `requestByPath(path,'PATCH',patchPayload)`.

### window.FB_Download_text_trans_phrases(items, options)
Input: `items[]` and optional `options.format`.
Output: creates and downloads a JSON file for debugging (`patch-list` or Firebase-export-like structure).

### ensureTableExists(tableName)
Input: `tableName: string`.
Output: returns table index; if missing, creates meta + empty rows using `requestByPath`, updates `window.gv.sts.tables_meta`.

### TextArea_copyToClipboard(TextToCopy1)
Input: string.
Output: copies it to clipboard via a temporary `<textarea>` + `document.execCommand('copy')`.

### RemoveAllStylesExpImpForTrans()  (NOTE: defined twice)
First definition removes all `<style>` tags, but it is overwritten later.
Effective output: the second definition removes only `#style_ExpImpForTrans_2`.

### ExpImpForTrans_createStyles_2()
Input: none.
Output: injects `<style id="style_ExpImpForTrans_2">…</style>` defining UI styles for blocks/buttons.

### ExpImpForTrans_createStyles()
Input: none.
Output: stub (does nothing).

### window.CollectLessonData(lessonId)
Input: `lessonId` (string/number). Uses globals `window.gv.sts.audio_phrases`, `window.gv.sts.lessons_audio_phrases`.
Output: returns DB3 items for the lesson by loading parts/txt ids via `Load_DB3_Lesson_Phrases(lessonKey)` + `Load_DB3_Part_Phrases(partid)`.

---

## Exposed globals / side effects
- `window.raw_trans_data`: last loaded raw DB3 items.
- `window.for_trans_data`: transformed UI list from `transformData()`.
- Multiple click handlers attached in `ExpImpForTrans_Sentence_loadDataToHTML()`.