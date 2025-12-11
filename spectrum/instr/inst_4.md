# Instruction: Refactor State Interaction via MessageManager

## Goal
Refactor the drag-and-drop implementation to strictly use the `MessageManager` for all state interactions (reading and writing). This ensures the UI (View) is decoupled from the State (`FrameController`).

## Files
*   **Source File**: `vis_frame_controller2.html`
*   **Target File**: `vis_frame_controller3.html`

## Requirements

### 1. Abstract State Access (Read)
Directly accessing `frameController` properties (like `frameController.start_pos_audio_selection`) inside event listeners is prohibited.
*   **Action**: Create a method in `MessageManager` to retrieve the current state safely.
    *   `get_audio_selection(state_provider)`: Returns `{ start, end }` from the provider (FrameController).
    *   `get_audio_frame(state_provider)`: Returns `{ start, end }` from the provider (FrameController).

### 2. Abstract State Updates (Write)
All state modifications must go through the existing `MessageManager` methods.
*   **Action**: Ensure the `mousemove` handler and any other input handlers use:
    *   `messageManager.input_to_audio_pos_sel(sender, receiver)` for selection changes.
    *   `messageManager.input_to_audio_pos_frame(sender, receiver)` for view window changes.

### 3. Refactor Event Listeners
Update the Drag and Move logic in `vis_frame_controller3.html`:
*   **MouseDown**: Use `messageManager.get_audio_selection(frameController)` to fetch initial values instead of direct property access.
*   **MouseMove**: Construct a `sender` object with the new calculated values and pass it to `messageManager.input_to_audio_pos_sel(...)`.

## Example Usage

### Reading State
```javascript
// In MessageManager
get_audio_selection(provider) {
    return {
        start: provider.start_pos_audio_selection,
        end: provider.end_pos_audio_selection
    };
}

// In MouseDown
const currentSel = messageManager.get_audio_selection(frameController);
initialAudioStart = currentSel.start;
```

### Writing State
```javascript
// In MouseMove
const newValues = { start: newStart, end: newEnd };
messageManager.input_to_audio_pos_sel(newValues, frameController);
```


