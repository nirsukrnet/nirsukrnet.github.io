// Glue batches: unlearned words of many lessons, shuffled and cut into batches of N words.
// Pure functions only (no DOM, no network), so node can test them. The page uses them as window.GlueBatches.
(function (root) {
  'use strict';

  const HISTORY_LIMIT = 5;

  function wordKey(word) {
    return String(word).trim().toLowerCase().replace(/[.$#[\]/]/g, '_');
  }

  function seededRandom(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    }
    return () => {
      h = (h + 0x6d2b79f5) | 0;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function looksAlike(groupA, groupB) {
    const a = String(groupA[0]?.word || '').toLowerCase();
    const b = String(groupB[0]?.word || '').toLowerCase();
    return a.length >= 2 && a.slice(0, 2) === b.slice(0, 2);
  }

  // The same seed always gives the same order, so a saved place stays valid on every device.
  function shuffledApart(groups, seed) {
    const random = seededRandom(String(seed));
    const out = groups.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    for (let i = 1; i < out.length; i += 1) {
      if (!looksAlike(out[i - 1], out[i])) continue;
      const j = out.findIndex((group, k) => k > i && !looksAlike(out[i - 1], group));
      if (j > 0) [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Lesson ids picked by the user: a code range or an explicit list; only ids that can be glued.
  function selectedIds(selection, availableIds) {
    const avail = availableIds.map(String);
    if (selection.mode === 'list') {
      const wanted = new Set((selection.ids || []).map(String));
      return avail.filter((id) => wanted.has(id));
    }
    const from = Number(selection.from);
    const to = Number(selection.to);
    return avail.filter((id) => Number(id) >= from && Number(id) <= to);
  }

  // One entry per word of the lesson (first step of the word), not yet known.
  function unlearnedWords(lessonId, marks, known) {
    const seen = new Set();
    const words = [];
    for (const item of marks.items || []) {
      if (!item.word) continue;
      const key = wordKey(item.word);
      if (seen.has(key) || known[key]) continue;
      seen.add(key);
      words.push({ lesson_id: String(lessonId), word: item.word, word_n: item.word_n || 0 });
    }
    return words;
  }

  // lessons: [{ id, marks }]. A word present in two lessons stays as two copies, each with its own lesson_id.
  function generate({ lessons, known, selection, n, seed, now }) {
    const size = Math.max(1, Math.trunc(Number(n)) || 1);
    const usable = lessons.filter((lesson) => lesson.marks && lesson.marks.byte_marks);
    const pool = [];
    const used = [];
    for (const lesson of usable) {
      const words = unlearnedWords(lesson.id, lesson.marks, known);
      if (words.length) used.push(String(lesson.id));
      pool.push(...words);
    }
    const shuffled = shuffledApart(pool.map((word) => [word]), seed).map((group) => group[0]);
    const batches = [];
    for (let i = 0; i < shuffled.length; i += size) {
      batches.push({ idx: batches.length + 1, words: shuffled.slice(i, i + size) });
    }
    const stamp = (now || new Date()).toISOString();
    return {
      id: `g${stamp.replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
      created_at: stamp,
      n: size,
      selection,
      lessons: used,
      seed,
      pool_size: pool.length,
      batches,
    };
  }

  // Firebase drops empty arrays and nulls, so a stored document may lack both fields.
  function normalizeDoc(doc) {
    const body = doc && typeof doc === 'object' ? doc : {};
    return {
      current: body.current || null,
      history: Array.isArray(body.history) ? body.history.filter(Boolean) : [],
    };
  }

  // The new generation becomes current; the previous one goes first into history, FIFO of 5.
  function pushGeneration(doc, generation) {
    const base = normalizeDoc(doc);
    const history = base.current ? [base.current, ...base.history] : base.history;
    return { current: generation, history: history.slice(0, HISTORY_LIMIT) };
  }

  // Swap: the chosen backup becomes current, and the current one takes its place in history.
  function restoreGeneration(doc, id) {
    const base = normalizeDoc(doc);
    const picked = base.history.find((gen) => gen.id === id);
    if (!picked) return base;
    const rest = base.history.filter((gen) => gen.id !== id);
    const history = base.current ? [base.current, ...rest] : rest;
    return { current: picked, history: history.slice(0, HISTORY_LIMIT) };
  }

  function findBatch(doc, batchLessonId) {
    const match = /^glue:(.+):(\d+)$/.exec(String(batchLessonId));
    if (!match) return null;
    const base = normalizeDoc(doc);
    const generation = [base.current, ...base.history].find((gen) => gen && gen.id === match[1]);
    const batch = generation && generation.batches.find((b) => b.idx === Number(match[2]));
    return batch ? { generation, batch } : null;
  }

  function batchLessonId(generation, batch) {
    return `glue:${generation.id}:${batch.idx}`;
  }

  function remaining(batch, known) {
    return batch.words.filter((w) => !known[wordKey(w.word)]).length;
  }

  // marksById: { lessonId: marks.json }. The result is a regular auto lesson whose steps carry byte clips.
  function buildBatchMarks(generation, batch, marksById) {
    const items = [];
    let first = null;
    batch.words.forEach((w, pos) => {
      const marks = marksById[w.lesson_id];
      if (!marks) return;
      first = first || marks;
      const lesson = Number(w.lesson_id);
      for (const item of marks.items || []) {
        if ((item.word_n || 0) !== w.word_n) continue;
        const copy = { ...item, step: lesson * 100000 + item.step, word_n: pos + 1, lesson_id: w.lesson_id };
        for (const lang of ['sv', 'uk', 'en']) {
          if (!item[`${lang}_bytes`] || !marks[`${lang}_file`]) continue;
          copy[`${lang}_clip`] = {
            url: `audio/lessons/${w.lesson_id}/${marks[`${lang}_file`]}`,
            bytes: item[`${lang}_bytes`],
            cut: item[`${lang}_cut`],
          };
        }
        items.push(copy);
      }
    });
    return {
      mode: 'auto',
      lesson_id: batchLessonId(generation, batch),
      pause_sec: first?.pause_sec ?? 0.6,
      translation_lang: first?.translation_lang || 'uk',
      translation_focus: first?.translation_focus || 'f1',
      items,
    };
  }

  const api = {
    HISTORY_LIMIT, wordKey, seededRandom, shuffledApart, selectedIds, unlearnedWords, generate,
    normalizeDoc, pushGeneration, restoreGeneration, findBatch, batchLessonId, remaining, buildBatchMarks,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GlueBatches = api;
})(typeof window !== 'undefined' ? window : globalThis);
