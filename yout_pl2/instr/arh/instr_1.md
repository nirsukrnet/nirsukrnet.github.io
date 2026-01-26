## Goal
Create a new page: `rec_voice.html` for live speech-to-text from the microphone.

## UI requirements
- **Language selector** (listbox / select):
	- Ukrainian (`uk-UA`)
	- English (`en-US`)
	- Swedish (`sv-SE`)
- **Microphone permission button**:
	- Default label: `Permission mic`
	- If permission is already granted / not needed, show status in the button title/label (e.g., `Mic: allowed`)
	- If permission is denied, show status (e.g., `Mic: denied`) and provide a hint to enable it in browser/site settings
- **Recognition button** with two states:
	- Idle: `Start recognition`
	- Recording: `Stop recognition`
- **Transcript output panel** below the controls:
	- Scrollable area
	- Continuously appends recognized text
	- Always keeps the latest spoken text visible (auto-scroll to bottom)
	- Clearly shows the **latest spoken segment** (“last frame of speaking”)

## Behavior
- On `Permission mic`:
	- Trigger the browser microphone permission prompt (if needed)
	- If permission is granted, update the button label to reflect status (e.g., `Mic: allowed`)
	- If permission is denied, update the button label to reflect status (e.g., `Mic: denied`)
- On `Start recognition`:
	- Ensure microphone permission is available (request it only if still needed)
	- Start speech recognition in the selected language
	- Switch button text/state to `Stop recognition`
- While recording:
	- Update the output panel in real time
	- Keep a distinct “latest segment” line/area updated as the user speaks
- On `Stop recognition`:
	- Stop recognition
	- Switch button back to `Start recognition`

## Acceptance criteria
- Language choice affects recognition language immediately (at latest on next start).
- `Permission mic` button requests permission when needed and reflects the current permission state in its label/title.
- Starting recognition does not re-prompt for permission if it is already granted.
- Output panel scrolls and preserves history of recognized segments.
- Latest segment is visually distinguishable from earlier text.
- The UI state always matches the actual recording state.

## Notes (implementation)
- Prefer the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) when available.
- To explicitly request mic permission, you can call `navigator.mediaDevices.getUserMedia({ audio: true })` and immediately stop the tracks after permission is granted.
- If not supported, show a clear message (e.g., “Speech recognition not supported in this browser”).

