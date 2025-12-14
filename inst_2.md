# Instruction: Single Audio File Player Implementation

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

## 4. Optimization: Spectrum Data Storage
To avoid decoding the entire audio file for visualization every time (which is resource-intensive), we will store pre-computed spectrum data in the database.

*   **Concept**: Generate a lightweight array of amplitude values representing the waveform.
*   **Data Structure**:
    *   `spectrum_values`: Array of integers (e.g., 0-255) representing peak amplitude.
    *   `time_step`: Float (e.g., 0.01 or 0.1) representing the duration each value covers (seconds per sample).
*   **Benefits**:
    *   **Fast Loading**: The waveform can be rendered immediately from the DB JSON without waiting for the MP3 to download or decode.
    *   **Low Bandwidth**: The data array is significantly smaller than the audio file.


C:\Python\AuTr\html\phrase_audio\SW_Learn_Day_1-5.mp3