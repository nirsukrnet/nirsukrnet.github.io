## Goal
Add a compact **page number input** near the `FW` button in `pdf_viewer/pdf_main.html`.

This input lets the user type a page number and jump to it.

---

## UI placement
- Place the input **immediately after** the button:
	`<button id="btnFitWidth" type="button">FW</button>`
- The input must be small (minimal width) and not break the bottom bar layout.

Suggested element:

```html
<input id="inGotoPage" type="number" inputmode="numeric" min="1" step="1" placeholder="#" />
```

Suggested styling:
- `width: 22px` (or similar)
- same height as buttons (`min-height: 14px`)
- tabular numeric font is OK

---

## Behavior
### When clicking Next (`>` button)
If the page input has a valid value:
- Navigate to that page number (clamped to `1..pdfDoc.numPages`)
- Clear the input after navigation (optional but recommended)

If the input is empty or invalid:
- Keep the existing behavior: go to the next page (`pageNum + 1`)

### Optional (recommended)
Pressing `Enter` inside the input should also navigate to the entered page.

---

## Validation rules
- Accept only integers.
- Ignore `0`, negative, `NaN`, empty.
- Clamp values above last page to last page.
