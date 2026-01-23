# instr_12 — Compact Controls Row (like yout_pl2)

## Goal
Make the main controls row in `rec_voice.html` compact and visually consistent with the controls row used in `yout_pl2.html`.

This is **UI-only refactor**: keep all existing button IDs and JS behavior the same.

## Target (rec_voice.html)
The row currently containing:
- `btnRec`
- `btnYtBeg`, `btnYtPrev`, `btnYtNext`
- `btnEndPhrase`
- `btnCMenu`

## Desired Layout
Update the markup to follow the same pattern as `yout_pl2.html` controls:
- Use `class="row controls"` on the container.
- Give each button a compact button class (prefer reusing `yu2-btn` + modifier classes).
- Push the Menu button to the far right with `style="margin-left:auto;"` (same as `yout_pl2.html`).

Additionally (key requirement):
- The controls row must be **docked at the bottom of the page** and **stay visible while scrolling**.
- It must be rendered **over other content/layers** (use `position: fixed` and a high enough `z-index`).

Example shape (IDs must stay unchanged):
```html
<div class="row controls">
    <button id="btnRec" class="yu2-btn yu2-btn--play" type="button" data-state="idle">R en</button>
    <button id="btnYtBeg" class="yu2-btn yu2-btn--tool" type="button" title="Go to beginning">Beg</button>
    <button id="btnYtPrev" class="yu2-btn yu2-btn--tool" type="button" title="Previous">Prev</button>
    <button id="btnYtNext" class="yu2-btn yu2-btn--tool" type="button" title="Next">Next</button>
    <button id="btnEndPhrase" class="yu2-btn yu2-btn--tool" type="button" title="End phrase: move current text to history">E</button>
    <button id="btnCMenu" class="yu2-btn yu2-btn--tool" type="button" title="Menu" style="margin-left:auto;">⋯</button>
</div>
```

## CSS / Styling
`rec_voice.html` must include the minimal CSS needed for these classes.

Requirements:
- Buttons must be compact (same visual density as `yout_pl2.html`).
- All buttons share the same height (≈32px) and consistent padding.
- Remove per-button inline sizing (e.g. `min-height:32px; padding:6px 10px;`) where possible and replace with class-based styling.
- The controls row should not waste horizontal space; `⋯` is aligned to the right edge.

Docking requirements:
- `.row.controls` is `position: fixed` with `bottom: 12px` (or similar), and uses left/right insets so it fits on mobile.
- `.row.controls` has `z-index` high enough to appear above transcript/history panels and dialogs.
- `.row.controls` background is **transparent like `yout_pl2.html`**. Readability comes from the control button styling (e.g., `.row.controls button { background: transparent; }` and `.yu2-btn--tool` having a colored background).
- The page reserves space for the fixed bar using `body { padding-bottom: <bar height> }` so content isn’t hidden behind it.
- On small screens, the controls row may scroll horizontally: `overflow-x: auto; flex-wrap: nowrap;`.

Implementation note:
- Either (A) copy the minimal `.yu2-btn` styles from `yout_pl2.html` into `rec_voice.html`, or (B) create equivalent styles with the same class names so the markup matches.

## Acceptance Criteria
- The controls row visually matches the compact style of `yout_pl2.html`.
- `btnCMenu` is right-aligned using `margin-left:auto`.
- The controls row stays visible (fixed) at the bottom while scrolling.
- The controls row is above other layers (no clipping / hidden behind panels).
- Main content is not obscured by the fixed controls bar (bottom padding present).
- No JS breaks: all existing IDs remain and all buttons continue working.
- No overlaps with the floating Sessions button.