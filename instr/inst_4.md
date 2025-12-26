# Migration Guide: Multi-File to Single-File Audio Player (with DataBase 3)

This document outlines the necessary changes to convert the application from using multiple small MP3 files to a single large MP3 file per lesson, utilizing the new `data_base3` structure.

## 1. Architecture Shift

| Feature | Current (Multi-File) | Target (Single-File) |
| :--- | :--- | :--- |
| **Audio Source** | Individual MP3s per phrase | One Master MP3 per lesson |
| **Playback** | HTML5 `<audio>` tag per row | Global `Audio` object with seeking |
| **Data Source** | `db_connswmp3.js` (Firebase) | `db_connswmp3.js` (Firebase) + URL Resolution |
| **UI Renderer** | `output_audio_text.js` | `oneaudio_text.js` |
| **Controller** | `oap_controlbuttons.js` | `oneaudio_controlbuttons.js` |

## 2. Required File Changes

### A. Script Loader (`html/assets/js/main_loadscripts.js`)
**Goal:** Swap the UI/Controller scripts while keeping the Firebase data connection.

**Change:** Update the `scripts` array.
```javascript
   const scripts = [
    "./assets/js/global_var.js",
    "./assets/js/db_connswmp3.js",                  // Keep: Firebase Data Logic
    "./assets/js/output_audio_phrase/oap_styles.js",
    "./assets/js/output_oneaudio/oneaudio_controlbuttons.js", // New: Single Audio Controller
    "./assets/js/output_oneaudio/oneaudio_text.js",           // New: Single Audio Renderer
    "./assets/js/output_audio_phrase/oap_menu_less.js"
  ];
```

### B. Data Manager (`html/assets/js/db_connswmp3.js`)
**Goal:** Resolve the Master MP3 URL for the selected lesson and initialize the audio controller.

**Change:** Modify `Load_DB3_Lesson_Phrases` function.
1.  **Identify File Key:** After fetching `lessonPhrases`, extract the `file_key`. (Assumes 1 file per lesson).
2.  **Lookup URL:** Use `gv.sts.ref_mp3_files` to find the `url_path` or `file_name` associated with that `file_key`.
3.  **Init Controller:** Call the global controller with the found URL.

```javascript
// Pseudo-code insertion in Load_DB3_Lesson_Phrases
const fileKey = Object.keys(lessonPhrases)[0]; // Assuming one file
const fileMeta = gv.sts.ref_mp3_files.find(f => f.json_key_item === fileKey);
if (fileMeta && window._oapAudioController) {
    const audioUrl = fileMeta.url_path || `phrase_audio/${fileMeta.file_name}`;
    window._oapAudioController.init(audioUrl);
}
```

### C. Audio Controller (`html/assets/js/output_oneaudio/oneaudio_controlbuttons.js`)
**Goal:** Support dynamic re-initialization when switching lessons.

**Change:**
1.  **Remove Hardcoded Init:** Delete the line `window._oapAudioController.init('phrase_audio/SW_Learn_Day_1-5.mp3');` at the bottom.
2.  **Enhance `init`:** Ensure calling `init(newUrl)` properly stops the old audio and loads the new one.

### D. UI Renderer (`html/assets/js/output_oneaudio/oneaudio_text.js`)
**Goal:** Ensure compatibility with `db_connswmp3.js` data format.

**Change:**
*   Verify that `makeRow` correctly reads `start` and `end` properties from the phrase object.
*   `db_connswmp3.js` populates `gv.sts.audio_phrases`. Ensure the field names match what `oneaudio_text.js` expects (e.g., `start` vs `start_time`).

## 3. Database Structure (`data_base3`) Usage

The `data_base3` structure supports this approach natively:
*   **`lessons_audio_phrases`**: Selects the lesson.
*   **`ref_mp3_files`**: Holds the URL for the single master MP3.
*   **`audio_phrases`**: Contains the segmentation data (`start`, `end`) needed by the Single-File Player to seek correctly.

No changes to the database structure are required, only to how the application consumes the `ref_mp3_files` table to drive the audio controller.


