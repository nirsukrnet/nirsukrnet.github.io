
## Migration to `text_trans_phrases`

To switch from `audio_trans_phrases` to `text_trans_phrases` for storing translations, the following scripts and functions need modification:

### 1. `html/assets/js/db_connswmp3.js`

*   **`Load_DB3_Lesson_Phrases`**:
    *   **Current**: Fetches translations from `../data_base3/audio_trans_phrases/${lessonKey}`.
    *   **Change**: Update the path to `../data_base3/text_trans_phrases/${lessonKey}`.
    *   **Reason**: To retrieve translation data from the new table structure.

*   **`SaveToFB_DB3`**:
    *   **Current**: Constructs the save URL as `../data_base3/audio_trans_phrases/${lessonKey}/${fileKey}/${index}`.
    *   **Change**: Update the URL to `../data_base3/text_trans_phrases/${lessonKey}/${fileKey}/${index}`.
    *   **Reason**: To ensure user edits are saved to the correct `text_trans_phrases` location.

### 2. `html/assets/js/help_js/sent_trans_loadsave.js`

*   **`SaveTransReadyDataToFireBase`**:
    *   **Current**: Updates the local `gv.sts.audio_phrases` cache and calls `Update_And_Save_Audio_Phrase_ItemByIndex`.
    *   **Change**: Verify if the data structure for `text_trans_phrases` requires different fields. If it's a direct mapping (just table name change), no logic change is needed here, as it delegates the actual DB call to `db_connswmp3.js`.
    *   **Note**: Ensure that `text_trans_phrases` supports the same fields (`text_sv`, `text_en`, `text_uk`, `datetimetrans`) as `audio_trans_phrases`.



