
# Task: Develop `full_audio_track2.html`

**Base File:** `full_audio_track.html`
**Target File:** `full_audio_track2.html`

## 1. Functional Requirements

### 1.1 File Loading
*   Implement an HTML `<input type="file" accept="audio/*">` element.
*   **Default Behavior:** Since browsers block pre-filling file inputs for security, implement a "Load Default" button that fetches `../phrase_audio/SW_Learn_Day_1-5.mp3` (assuming it's served via a local server) or uses a placeholder/mock if running locally without a server.

### 1.2 Visualization
*   Display the audio spectrum/amplitude waveform on the main container.
*   The visualization must align with the `AudioTrackController`'s view window.
*   **Fix:** Ensure scrolling functionality works correctly in the audio track view.

## 2. Class Design Requirements

### 2.1 AudioSpectrum Class
*   **Purpose:** Manage the audio data and waveform generation.
*   **Properties:**
    *   `data`: Array of amplitude values.
    *   `step`: The time duration (in seconds) represented by each data point.
*   **Methods:**
    *   `loadFromFile(file)`: Decode audio data from a user-uploaded file.
    *   `loadFromUrl(url)`: Fetch and decode from a URL.
    *   `getSlice(start, end)`: Return data points for a specific time range (start and end in seconds).

