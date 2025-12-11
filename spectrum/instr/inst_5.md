# Instruction: Implement Selection Resizing

## Goal
Implement the ability to resize the green selection segment by dragging its left and right edges. This should be distinct from the existing "move" functionality.

## Files
*   **Source File**: `vis_frame_controller3.html`
*   **Target File**: `vis_frame_controller4.html`

## Requirements

### 1. Visual Handles
Add visual "handles" to the DOM structure of the `#selection-segment`.
*   **Left Handle**: A clickable area on the left edge.
*   **Right Handle**: A clickable area on the right edge.
*   **Styling**: Cursor should change to `ew-resize` (east-west resize) when hovering over handles.

### 2. Resize Interaction
Implement specific drag logic for each handle.
*   **Left Handle Drag**:
    *   Updates `start_pos_audio_selection`.
    *   Constraint: Cannot cross the right edge (start < end).
*   **Right Handle Drag**:
    *   Updates `end_pos_audio_selection`.
    *   Constraint: Cannot cross the left edge (end > start).
*   **Common Constraints**: Both must stay within the View Window bounds.

### 3. State Management (MessageManager)
Continue using `MessageManager` for all state interactions.
*   **Read**: Use `messageManager.get_audio_selection(...)` to get initial values on mousedown.
*   **Write**: Use `messageManager.input_to_audio_pos_sel(...)` to update the state during drag.

## Reference
*   **Inspiration**: `C:\Python\AuTr\html\edit_test6.html` (External file)
