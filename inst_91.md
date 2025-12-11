
# Instruction: Add Selection Update Method to FrameController

## Goal
Enhance the `FrameController` class in the visualization prototype by adding a dedicated method to update the audio selection range. This encapsulates the state change logic.

## Files
*   **Target File**: `html/vis_frame_controller.html`

## Requirements

### 1. Update FrameController Class
Add a new method `setAudioSelection(start, end)` to the `FrameController` class.

*   **Parameters**:
    *   `start` (number): The new start time in seconds.
    *   `end` (number): The new end time in seconds.
*   **Behavior**:
    *   Update `this.start_pos_audio_selection`.
    *   Update `this.end_pos_audio_selection`.
    *   *Optional*: Add validation to ensure `start < end`.

### 2. Update Interaction Logic
Refactor the existing event listeners or input handling to use this new method instead of modifying properties directly.

*   In the `updateStateFromInputs` function, call `frameController.setAudioSelection(...)` when the selection inputs change.

## Example Usage
```javascript
// Old way
frameController.start_pos_audio_selection = 15.0;
frameController.end_pos_audio_selection = 20.0;

// New way
frameController.setAudioSelection(15.0, 20.0);
```
 