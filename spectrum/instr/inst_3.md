# Instruction: Implement Drag and Move for Selection

## Goal
Enhance the visualization by allowing the user to interactively drag and move the green selection segment within the view container.

## Files
*   **Source File**: `vis_frame_controller.html`
*   **Target File**: `vis_frame_controller2.html`

## Requirements

### 1. Drag Interaction
Implement mouse event listeners on the `#selection-segment` (or the container) to enable dragging.
*   **MouseDown**: Initiate the drag operation when clicking on the green selection area.
*   **MouseMove**: Update the position of the selection based on mouse movement.
    *   Calculate the delta movement.
    *   Update the `start` and `end` positions of the selection in the `FrameController` state.
    *   Ensure the selection stays within the bounds of the view window.
*   **MouseUp**: End the drag operation.

### 2. Visual Feedback
*   The cursor should change to indicate draggable content (e.g., `cursor: grab` / `cursor: grabbing`).
*   The UI inputs for Start and End selection should update in real-time as the box is dragged.

## Reference
*   **Inspiration**: `C:\Python\AuTr\html\edit_test6.html` (External file)
