
# Instr: highlight transcript items with Mark1 and/or Resp

We already highlight transcript items when `Mark1` is set (background tint). Now we also want a visual indicator when an item has a saved **Resp** (AI explanation) stored in Firebase:

- Path: `DB_YOUTUBE2_ROOT + '/youtube_explanation/<videoId>'`
- Item: `items[<idx>]` (or object key `<idx>`)

Goal: show **both** states clearly:
- Mark1 only
- Resp only
- Mark1 + Resp together

## Recommended UI approach (non-conflicting indicators)
Use **one extra element** inside each transcript row to indicate Resp, and keep Mark1 as the existing background tint.

- Mark1 stays as background tint (already exists)
- Resp is indicated by a **3px bar** (`.highlight-explan`) inside the `li`
- Mark1 + Resp together uses the same bar element, just a different color/gradient

This makes the states stack instead of replacing each other.

## Suggested visuals

### Resp indicator
Use a dedicated 3px bar element inside the `li`.

### Color suggestions
- Mark1 tint: keep as is (low-contrast background)
- Resp: use a distinct color (e.g. teal/cyan) so it is not confused with the purple buttons
	- Example: `#0ea5e9` (sky) or `#14b8a6` (teal)

## Data flow recommendation
To highlight Resp without heavy per-line requests:

1) When switching video / loading transcript:
	 - Load the explanation document once: `GET .../youtube_explanation/<videoId>`
2) Build a fast lookup set of indices that have Resp:
	 - Note: in Firebase RTDB, `items` may be returned as an object (e.g. `{ "34": {...} }`) instead of an array.
	 - Use keys from either form:
	   - if array: iterate indices
	   - if object: `Object.keys(items)`
	 - Consider Resp present when the item has `text_b64` (and `enc === 'b64utf8'`).
3) During transcript render, set a dataset flag per `li`:
	 - `li.dataset.resp = hasResp ? '1' : '0'`

When saving Resp for an index:
- Update `respSet` immediately and re-render (or update just that `li`).

## Refactor (preferred): add a dedicated 3px highlight bar inside each `li`

Add a small extra element inside each transcript row so it’s explicit and easy to style.

### HTML structure
When rendering each transcript row (`#transList li`), prepend a bar element:

```html
<li data-idx="34" data-active="0" data-mark1="1" data-resp="1">
	<div class="highlight-explan"></div>
	<div class="trLine"><small>2:31</small><span>...</span></div>
	<div class="trLine trLine2"><span>...</span></div>
</li>
```

Notes:
- Keep `data-mark1` (existing) and add `data-resp` (new).
- `data-resp="1"` means this transcript index has a saved Resp.

### CSS for the bar
Make it a thin line at the top of the `li`:

```css
/* base: hidden bar */
#transList li { position: relative; }

.highlight-explan {
	height: 3px;
	width: 100%;
	border-radius: 2px;
	background: transparent;
}

/* Resp only: show teal */
#transList li[data-resp="1"] .highlight-explan {
	background: #14b8a6;
}

/* Mark1 + Resp: use a different color (or gradient) so both states are obvious */
#transList li[data-mark1="1"][data-resp="1"] .highlight-explan {
	background: linear-gradient(90deg, #14b8a6 0%, #0ea5e9 100%);
}

/* Optional: Mark1 only (if you want a bar for Mark1 too) */
/*
#transList li[data-mark1="1"] .highlight-explan { background: color-mix(in srgb, currentColor 45%, transparent); }
*/
```

Guidance:
- Keep Mark1 as the background tint (existing), and use the 3px bar primarily for Resp.
- Use a clearly different color/gradient for “both” to avoid confusion.

### Data flow reminder
Same as before:
- Load `.../youtube_explanation/<videoId>` once per video.
- Build a set/map of indices that have Resp.
- During render, set `li.dataset.resp = '1'` and include `<div class="highlight-explan"></div>`.

## Acceptance criteria
- Every transcript row can show: none / Mark1 / Resp / Mark1+Resp.
- Mark1 styling is not lost when Resp exists.
- Resp styling is visible even when Mark1 exists.
- Mark1 + Resp uses the same `.highlight-explan` div (only CSS changes based on `data-mark1` + `data-resp`).