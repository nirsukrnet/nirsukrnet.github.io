# Project Migration: Database Restructuring & Web App Update

**Context:**
We are migrating our data storage from a relational-style structure (`data_base2`) to a hierarchical, document-oriented structure (`data_base3`). This requires analyzing the new database schema and updating the web application (`transl.html`) to interact with it.

**Input:**
- Database Snapshot: `AudioTranscr/db/snapshot_all_data_bases_*.json`
- Web App Entry Point: `html/transl.html`
- Script Loader: `html/assets/js/help_js/trans_loadscripts.js`
- Logic Scripts: `html/assets/js/help_js/` (specifically `sent_trans_loadsave.js`, `sent_data_json.js`)

---

## Part 1: Database Structure Analysis (`data_base2` -> `data_base3`)

**Objective:**
Define the schema and relationships for the new `data_base3` structure based on the provided snapshot.

**Tasks:**
1.  **Analyze `data_base3` Root Keys:**
    *   **`lessons_audio_phrases`**: Contains metadata for lessons (e.g., `rec_id`, `title`, `json_key_item`).
    *   **`ref_mp3_files`**: Contains references to audio files (e.g., `file_name`, `url_path`, `json_key_item`).
    *   **`audio_phrases`**: The core data container. It is nested by lesson key (from `lessons_audio_phrases`) and then by file key (from `ref_mp3_files`).
2.  **Map Relationships:**
    *   Identify how `json_key_item` in `lessons_audio_phrases` (e.g., `"lesson_1"`) maps to keys in `audio_phrases`.
    *   Identify how `json_key_item` in `ref_mp3_files` (e.g., `"mp3_file_0001"`) maps to sub-keys in `audio_phrases`.
3.  **Document the Schema:**
    *   Create a JSON schema representation or a detailed Markdown table describing the fields in `data_base3`.

---

## Part 2: Web Application Update (`transl.html`)

**Objective:**
Update the data fetching and saving logic in the web application to support `data_base3`.

**Constraints:**
*   **Scope:** Modify ONLY the logic related to data migration and persistence.
*   **No UI Changes:** Do not modify the user interface or unrelated scripts.
*   **Target Files:** Primarily `html/assets/js/help_js/` and `html/assets/js/db_connswmp3.js` (if applicable).

**Tasks:**
1.  **Update Data Loading (`trans_loadscripts.js` / `db_connswmp3.js`):**
    *   Review `initFirebaseDataForTrans`.
    *   Replace calls to `Get_All_Tables_Meta` and `Get_Rows_All_Tables` (which fetch `data_base2`) with new functions to fetch `data_base3`.
    *   Implement fetching of `lessons_audio_phrases`, `ref_mp3_files`, and the relevant `audio_phrases`.

2.  **Update Data Management (`sent_trans_loadsave.js`):**
    *   Update the logic that populates the UI with data. Instead of iterating over rows/tables, iterate over the nested `audio_phrases` structure.
    *   Ensure the application can correctly identify the current lesson and audio file from the new metadata structures.

3.  **Update Data Saving:**
    *   Modify the save function to write updates back to the specific path in `data_base3/audio_phrases/...` instead of the old table structure.

4.  **Verification:**
    *   Ensure the application loads without errors.
    *   Verify that data is correctly read from `data_base3`.

