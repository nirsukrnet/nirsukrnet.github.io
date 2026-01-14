## Task: style button groups + add “AI copy” helper

### 1) Add a shared CSS class for the top action buttons
Apply one common class to these buttons so they can be styled consistently:

```html
<button id="btnMark1" class="yu2-btn yu2-btn--tool">Mr</button>
<button id="btnMrkOff" class="yu2-btn yu2-btn--tool">MOFF</button>
<button id="btnMenu" class="yu2-btn yu2-btn--tool" style="margin-left:auto;">Menu</button>
```

Notes:
- Keep `margin-left:auto` on `btnMenu` (or move this to CSS later) so it stays aligned to the right.

### 2) Use a different CSS class for the play/time button
The play/time button should be styled differently from the “tool” buttons:

```html
<button id="btnPlay" class="yu2-btn yu2-btn--play" data-state="pause">4:56</button>
```

### 3) Add an “AI copy” button
Add a button that copies a ready-to-paste prompt to the clipboard:

```html
<button id="btnAIcopy" class="yu2-btn yu2-btn--tool" title="Copy grammar prompt">AI</button>
```

### 4) Clipboard template
On click of `btnAIcopy`, copy exactly this text (with the selected text inserted):

```text
Provide a grammatical explanation for these sentences/phrase: "<current selected text (lang1)>"
```

Behavior details:
- Use the *current selection* from the lang1 text area/view.
- If there is no selection, either copy an empty placeholder or show a small warning (your choice, but be consistent).

### Acceptance criteria
- Tool buttons (`Mr`, `MOFF`, `Menu`, `AI`) share one class for styling.
- Play/time button has a separate class.
- Clicking `AI` places the template text into the clipboard with the current selection inserted.





