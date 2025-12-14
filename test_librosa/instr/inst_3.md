
# Instruction: Add "Next Interval" Navigation to Librosa2

## Goal
Enhance `librosa2.html` by adding navigation buttons to automatically jump to the next defined sound interval.

## 1. UI Updates
Add two new buttons to the control group (`.control-group-btns2`), placed after the "Stop" button:
1.  **"Next"**: Moves the selection to the next interval.
2.  **"Next Play"**: Moves the selection to the next interval and immediately starts playback.

## 2. Functionality Implementation

### Logic for Finding Next Interval
*   Access the global `soundIntervals` array (loaded from JSON).
*   Compare the current **Start Time** (`frameController.start_pos_audioframe`) with the start times of the intervals.
*   Find the *first* interval in the list that has a start time **greater than** the current start time (plus a small epsilon to avoid getting stuck).
*   If a next interval is found:
    *   Update `frameController.start_pos_audioframe` and `frameController.end_pos_audioframe` to match the new interval's start and end.
    *   Update the UI inputs (`#startTime2`, `#endTime2`).
    *   Update the visual `#segmentHighlight` position.

### Button Actions
*   **Next Button**: Executes the logic above to move the selection.
*   **Next Play Button**: Executes the logic above, and if a new interval was selected, calls the existing `handlePlaySegment` function to play it.

## Output
Apply these changes to `c:\Python\AuTr\html\test_librosa\librosa3.html`.



