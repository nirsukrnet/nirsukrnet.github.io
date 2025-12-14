# Instruction: Single Audio File Player Implementation

## Goal
Refactor `librosa1.html` to automatically load a specific audio file and visualize pre-calculated sound intervals from a JSON file.

## 1. Embed Audio Source
Instead of requiring the user to load a file via a file input dialog, hardcode the audio source to load:
`../phrase_audio/SW_Learn_Day_1-5.mp3`

Ensure the audio loads and the waveform/spectrum initializes automatically when the page opens.

## 2. Visualize Sound Intervals
Fetch and parse the interval data from:
`json/SW_Learn_Day_1-5_librosa.json`

The JSON contains a `sound_intervals` array where each element is `[start_time, end_time, label]`.

Draw semi-transparent colored rectangles overlaying the spectrums (`spectrum1` and `spectrum2`) corresponding to these time intervals:

*   **If Label is `0`**: Use **Red** color (indicates silence).
*   **If Label is `1`**: Use **Blue** color.

These rectangles should be drawn on the canvas or as overlay elements, synchronized with the timeline of both the main view (`spectrum2`) and the global view (`spectrum1`).


C:\Python\AuTr\html\test_librosa\edit_test6.html





