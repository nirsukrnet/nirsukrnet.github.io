# Instruction: Create Interactive Segment Player (librosa2.html)

## Goal
Create a new file `librosa2.html` based on `librosa1.html` that fully implements the interactive segment selection and playback features found in `edit_test6.html`.

## Requirements

1.  **Base File**: Start with the code from `librosa1.html` (which includes the audio loading and interval visualization).
2.  **Interactive Segment Highlight**:
    *   Ensure the `spectrum2` (zoomed view) has a **Green Segment Highlight** (`#segmentHighlight`).
    *   This highlight must be **draggable** (move the whole segment) and **resizable** (drag start/end handles).
    *   The logic should match the `FrameController` implementation in `edit_test6.html`.
3.  **Playback**:
    *   The "Play Segment" button must play *only* the audio corresponding to the current `segmentHighlight` position (Start Time to End Time).
    *   Playback should stop automatically at the end of the segment.
4.  **Synchronization**:
    *   Dragging the highlight should update the "Start Time" and "End Time" input fields in real-time.
    *   Changing the input fields should update the highlight position.

## Reference
*   `librosa1.html`: Current state with interval visualization.
*   `edit_test6.html`: Reference implementation for `FrameController` and drag interactions.


