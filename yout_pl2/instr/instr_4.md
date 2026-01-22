## Change request: History order + meta visibility

Target page:
- `C:\Python\AuTr\html\rec_voice.html`

Target UI area:
- History list container: `#history`

---

## 1) History order (sorting)
When a new finalized segment is added to `#history`:
- Newest items must appear **at the top**.
- Older items must move **down**.

In other words:
- **Up** = latest/new item
- **Down** = older items

Implementation hint:
- When adding an item, insert it at the beginning (`prepend`) instead of appending.

---

## 2) Meta line visibility (setting)
Each history item may include a meta line:
- `.meta` (time + language)

Add a UI setting:
- Toggle **Show/Hide meta** for history items.
- Default: **meta is hidden**.

Behavior:
- When meta is hidden, `.meta` is not displayed, but the history text remains.
- When meta is shown, `.meta` becomes visible for all history items.

Implementation hint:
- Use a container flag such as `#history[data-show-meta="0|1"]` and CSS to show/hide `.meta`.
- Persisting the setting is optional unless specified later.
