## Data Architecture & Snapshot Purpose

### Context
*   **Source of Truth**: The real, dynamic data resides in **Firebase**.
*   **Generator**: The Python script `C:\Python\AuTr\AudioTranscr\db_scripts\manage_fbdb.py` is responsible for fetching data from Firebase and serializing it.
*   **Artifact**: The snapshot file (e.g., `snapshot_all_data_bases_20251227_224339.json`) is the output of this process.

### Purpose of the Snapshot
The snapshot serves as a **reference for development**. Its primary purpose is:
1.  **Documentation**: It provides a concrete example of the database structure and content schema, allowing developers (and AI assistants) to understand the data model without needing direct access to the live Firebase database.


## Goal: Standardize Menu in `transl.html` with Part Filtering

We need to replace the current `trans_menu_parts.js` with a new script `trans_menu_filtered.js`. This script will:
1.  **Adopt the UI/UX** of `oap_menu_less.js` (standard dropdown menu).
2.  **Implement Part Filtering**: When a lesson is selected, it must identify the corresponding "parts" (sub-sections of data) and load the relevant text items.

### Data Structure & Filtering Logic

When a `lesson_id` is selected via the menu:
1.  The script identifies associated parts using `getPartsForLesson(lesson_id)`.
2.  It loads the data for the identified part (e.g., via `Load_DB3_Lesson_Phrases`).
3.  **Expected Output**: The loaded data will be an array/object of text items specific to that lesson/part. Each item typically contains a `text_id` (e.g., `parttxt_j_txti`) and translation fields.

**Example Data Format:**
```json
{
  "parttxt_j_txti": {
    "text_sv": "Lyssna och säg efter.",
    "text_en": "Listen and repeat.",
    "text_uk": "..."
  }
}
```
*Only items belonging to the selected lesson/part should be loaded.*

### Implementation Steps

#### 1. Create `assets/js/help_js/trans_menu_filtered.js`

Use the following code, which merges the `oap_menu_less.js` UI with the `trans_menu_parts.js` filtering logic.

