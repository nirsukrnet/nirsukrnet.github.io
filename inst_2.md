# Instruction: Single Audio File Player Implementation

## Goal
Develop a new HTML/JS approach to play audio segments from a **single large MP3 file** instead of multiple small WAV files. This optimizes storage and management.

## Files & Locations
*   **Target HTML File**: `C:\Python\AuTr\html\oneaudio.html`
*   **Source Audio File**: `C:\Python\AuTr\html\phrase_audio\SW_Learn_Day_1-5.mp3`
*   **New Scripts Directory**: `C:\Python\AuTr\html\assets\js\output_oneaudio\`
    *   *Action*: Create this directory if it does not exist.

## Functional Requirements
1.  **Single Source**: The player must load `SW_Learn_Day_1-5.mp3` once.
2.  **Segment Playback**:
    *   Implement logic to play specific time ranges (start time -> end time) from the single file.
    *   This replaces the old logic of loading individual `.wav` files for each phrase.
3.  **Data Structure**:
    *   The data (transcripts/phrases) should include `start_time` and `end_time` (or duration) for each segment to allow precise seeking.
4.  **Preservation**:
    *   **Do NOT modify** the existing `C:\Python\AuTr\html\mp3.html` or its associated scripts (which use the multi-file approach).
    *   This new implementation is a separate, parallel feature.

## Implementation Steps
1.  Create `oneaudio.html` with a structure similar to the existing player but adapted for a single audio source.
2.  Create a new JavaScript file in `C:\Python\AuTr\html\assets\js\output_oneaudio\` to handle the range-based playback logic.
3.  Ensure the UI allows clicking a phrase to play the corresponding segment from the main MP3.
