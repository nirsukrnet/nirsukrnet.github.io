## Save/restore playback time + transcript UI position

**Goal**: remember the last playback time and transcript scroll position for each selected YouTube video, so when the same video is opened again the player seeks to the saved time and the transcript panel scrolls back to where the user left off.

### What to store
- **Playback time** (seconds) for the current video.
- The current transcript **scroll position** (scrollTop) for the transcript panel.

### When to store
- Persist the state **periodically** (about every **30 seconds**, or only if at least 30 seconds passed since the last save).
- Save only if something changed (time or scrollTop).

### Where to store (FB DB)
- Save under `/ref_youtube_videos` for the **currently selected video id**.

### Restore behavior
- When a video is loaded/opened again:
	- Read the saved playback time + scroll position for that video id.
	- Seek the player to the saved time.
	- Scroll the transcript panel to the last saved position.

### UI setting (timestamps)
- Add a Menu toggle to **show/hide timestamps** in the transcript panel.
- Persist this setting in FB (UI state for yout_pl2) and apply it on startup.

