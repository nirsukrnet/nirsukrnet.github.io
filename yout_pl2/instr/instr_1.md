
# yout_pl2 — “Now playing” highlight (continuous update loop)

## Where continuous updates happen

The “now playing” highlight is driven by a **timer loop** (a `setInterval`) that runs every **250ms**.

Conceptually, each tick does:

1. Read current playback time from the YouTube player (`player.getCurrentTime()`).
2. Update the Play/Pause button label to show time.
3. If the transcript panel is visible, compute which transcript row matches current time.
4. If the active row changed, update DOM attributes to reflect the new active row.

The loop is in `yout_pl2.html` and looks like this (simplified):

```js
// time + highlight loop
setInterval(() => {
	if (!player || typeof player.getCurrentTime !== 'function') return;
	const t = player.getCurrentTime();

	updatePlayButtonLabel(t);
	if (isTimeVisible()) {
		document.getElementById('t').textContent = Number(t || 0).toFixed(2);
	}

	const wrap = document.getElementById('transWrap');
	if (wrap.style.display !== 'block') return;

	const idx = findActiveByTime(t);
	if (idx !== activeIndex) {
		activeIndex = idx;
		updateActiveRow();
	}
}, 250);
```

## How the active row is selected

### `findActiveByTime(t)`

This function scans the transcript array and returns the index `i` such that:

`transcript[i].t <= t < transcript[i+1].t`

(for the last row, `end = +Infinity`).

### `updateActiveRow()`

This function applies the active row to the DOM by setting an attribute on each `<li>`:

- active row: `li.dataset.active = '1'`
- non-active rows: `li.dataset.active = '0'`

It also performs **auto-scroll** to keep the active row near the top of the transcript panel.
The top gap is controlled by:

```js
const TRANS_ACTIVE_ROW_TOP_GAP_PX = 90;
```

## How highlighting is implemented (CSS)

The UI highlight is CSS-driven using the `data-active` attribute on transcript list items:

- Active row has `data-active="1"`
- Mark1 rows have `data-mark1="1"`

### Refactor: active highlight uses border-style (not background)

To avoid using `background-color` for “now playing”, the active row highlight is implemented with a **border-like inset** (a `box-shadow`), which does not change layout like a real `border` can.

#### Spacing between border and text

The inset border is drawn at the edge of the `<li>`. To control how close it appears to the text, adjust the padding on transcript rows:

```css
#transList li {
	padding: 6px 0px; /* vertical padding only (left/right = 0) */
}
```

```css
#transList li[data-active="1"] {
	/* “Now playing” highlight: border-style (no layout shift) */
	box-shadow: inset 0 0 0 2px color-mix(in srgb, currentColor 45%, transparent);
}
```

Mark1 highlighting can still use background tint, and when a row is both Active + Mark1 we keep the Mark1 tint and strengthen the active border:

```css
#transList li[data-mark1="1"] {
	background-color: color-mix(in srgb, currentColor 9%, transparent);
}

#transList li[data-active="1"][data-mark1="1"] {
	box-shadow: inset 0 0 0 2px color-mix(in srgb, currentColor 55%, transparent);
}
```

