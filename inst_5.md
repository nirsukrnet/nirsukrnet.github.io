# Instruction: Single Audio File Player Implementation

## Summary of Work
| Existing File | Action | Key Change |
| :--- | :--- | :--- |
| `output_audio_text.js` | **Major Refactor** | Extract timestamps from filename; remove `<audio>` tag creation. |
| `oap_controlbuttons.js` | **Major Refactor** | Implement "Range Playback" (Start -> End) on a single global file. |
| `db_connswmp3.js` | **Minor/Copy** | Point to the new scripts; setup global audio init. |
| `global_var.js` | **No Change** | Re-use existing Firebase auth and connection logic. |

---

## Goal
Develop a new HTML/JS approach to play audio segments from a **single large MP3 file** instead of multiple small WAV files. This optimizes storage and management.

## Files & Locations
*   **Target HTML File**: `C:\Python\AuTr\html\oneaudio.html`
*   **Source Audio File**: `C:\Python\AuTr\html\phrase_audio\SW_Learn_Day_1-5.mp3`
*   **Data Source (Snapshot)**: `C:\Python\AuTr\html\phrase_audio\snapshot_all_data_bases_20251209_102454.json`
*   **New Scripts Directory**: `C:\Python\AuTr\html\assets\js\output_oneaudio\`
    *   *Action*: Create this directory if it does not exist.

## Functional Requirements
1.  **Single Source**: The player must load `SW_Learn_Day_1-5.mp3` once.
2.  **Data Loading**:
    *   Connect to the live Firebase DB (reuse existing connection logic).
    *   **Note**: The file `snapshot_all_data_bases_20251209_102454.json` is provided ONLY as a reference for the data structure during development. Do not load this file in the final code.
    *   Retrieve data from the `audio_phrases` table.
3.  **Segment Playback**:
    *   Parse the `file_name` field from the `audio_phrases` data (e.g., `swday_0001_SW_Learn_Day_1-5_srt_00-00-03.240_00-00-07.120.wav`) to extract the **start time** (`00:00:03.240`) and **end time** (`00:00:07.120`).
    *   Implement logic to play these specific time ranges from the single MP3 file when a phrase is clicked.
4.  **Preservation**:
    *   **Do NOT modify** the existing `C:\Python\AuTr\html\mp3.html` or its associated scripts (which use the multi-file approach).
    *   This new implementation is a separate, parallel feature.

## Implementation Steps

### 1. Scaffold New Files
*   Create `oneaudio.html` with a structure similar to `mp3.html`.
*   Create the directory `C:\Python\AuTr\html\assets\js\output_oneaudio\`.
*   Clone the following files into the new directory (renaming them to avoid confusion):
    *   `output_audio_text.js` -> `oneaudio_text.js`
    *   `oap_controlbuttons.js` -> `oneaudio_controlbuttons.js`
    *   `db_connswmp3.js` -> `db_conns_oneaudio.js` (place this in `assets/js/` or the new folder, but update references).

### 2. Refactor `oneaudio_text.js`
*   **Remove** the creation of individual `<audio>` elements in the `makeRow` function.
*   **Parse** the `file_name` to extract start and end times.
    *   *Format*: `..._HH-MM-SS.mmm_HH-MM-SS.mmm.wav`
    *   *Logic*: Convert these strings into seconds (float).
*   **Update** the "Play" button creation to pass these start/end times to the controller.

### 3. Refactor `oneaudio_controlbuttons.js`
*   **Create** a single global `Audio` object initialized with `SW_Learn_Day_1-5.mp3`.
*   **Implement** `playSegment(startTime, endTime)`:
    *   Set `currentTime` to `startTime`.
    *   Play the audio.
    *   Add a `timeupdate` event listener to pause the audio when `currentTime >= endTime`.

### 4. Refactor `db_conns_oneaudio.js`
*   **Update** the initialization logic to load the new scripts (`oneaudio_text.js`, `oneaudio_controlbuttons.js`) instead of the old ones.
*   **Ensure** the global audio object is ready before the UI renders.

### 5. Update `oneaudio.html`
*   **Load** the new `db_conns_oneaudio.js` (via `main_loadscripts.js` or directly).
*   **Ensure** the entry point (`MainFunc`) triggers the new initialization flow.




copy "C:\Python\AuTr\AudioTranscr\outputs\phrase_audio\SW_Learn_Day_1-5_srt_phrase.json" "C:\Python\AuTr\html\phrase_audio\SW_Learn_Day_1-5_srt_phrase.json"

in UI user can set marks and for this purpose we need to upload start and end pos to fb 

            "datetimetrans": "2025-11-25T07:30:56.980Z",
            "file_name": "swday_0014_SW_Learn_Day_1-5_srt_00-01-11.500_00-01-15.320.wav",
            "lesson_id": "1",
            "mark1": "",
            "mark2": "",
            "mark3": "",
            "rec_id": "15",
            "text_en": "Good morning, Lysa.",
            "text_sv": "God morgon, Lysa.",
            "text_uk": ""
