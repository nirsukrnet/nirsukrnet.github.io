# VARS

# Instruction: Refactor State Management with FrameController

## Goal
Refactor the Audio Segment Tester to use a centralized **State Management Class** (`FrameController`) to decouple logic from the UI. This class will serve as the single source of truth for all timing and positioning data. Additionally, implement synchronized dragging behavior where the audio segment moves relative to the global view window.

## Files
*   **Target File**: `html/edit_test7.html` (Start from `html/edit_test6.html`)

## Core Requirements

### 1. FrameController Class
Create a simple class `FrameController` to hold the application state. It should contain **only variables (properties)** and no business logic methods.

**Properties:**
*   `track_Duration`: Total duration of the audio file.
*   `start_pos_audioframe`: Start time of the selected audio segment (Green Highlight).
*   `end_pos_audioframe`: End time of the selected audio segment.
*   `start_pos_visualframe`: Start time of the visible zoom window (Yellow Highlight).
*   `end_pos_visualframe`: End time of the visible zoom window.
*   `current_time`: Current playback cursor position.
*   `is_playing`: Boolean state of playback.
*   `canvas_width`: Width of the visualization canvas.
*   `canvas_height`: Height of the visualization canvas.

### 2. Global Timeline Behavior (Rule 1)
*   **View Window Dragging**:
    *   When the user drags the "View Window" (Yellow Highlight) in the Global Timeline, update `start_pos_visualframe` and `end_pos_visualframe`.
    *   **Synchronized Segment Move**: The Audio Segment (Green Highlight) must move **in sync** with the View Window.
    *   *Logic*: Calculate the time shift (`delta`) of the View Window and apply the exact same `delta` to `start_pos_audioframe` and `end_pos_audioframe`.
    *   *Result*: The Green Segment appears "locked" visually inside the Yellow Window while dragging, effectively changing its actual audio start/end times.

### 3. Segment Timeline Behavior (Rule 2)
*   **Segment Dragging**:
    *   Dragging the Green Highlight in the zoomed view updates `start_pos_audioframe` and `end_pos_audioframe`.
    *   **Constraints**: The segment cannot be dragged outside the bounds of the current View Window (`start_pos_visualframe` / `end_pos_visualframe`).

### 4. Visualization & UI
*   All rendering functions (`drawWaveform`, `updateMarkers`) must read values directly from the `FrameController` instance.
*   Input fields (Start Time, End Time) should update the `FrameController` state, which then triggers a UI refresh.

## Implementation Steps
1.  Define the `FrameController` class.
2.  Instantiate a global `frameController` object.
3.  Refactor existing event listeners (drag, input, playback) to read/write to `frameController`.
4.  Implement the "Synchronized Segment Move" logic in the Global Drag handler.


# METHODS

lets develop new method resize. it means set new value for
*   `start_pos_audioframe`
*   `end_pos_audioframe`: 

