// node --test voicetrain/dev/test_glue_batches.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const G = createRequire(import.meta.url)('../beta/glue_batches.js');
const IDS = ['2', '5', '6', '7', '8', '9', '10', '11', '12'];
const marks = Object.fromEntries(IDS.map((id) =>
  [id, JSON.parse(readFileSync(new URL(`../audio/lessons/${id}/marks.json`, import.meta.url), 'utf8'))]));
const lessons = (ids) => ids.map((id) => ({ id, marks: marks[id] }));
const run = (over = {}) => G.generate({
  lessons: lessons(IDS), known: {}, selection: { mode: 'range', from: 2, to: 12 }, n: 45, seed: 7, ...over,
});

test('batches hold N words, the last one is the remainder', () => {
  const gen = run();
  assert.ok(gen.pool_size > 45);
  const sizes = gen.batches.map((b) => b.words.length);
  assert.ok(sizes.slice(0, -1).every((s) => s === 45));
  assert.equal(sizes.at(-1), gen.pool_size - 45 * (sizes.length - 1));
  assert.deepEqual(gen.batches.map((b) => b.idx), sizes.map((_, i) => i + 1));
});

test('known words are left out, other words stay', () => {
  const all = run();
  const word = all.batches[0].words[0].word;
  const key = G.wordKey(word);
  const gen = run({ known: { [key]: 'x' } });
  const left = gen.batches.flatMap((b) => b.words).filter((w) => G.wordKey(w.word) === key);
  assert.equal(left.length, 0);
  assert.equal(gen.pool_size, all.pool_size - all.batches.flatMap((b) => b.words).filter((w) => G.wordKey(w.word) === key).length);
});

test('same seed gives the same batches, another seed another order', () => {
  assert.deepEqual(run().batches, run().batches);
  assert.notDeepEqual(run({ seed: 8 }).batches, run().batches);
});

test('words are shuffled across lessons, not grouped by lesson or alphabet', () => {
  const words = run().batches[0].words;
  assert.ok(new Set(words.map((w) => w.lesson_id)).size > 2);
  const sorted = [...words].map((w) => w.word).sort((a, b) => a.localeCompare(b));
  assert.notDeepEqual(words.map((w) => w.word), sorted);
});

test('a lesson without byte_marks is skipped', () => {
  const bare = { ...marks['2'], byte_marks: undefined };
  const gen = G.generate({
    lessons: [{ id: '2', marks: bare }, { id: '5', marks: marks['5'] }],
    known: {}, selection: { mode: 'list', ids: ['2', '5'] }, n: 45, seed: 1,
  });
  assert.deepEqual(gen.lessons, ['5']);
});

test('a word of two lessons stays as two copies with their own lesson_id', () => {
  const twin = { items: [{ word: 'hej', word_n: 1, step: 1 }], byte_marks: {} };
  const gen = G.generate({
    lessons: [{ id: '1', marks: twin }, { id: '2', marks: twin }],
    known: {}, selection: { mode: 'list', ids: ['1', '2'] }, n: 45, seed: 1,
  });
  assert.deepEqual(gen.batches[0].words.map((w) => w.lesson_id).sort(), ['1', '2']);
});

test('selectedIds: range and list', () => {
  assert.deepEqual(G.selectedIds({ mode: 'range', from: 6, to: 8 }, IDS), ['6', '7', '8']);
  assert.deepEqual(G.selectedIds({ mode: 'list', ids: ['9', '2', '99'] }, IDS), ['2', '9']);
});

test('FIFO: six generations leave five in history, the oldest is gone', () => {
  let doc = null;
  const ids = [];
  for (let i = 0; i < 7; i += 1) {
    const gen = { id: `g${i}`, batches: [] };
    ids.push(gen.id);
    doc = G.pushGeneration(doc, gen);
  }
  assert.equal(doc.current.id, 'g6');
  assert.deepEqual(doc.history.map((g) => g.id), ['g5', 'g4', 'g3', 'g2', 'g1']);
});

test('restore swaps the backup with the current generation', () => {
  let doc = null;
  for (const id of ['a', 'b', 'c']) doc = G.pushGeneration(doc, { id, batches: [] });
  doc = G.restoreGeneration(doc, 'a');
  assert.equal(doc.current.id, 'a');
  assert.deepEqual(doc.history.map((g) => g.id), ['c', 'b']);
  assert.equal(G.restoreGeneration(doc, 'nope').current.id, 'a');
});

test('a document without empty arrays (as Firebase returns it) still works', () => {
  assert.deepEqual(G.normalizeDoc({ current: { id: 'x' } }).history, []);
  assert.equal(G.normalizeDoc(null).current, null);
});

test('buildBatchMarks keeps every step of each word, unique steps, byte clips', () => {
  const gen = run();
  const batch = gen.batches[0];
  const built = G.buildBatchMarks(gen, batch, marks);
  assert.equal(built.lesson_id, `glue:${gen.id}:1`);
  const expected = batch.words.reduce((sum, w) =>
    sum + marks[w.lesson_id].items.filter((it) => it.word_n === w.word_n).length, 0);
  assert.equal(built.items.length, expected);
  assert.equal(new Set(built.items.map((it) => it.step)).size, built.items.length);
  for (const item of built.items) {
    assert.ok(item.sv_clip.bytes[1] > item.sv_clip.bytes[0]);
    assert.match(item.sv_clip.url, /^audio\/lessons\/\d+\/sv_auto\.mp3$/);
    assert.ok(item.word_n >= 1 && item.word_n <= batch.words.length);
  }
});

test('findBatch and remaining', () => {
  const gen = run();
  const doc = G.pushGeneration(null, gen);
  const id = G.batchLessonId(gen, gen.batches[1]);
  assert.equal(G.findBatch(doc, id).batch.idx, 2);
  assert.equal(G.findBatch(doc, 'glue:nope:1'), null);
  const first = gen.batches[1].words[0];
  assert.equal(G.remaining(gen.batches[1], { [G.wordKey(first.word)]: 'x' }), gen.batches[1].words.length - 1);
});

test('numOptions: N list is 1..150 step 1 with the current value marked', () => {
  const opts = G.numOptions('n', { n: 45 }, []);
  assert.equal(opts.length, 150);
  assert.deepEqual([opts[0].v, opts[149].v], [1, 150]);
  assert.deepEqual(opts.filter((o) => o.selected).map((o) => o.v), [45]);
});

test('numOptions: from cannot pass to, to cannot go below from', () => {
  const state = { from: 6, to: 10 };
  const from = G.numOptions('from', state, IDS);
  assert.deepEqual(from.filter((o) => o.disabled).map((o) => o.v), [11, 12]);
  assert.deepEqual(from.filter((o) => o.selected).map((o) => o.v), [6]);
  const to = G.numOptions('to', state, IDS);
  assert.deepEqual(to.filter((o) => o.disabled).map((o) => o.v), [2, 5]);
  assert.deepEqual(to.filter((o) => o.selected).map((o) => o.v), [10]);
});

test('range 2-12 turned into a list selects the same lessons', () => {
  const range = { mode: 'range', from: 2, to: 12 };
  const ids = G.selectedIds(range, IDS);
  assert.deepEqual(G.selectedIds({ mode: 'list', ids }, IDS), ids);
});
