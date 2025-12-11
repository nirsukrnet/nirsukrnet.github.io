# Refactoring Task: Context-Aware Implementation

**Objective:**
Refactor the "Implementation Code" in `edit_test4.html` to support multiple instances of the audio editor on the same page (e.g., `startTime1` vs `startTime2`). Instead of hardcoding global variables inside event handlers, we will use a context object pattern.

**Problem:**
Currently, functions like `handleUpdateCurrentMarker` rely on hardcoded global variables (`inputStart`, `audio`, etc.). This prevents reusing the logic for different sets of elements (e.g., a second editor frame).

**Solution: Context Object Pattern**
1.  **Define Contexts:** Create objects that group all related DOM elements for a specific editor instance.
    ```javascript
    const context1 = {
        inputStart: document.getElementById('startTime1'),
        inputEnd: document.getElementById('endTime1'),
        audio: document.getElementById('audioPlayer1'),
        // ... other elements
    };
    ```

2.  **Refactor Handlers:** Update implementation functions to accept this context object as an argument.
    ```javascript
    function handleUpdateCurrentMarker(ctx) {
        const start = parseFloat(ctx.inputStart.value);
        // ... use ctx.inputStart, ctx.audio, etc.
    }
    ```

3.  **Bind Contexts:** When adding event listeners, bind the specific context to the handler.
    ```javascript
    context2.audio.addEventListener('timeupdate', () => handleUpdateCurrentMarker(context2));
    ```

**Task:**
Update the instruction to list all functions in the "Implementation Code" section that need to be refactored to accept a `context` object, and define the structure of that object.

## Sample Code Implementation

Here is how to apply the Context Object Pattern to `edit_test4.html`.

### 1. Define Context Objects
Replace the global variable declarations with context objects for each frame.

```javascript
// Context for Frame 1
const context1 = {
    id: 1,
    audio: document.getElementById('audioPlayer1'),
    statusEl: document.getElementById('status1'),
    btnPlay: document.getElementById('btnPlay1'),
    btnStop: document.getElementById('btnStop1'),
    inputStart: document.getElementById('startTime1'),
    inputEnd: document.getElementById('endTime1'),
    canvas: document.getElementById('spectrum1'),
    // Frame 1 might not have markers yet, but we include them if they exist or handle nulls
    markerStart: null, 
    markerEnd: null,
    markerCurrent: null,
    // State specific to this context
    checkSeekInterval: null,
    isWaveformReady: false,
    audioBuffer: null // Shared or separate depending on need
};

// Context for Frame 2
const context2 = {
    id: 2,
    audio: document.getElementById('audioPlayer2'),
    statusEl: document.getElementById('status2'),
    btnPlay: document.getElementById('btnPlay2'),
    btnStop: document.getElementById('btnStop2'),
    inputStart: document.getElementById('startTime2'),
    inputEnd: document.getElementById('endTime2'),
    canvas: document.getElementById('spectrum2'),
    markerStart: document.getElementById('markerStart2'),
    markerEnd: document.getElementById('markerEnd2'),
    markerCurrent: document.getElementById('markerCurrent2'),
    checkSeekInterval: null,
    isWaveformReady: false,
    audioBuffer: null
};
```

### 2. Refactor Functions to Accept Context
Update functions to use `ctx` instead of global variables.

```javascript
function handleUpdateCurrentMarker(ctx) {
    // Guard clause if markers don't exist in this context
    if (!ctx.markerCurrent) return;

    const start = parseFloat(ctx.inputStart.value);
    const end = parseFloat(ctx.inputEnd.value);
    
    if (isNaN(start) || isNaN(end) || start >= end) return;

    const current = ctx.audio.currentTime;
    const duration = end - start;
    
    // Use library function
    updateProgressMarker(ctx.markerCurrent, current, start, duration);
}

function handlePlaySegment(ctx) {
    const start = parseFloat(ctx.inputStart.value);
    const end = parseFloat(ctx.inputEnd.value);

    log(`[Frame ${ctx.id}] Requesting playback: ${start}s -> ${end}s`);
    
    // Reset using the specific context
    handleStopPlayback(ctx);

    // Use library function, store interval in context
    ctx.checkSeekInterval = playSegment(ctx.audio, start, end);
}

function handleStopPlayback(ctx) {
    stopPlayback(ctx.audio, ctx.checkSeekInterval);
    ctx.checkSeekInterval = null;
}
```

### 3. Bind Event Listeners
Bind the specific context to the events.

```javascript
// Setup Frame 1
context1.btnPlay.addEventListener('click', () => handlePlaySegment(context1));
context1.btnStop.addEventListener('click', () => handleStopPlayback(context1));
// ... other listeners

// Setup Frame 2
context2.btnPlay.addEventListener('click', () => handlePlaySegment(context2));
context2.btnStop.addEventListener('click', () => handleStopPlayback(context2));
context2.audio.addEventListener('timeupdate', () => handleUpdateCurrentMarker(context2));
```

