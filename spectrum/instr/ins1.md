# Instruction: Implement MessageManager for State Synchronization

## Goal
Introduce a `MessageManager` class to handle communication between UI components (Display) and the State (FrameController). This pattern decouples the UI event listeners from direct state manipulation.

## Files
*   **Target File**: `html/vis_frame_controller.html`

## Requirements

### 1. MessageManager Class
Create a class `MessageManager` responsible for routing updates.

**Methods:**
*   `changefromdisplay_audiopos(sender, receiver)`:
    *   **Purpose**: Handle updates triggered by UI inputs (Display) that affect the Audio Position (State).
    *   **Parameters**:
        *   `sender`: The source of the change (e.g., an Input element or a config object containing the new values).
        *   `receiver`: The target object to update (e.g., the `FrameController` instance).
    *   **Logic**:
        *   Extract the new start/end values from the `sender`.
        *   Call the appropriate update method on the `receiver` (e.g., `receiver.setAudioSelection`).
        *   Trigger a re-render (or notify the system to render).

### 2. Integration
*   Instantiate a global `messageManager`.
*   Refactor the `updateStateFromInputs` function to use `messageManager.changefromdisplay_audiopos(...)` instead of calling `frameController` methods directly.

## Example Usage
```javascript
const messageManager = new MessageManager();

// Inside event listener
function updateStateFromInputs() {
    // Create a sender object with the new values
    const senderData = {
        start: parseFloat(inpStartSel.value),
        end: parseFloat(inpEndSel.value)
    };
    
    // Delegate to manager
    messageManager.input_to_audio_pos(senderData, frameController);
    
    render(); // Or let the manager trigger this
}
```


