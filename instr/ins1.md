# Web App Specification: Translation Tool Update

**Goal:** Update the web application (`transl.html`) and its JavaScript modules to support the new Firebase data structure. The tool allows users to view Swedish phrases and input English translations.

## 1. Data Structure

### Read Path: `audio_phrases`
The app should read source data from:
`data_base3/audio_phrases/{lesson_id}/{mp3_file_id}`

**Structure:**
```json
{
  "0": {
    "text_sv": "hej",
    "text_en": "", 
    "start": 8.266,
    "end": 8.916,
    "intervals_id": 4
  },
  "1": { ... }
}
```

### Write Path: `audio_trans_phrases`
The app should save translations to:
`data_base3/audio_trans_phrases/{lesson_id}/{mp3_file_id}`

**Structure (Mirror of Source):**
```json
{
  "0": {
    "text_sv": "hej",
    "text_en": "hello",  <-- User Input
    "start": 8.266,
    "end": 8.916,
    "intervals_id": 4,
    "datetimetrans": "2025-12-25T12:00:00Z" <-- Timestamp of translation
  }
}
```

## 2. File Specifications

### HTML: `C:\Python\AuTr\html\transl.html`
*   **Layout:**
    *   Header with Title.
    *   Controls:
        *   Input for `Lesson ID` (default: "lesson_1").
        *   Input for `MP3 File ID` (default: "mp3_file_0001").
        *   "Load" button.
        *   "Save All" button.
    *   Container for the list of phrases.
    *   Each phrase row:
        *   ID/Index.
        *   Swedish Text (Read-only).
        *   English Text (Input field).
        *   Time range (Display).

### JavaScript Modules: `C:\Python\AuTr\html\assets\js\help_js\`

#### 1. `trans_loadscripts.js`
*   **Role:** Entry point.
*   **Task:** Load necessary Firebase SDKs (v8 or v9 compat) and other modules (`trans_ui.js`, `sent_trans_loadsave.js`).

#### 2. `sent_trans_loadsave.js`
*   **Role:** Firebase Interaction.
*   **Functions:**
    *   `initFirebase()`: Initialize app.
    *   `loadPhrases(lessonId, mp3Id)`: Fetch data from `audio_phrases`.
    *   `loadExistingTranslations(lessonId, mp3Id)`: Fetch data from `audio_trans_phrases` (to pre-fill if exists).
    *   `saveTranslations(lessonId, mp3Id, dataObj)`: Write data to `audio_trans_phrases`.

#### 3. `trans_ui.js`
*   **Role:** UI Rendering & Event Handling.
*   **Functions:**
    *   `renderPhrases(phrasesData, translationsData)`: Generate HTML table/list.
    *   `collectData()`: Scrape inputs to prepare for saving.
    *   `handleLoad()`: Trigger load functions.
    *   `handleSave()`: Trigger save functions.

## 3. Implementation Steps
1.  **Update HTML**: Add the control inputs and container.
2.  **Update JS**: Refactor existing scripts to handle the nested JSON structure (`lesson -> mp3 -> index -> object`).
3.  **Firebase Config**: Ensure the correct Firebase config is used (same as in `firebase_load.yaml` but for JS client).

## 4. Example Data Flow
1.  User enters "lesson_1", "mp3_file_0001" and clicks Load.
2.  App fetches `audio_phrases/lesson_1/mp3_file_0001`.
3.  App fetches `audio_trans_phrases/lesson_1/mp3_file_0001`.
4.  UI displays rows. If translation exists, fill input; otherwise empty.
5.  User types "Hello" for "Hej".
6.  User clicks Save.
7.  App constructs object and saves to `audio_trans_phrases/lesson_1/mp3_file_0001`.
