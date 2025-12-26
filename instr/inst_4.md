# Refactoring Task: Modularize Audio Visualization Logic

**Source File:** `C:\Python\AuTr\html\edit_test33.html`
**Target File:** `C:\Python\AuTr\html\edit_test4.html`

**Objective:**
Refactor the existing JavaScript code from the source file to decouple the logic from the specific HTML DOM structure. The goal is to create a reusable set of functions (a library or module) that can be imported and used in any HTML file.

**Requirements:**
1.  **Remove Global Dependencies:** Functions should not access global variables or hardcoded DOM IDs (e.g., `inputStart`, `audioPlayer`, `spectrum2`).
2.  **Parameterization:** All functions must accept necessary data (DOM elements, audio buffers, time values) as input parameters.
3.  **Pure Functions:** Where possible, make functions pure (output depends only on input).
4.  **Separation of Concerns:**
    *   **Library Code:** Core logic for drawing waveforms, handling playback, and time conversion.
    *   **Implementation Code:** The specific script that selects elements by ID and calls the library functions.
5.  **Adherence to Specifications:** Implement the functions exactly as described in the **Function Specifications** section below. Map the variables listed in "Some Input Var/Const" (from the source file) to the new "Input" parameters.

**Expected Output:**
*   A new HTML file (`edit_test4.html`) containing the refactored code.
*   The JavaScript logic should be organized into reusable functions matching the signatures defined below.
*   The functionality (playback, visualization, markers) must remain identical to the source file.

## Function Specifications

### 1. Visualization
**1.1) Description:** Renders the waveform, time ruler, and playhead cursor onto the provided canvas.
**1.2) Name:** `drawWaveform`
**1.3) Input:** `canvas` (HTMLCanvasElement), `audioBuffer` (AudioBuffer), `start` (Number), `end` (Number), `currentTime` (Number)
**1.4) Output:** `canvas` (HTMLCanvasElement)
**1.5) Some Input Var:** `start`, `end`, `current`
**1.6) Some Input Const:** `canvas`, `audioBuffer`
**1.7) Some Output Var:** `void`

**1.1) Description:** Adjusts the canvas width/height attributes to match display size and pixel density.
**1.2) Name:** `resizeCanvas`
**1.3) Input:** `canvas` (HTMLCanvasElement)
**1.4) Output:** `canvas` (HTMLCanvasElement)
**1.5) Some Input Var:** None
**1.6) Some Input Const:** `canvas`, `canvasCtx`
**1.7) Some Output Var:** `void`

### 2. Audio Processing
**1.1) Description:** Decodes a Blob or ArrayBuffer into an AudioBuffer for visualization.
**1.2) Name:** `decodeAudioData`
**1.3) Input:** `audioCtx` (AudioContext), `blob` (Blob)
**1.4) Output:** `Promise<AudioBuffer>`
**1.5) Some Input Var:** `blob`
**1.6) Some Input Const:** `audioCtx`
**1.7) Some Output Var:** `audioBuffer` (global)

### 3. Playback Control
**1.1) Description:** Plays audio from a start time and stops automatically at an end time. Returns the interval ID for cancellation.
**1.2) Name:** `playSegment`
**1.3) Input:** `audioElement` (HTMLAudioElement), `start` (Number), `end` (Number)
**1.4) Output:** `intervalId` (Number)
**1.5) Some Input Var:** `inputStart.value`, `inputEnd.value`
**1.6) Some Input Const:** `audio`
**1.7) Some Output Var:** `void`

**1.1) Description:** Stops audio playback and clears any active segment monitoring intervals.
**1.2) Name:** `stopPlayback`
**1.3) Input:** `audioElement` (HTMLAudioElement), `intervalId` (Number)
**1.4) Output:** `audioElement` (HTMLAudioElement)
**1.5) Some Input Var:** None
**1.6) Some Input Const:** `audio`
**1.7) Some Output Var:** `void`

### 4. UI Updates
**1.1) Description:** Updates the visual position of the current playback marker based on time.
**1.2) Name:** `updateProgressMarker`
**1.3) Input:** `markerElement` (HTMLElement), `current` (Number), `start` (Number), `duration` (Number)
**1.4) Output:** `markerElement` (HTMLElement)
**1.5) Some Input Var:** `audio.currentTime`, `inputStart.value`, `inputEnd.value`
**1.6) Some Input Const:** `markerCurrent`
**1.7) Some Output Var:** `void`

**1.1) Description:** Sets the positions of start and end markers (typically 0% and 100% for zoomed view).
**1.2) Name:** `updateRangeMarkers`
**1.3) Input:** `startMarker` (HTMLElement), `endMarker` (HTMLElement)
**1.4) Output:** `Object` { startMarker, endMarker }
**1.5) Some Input Var:** None
**1.6) Some Input Const:** `markerStart`, `markerEnd`
**1.7) Some Output Var:** `void`







