## Goal

File: `C:\Python\AuTr\html\assets\js\trans_new\sent_trans_nw_core.js`

In `ParseButton_Onclick(id_block, tr_sentences)` we parse pasted translation text back into sentence rows.
The pasted text contains *time delimiters* (e.g. `81:80`) which we use to locate where each translated sentence begins in the big pasted text.

Problem: sometimes a delimiter for a sentence id is missing (or not found by search), so that sentence cannot be extracted and we log:

`-------Delimiter <time> not found id <n>.`

Example:
- begin = `81:80`, end = `127:50`, added ids = `14 - 15 - 16 - 17`
- but delimiters for ids `15`, `16`, `17` are not found
- we still know the *segment bounds* (begin, end) that contains the translations for ids 14..17

We need a helper that can fill missing delimiters by splitting the text segment *proportionally* by the source sentence lengths.

## New function to implement

Add a helper:

```js
function ProccesMissedidTimeMark(idsent_begin, indx1, tr_sent_arr1, entire_text1)
```

### Inputs

- `idsent_begin` (number|string)
	- the first sentence id in the problematic run (the id for which we DID find a delimiter / anchor)
- `indx1` (number)
	- index in `tr_sent_arr1` where `idsent_begin` sits
- `tr_sent_arr1` (array)
	- array of sentence objects for the current parse block
	- each item has at least:
		- `idsentence`
		- `sentence_from`
		- `id_time_delim` (expected delimiter string)
- `entire_text1` (string)
	- the full pasted text (or the current block text) that contains delimiters + translated content

### Output

Return a list of “recovered” items (or apply in-place), so caller can continue parse without losing sentences.

Recommended return shape (simple):

```js
{
	fixed: Array<{ idsentence, startIndex, endIndex, extractedText }>,
	nextIndex: number // where the caller should continue scanning
}
```

If you prefer in-place mutations, still return debug info to make it testable.

## When to call it

Inside `ParseButton_Onclick` when:

1) We successfully found a begin delimiter for some id (`idsent_begin`).
2) We know we’re adding a run like `14 - 15 - 16 - 17`.
3) One or more delimiters inside that run are missing (not found in `entire_text1`).
4) We DO have an `end` boundary delimiter that exists (the delimiter after the run).

This helper is only for the case “missing internal delimiters, but run begin and run end exist”.

## Algorithm (proportional split)

Given a run of sentence ids: `run = tr_sent_arr1[indx1 ... indxEnd]`.

1) Determine `beginDelim` and `endDelim`.
	 - `beginDelim` = delimiter of `run[0]` (the one we found)
	 - `endDelim` = delimiter of the sentence immediately after the run, OR the next delimiter found in the text after `beginDelim`.
	 - If `endDelim` cannot be found, abort and return empty (don’t guess).

2) Find indices in text:
	 - `posBegin = entire_text1.indexOf(beginDelim)`
	 - `posEnd = entire_text1.indexOf(endDelim, posBegin + beginDelim.length)`
	 - `segment = entire_text1.slice(posBegin + beginDelim.length, posEnd)`

3) Split `segment` into N parts, where N = run length.
	 - Compute weights using `sentence_from` lengths:
		 - `w_i = max(1, length(sentence_from_i))`
		 - `W = sum(w_i)`
	 - Allocate character boundaries:
		 - `start_0 = 0`
		 - `end_i = round((sum_{k<=i} w_k / W) * segment.length)`
		 - `part_i = segment.slice(start_i, end_i)`
	 - IMPORTANT: adjust each `end_i` to the nearest whitespace (space/newline/tab) near that index,
	   so we don’t split in the middle of a word. Keep boundaries monotonic (`end_i >= start_i`).
	 - Trim each `part_i` (spaces/newlines), but do not delete meaningful punctuation.

4) Return extracted parts mapped to sentence ids.

## Edge cases / safety rules

- If `segment.length` is too small (< run length), do not split; return empty.
- If any `sentence_from` is missing, treat its weight as 1.
- Never allow overlapping or decreasing boundaries.
- If `posBegin === -1` or `posEnd === -1` or `posEnd <= posBegin`, return empty.
- Keep the original logging, but add one log line summarizing the recovery:
	- beginDelim, endDelim, ids, segmentLen.

## Acceptance checklist

- For a run `14 - 15 - 16 - 17` where only `14` and the next delimiter exist:
	- `ProccesMissedidTimeMark` returns 4 extracted strings
	- the caller assigns them as `sentence_to` for ids 14..17
	- no “Delimiter not found” logs for 15..17 in this case
- For runs where end delimiter is missing:
	- helper returns empty and caller keeps existing behavior (logs error)

## Notes

- This is a heuristic; it’s acceptable if splits are approximate, but it must be deterministic.
- Keep changes isolated: only new helper + minimal integration in `ParseButton_Onclick`.




