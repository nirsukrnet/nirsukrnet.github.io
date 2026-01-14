# Instr 1 — Transcript auto-align (auto-scroll) only while playing

Problem:
When clicking a transcript row like:

`<li data-idx="..." data-active="1" data-mark1="0" data-resp="0"> ... </li>`

the transcript scroll container (`#transWrap`) currently “auto-aligns” (auto-scrolls) the active row.
This is annoying when playback is **paused**, because the user wants to scroll freely and click lines without the UI forcing the scroll position.

## Required behavior

1. Auto-align is allowed only while **playing**
	- If playback state is **playing**, the app may auto-scroll the transcript so the active row stays near the top gap.
	- This includes the periodic time-loop that updates `activeIndex`.

2. No auto-align while **not playing**
	- If playback state is **paused** (or stopped/not started), do not auto-scroll `#transWrap`.
	- Clicking a row while paused should:
	  - set the active row highlight (and optionally seek the player if that is current behavior),
	  - but must NOT change the scrollTop of `#transWrap`.

3. Preserve manual scroll
	- While paused, user scrolling must be “free”: the app must not fight it.
	- While paused, repeated calls that update highlight must not re-align.

## Notes / constraints

- “Playing state” means the internal playback flag (example: `isPlaying === true`) and/or player state that indicates playback is running.
- The change should be enforced in the place that performs the auto-scroll (example: `updateActiveRow()` or any helper that scrolls the active `<li>` into view).
- The active highlight (`data-active="1"`) should still update both in playing and paused states.

## Acceptance checklist

- Start playback: active line follows time and auto-aligns as it changes.
- Pause playback: active highlight can change, but scroll position stays where the user left it.
- Click a transcript line while paused: highlight changes, no forced scroll jump.