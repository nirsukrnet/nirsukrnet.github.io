(function () {
  'use strict';

  const TECH_WORD_FIELDS = new Set(['status', 'createdAt', 'unknownAt', 'learnedAt', 'word_idx']);

  function cleanStr(x) {
    return (x == null) ? '' : String(x).trim();
  }

  function nowIso() {
    try { return new Date().toISOString(); } catch { return String(Date.now()); }
  }

  function normalizeCompare(s) {
    return cleanStr(s).replace(/\s+/g, '').toLowerCase();
  }

  function countWordsInText(s) {
    return cleanStr(s).split(/\s+/).filter(Boolean).length;
  }

  function hasTranslationValue(v) {
    return cleanStr(v).length > 0;
  }

  function stripWordForExport(word) {
    if (!word || typeof word !== 'object') return { word_sv: '', word_en: null, word_uk: null };
    return {
      word_sv: cleanStr(word.word_sv),
      word_en: hasTranslationValue(word.word_en) ? cleanStr(word.word_en) : null,
      word_uk: hasTranslationValue(word.word_uk) ? cleanStr(word.word_uk) : null
    };
  }

  function stripItemForExport(item) {
    if (!item || typeof item !== 'object') return null;
    return {
      sentence_idx: Number(item.sentence_idx),
      t: Number(item.t) || 0,
      text_sv: cleanStr(item.text_sv),
      text_en: cleanStr(item.text_en),
      text_uk: cleanStr(item.text_uk),
      words: (Array.isArray(item.words) ? item.words : []).map(stripWordForExport),
      phrase: (Array.isArray(item.phrase) ? item.phrase : [])
        .map(p => ({
          phrase_sv: cleanStr(p && p.phrase_sv),
          phrase_en: hasTranslationValue(p && p.phrase_en) ? cleanStr(p.phrase_en) : null,
          phrase_uk: hasTranslationValue(p && p.phrase_uk) ? cleanStr(p.phrase_uk) : null
        }))
        .filter(p => p.phrase_sv)
    };
  }

  function buildExportPayload(doc) {
    const videoId = cleanStr(doc && doc.videoId);
    const items = (doc && Array.isArray(doc.items) ? doc.items : [])
      .map(stripItemForExport)
      .filter(Boolean)
      .sort((a, b) => a.sentence_idx - b.sentence_idx);
    return { videoId, items };
  }

  function validateExportSwedish(payload) {
    const errors = [];
    (payload.items || []).forEach(item => {
      const idx = item.sentence_idx;
      if (!hasTranslationValue(item.text_sv)) {
        errors.push(`sentence_idx ${idx}: missing text_sv`);
      }
      (item.words || []).forEach((w, wi) => {
        if (!hasTranslationValue(w.word_sv)) {
          errors.push(`sentence_idx ${idx}, word #${wi + 1}: missing word_sv`);
        }
      });
    });
    return errors;
  }

  function validateImportSchema(data) {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push('Root must be a JSON object.');
      return errors;
    }
    if (!cleanStr(data.videoId)) errors.push('Missing videoId.');
    if (!Array.isArray(data.items)) {
      errors.push('Missing items array.');
      return errors;
    }

    data.items.forEach((item, i) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`items[${i}]: must be an object.`);
        return;
      }
      if (!Number.isFinite(Number(item.sentence_idx))) {
        errors.push(`items[${i}]: missing sentence_idx.`);
      }
      if (!Number.isFinite(Number(item.t))) {
        errors.push(`items[${i}]: missing t.`);
      }
      if (typeof item.text_sv !== 'string') errors.push(`items[${i}]: missing text_sv.`);
      if (typeof item.text_en !== 'string') errors.push(`items[${i}]: missing text_en.`);
      if (typeof item.text_uk !== 'string') errors.push(`items[${i}]: missing text_uk.`);
      if (!Array.isArray(item.words)) {
        errors.push(`items[${i}]: missing words array.`);
        return;
      }
      item.words.forEach((w, wi) => {
        if (!w || typeof w !== 'object' || Array.isArray(w)) {
          errors.push(`items[${i}].words[${wi}]: must be an object.`);
          return;
        }
        if (typeof w.word_sv !== 'string') errors.push(`items[${i}].words[${wi}]: missing word_sv.`);
        const extra = Object.keys(w).filter(k => !['word_sv', 'word_en', 'word_uk'].includes(k));
        if (extra.some(k => !TECH_WORD_FIELDS.has(k))) {
          /* allow unknown extra keys from hand-edited files */
        }
      });

      if (Object.prototype.hasOwnProperty.call(item, 'phrase')) {
        if (!Array.isArray(item.phrase)) {
          errors.push(`items[${i}]: phrase must be an array.`);
        } else {
          item.phrase.forEach((p, pi) => {
            if (!p || typeof p !== 'object' || Array.isArray(p)) {
              errors.push(`items[${i}].phrase[${pi}]: must be an object.`);
              return;
            }
            if (typeof p.phrase_sv !== 'string') errors.push(`items[${i}].phrase[${pi}]: missing phrase_sv.`);
            if (p.phrase_en != null && typeof p.phrase_en !== 'string') errors.push(`items[${i}].phrase[${pi}]: phrase_en must be a string or null.`);
            if (p.phrase_uk != null && typeof p.phrase_uk !== 'string') errors.push(`items[${i}].phrase[${pi}]: phrase_uk must be a string or null.`);
          });
        }
      }
    });

    return errors;
  }

  function getDbSentenceSv(dbDoc, transcript, sentenceIdx) {
    const idx = Number(sentenceIdx);
    const item = (dbDoc && Array.isArray(dbDoc.items))
      ? dbDoc.items.find(it => Number(it && it.sentence_idx) === idx)
      : null;
    if (item && hasTranslationValue(item.text_sv)) return cleanStr(item.text_sv);

    const row = Array.isArray(transcript) ? transcript[idx] : null;
    if (row) {
      const sv = cleanStr(row.text_sv || row.text);
      if (sv) return sv;
    }
    return '';
  }

  function getDbWordSvSet(dbDoc, transcript, sentenceIdx) {
    const idx = Number(sentenceIdx);
    const set = new Map();

    const item = (dbDoc && Array.isArray(dbDoc.items))
      ? dbDoc.items.find(it => Number(it && it.sentence_idx) === idx)
      : null;
    if (item && Array.isArray(item.words)) {
      item.words.forEach(w => {
        const sv = cleanStr(w && w.word_sv);
        if (sv) set.set(normalizeCompare(sv), sv);
      });
    }

    if (set.size === 0) {
      const row = Array.isArray(transcript) ? transcript[idx] : null;
      const textSv = row ? cleanStr(row.text_sv || row.text) : '';
      textSv.split(/\s+/).filter(Boolean).forEach(w => set.set(normalizeCompare(w), w));
    }

    return set;
  }

  function validateImportSwedishMatch(payload, dbDoc, transcript) {
    const mismatches = [];

    (payload.items || []).forEach(item => {
      const idx = Number(item.sentence_idx);
      const dbSv = getDbSentenceSv(dbDoc, transcript, idx);
      const impSv = cleanStr(item.text_sv);
      if (dbSv && impSv && normalizeCompare(dbSv) !== normalizeCompare(impSv)) {
        mismatches.push(`sentence_idx ${idx}: text_sv differs from DB ("${impSv}" vs "${dbSv}")`);
      }

      const dbWords = getDbWordSvSet(dbDoc, transcript, idx);
      (item.words || []).forEach((w, wi) => {
        const impWord = cleanStr(w.word_sv);
        if (!impWord) return;
        const key = normalizeCompare(impWord);
        if (dbWords.size === 0) return;
        let found = false;
        for (const dbKey of dbWords.keys()) {
          if (dbKey === key) { found = true; break; }
        }
        if (!found) {
          mismatches.push(`sentence_idx ${idx}, word #${wi + 1}: word_sv "${impWord}" not found in DB`);
        }
      });
    });

    return mismatches;
  }

  function itemHasSentenceTranslation(item) {
    return hasTranslationValue(item.text_en) || hasTranslationValue(item.text_uk);
  }

  function wordHasTranslation(word) {
    return hasTranslationValue(word.word_en) || hasTranslationValue(word.word_uk);
  }

  function analyzeImportTranslations(payload) {
    let translatedWordCount = 0;
    const missing = [];

    (payload.items || []).forEach(item => {
      const idx = Number(item.sentence_idx);
      if (!itemHasSentenceTranslation(item)) {
        missing.push(`sentence_idx ${idx}: sentence has no text_en or text_uk`);
      }
      (item.words || []).forEach((w, wi) => {
        const sv = cleanStr(w.word_sv);
        if (!sv) return;
        if (wordHasTranslation(w)) {
          translatedWordCount += 1;
        } else {
          missing.push(`sentence_idx ${idx}, word "${sv}": missing word_en and word_uk`);
        }
      });
    });

    return { translatedWordCount, missing };
  }

  function buildImportReport(missingLines) {
    const lines = [
      'Translation import report',
      'Missing or empty translations:',
      ''
    ];
    missingLines.forEach(line => lines.push(`- ${line}`));
    return lines.join('\n');
  }

  function findExistingWord(words, wordSv) {
    const key = normalizeCompare(wordSv);
    return (Array.isArray(words) ? words : []).find(w => normalizeCompare(w && w.word_sv) === key) || null;
  }

  function mergeImportIntoDbDoc(dbDoc, payload) {
    const videoId = cleanStr(dbDoc && dbDoc.videoId) || cleanStr(payload.videoId);
    const out = {
      videoId,
      updatedAt: nowIso(),
      items: Array.isArray(dbDoc && dbDoc.items)
        ? dbDoc.items.map(it => ({
          ...it,
          words: [...(it.words || [])],
          phrase: [...(it.phrase || [])]
        }))
        : []
    };

    (payload.items || []).forEach(srcItem => {
      const sentenceIdx = Number(srcItem.sentence_idx);
      let item = out.items.find(it => Number(it && it.sentence_idx) === sentenceIdx);
      if (!item) {
        item = {
          sentence_idx: sentenceIdx,
          t: Number(srcItem.t) || 0,
          text_sv: cleanStr(srcItem.text_sv),
          text_en: cleanStr(srcItem.text_en),
          text_uk: cleanStr(srcItem.text_uk),
          words: [],
          phrase: []
        };
        out.items.push(item);
      } else {
        item.t = Number(srcItem.t) || item.t || 0;
        item.text_sv = cleanStr(srcItem.text_sv) || item.text_sv || '';
        item.text_en = cleanStr(srcItem.text_en);
        item.text_uk = cleanStr(srcItem.text_uk);
        if (!Array.isArray(item.words)) item.words = [];
        if (!Array.isArray(item.phrase)) item.phrase = [];
      }

      (srcItem.words || []).forEach(srcWord => {
        const sv = cleanStr(srcWord.word_sv);
        if (!sv) return;
        let wordRec = findExistingWord(item.words, sv);
        const now = nowIso();
        if (!wordRec) {
          wordRec = {
            word_sv: sv,
            word_en: hasTranslationValue(srcWord.word_en) ? cleanStr(srcWord.word_en) : null,
            word_uk: hasTranslationValue(srcWord.word_uk) ? cleanStr(srcWord.word_uk) : null,
            status: 'unknown',
            createdAt: now,
            unknownAt: now,
            learnedAt: null
          };
          item.words.push(wordRec);
        } else {
          wordRec.word_sv = sv;
          wordRec.word_en = hasTranslationValue(srcWord.word_en) ? cleanStr(srcWord.word_en) : null;
          wordRec.word_uk = hasTranslationValue(srcWord.word_uk) ? cleanStr(srcWord.word_uk) : null;
        }
      });

      if (Array.isArray(srcItem.phrase)) {
        item.phrase = srcItem.phrase
          .map(srcPhrase => ({
            phrase_sv: cleanStr(srcPhrase && srcPhrase.phrase_sv),
            phrase_en: hasTranslationValue(srcPhrase && srcPhrase.phrase_en) ? cleanStr(srcPhrase.phrase_en) : null,
            phrase_uk: hasTranslationValue(srcPhrase && srcPhrase.phrase_uk) ? cleanStr(srcPhrase.phrase_uk) : null
          }))
          .filter(p => p.phrase_sv);
      }
    });

    out.items.sort((a, b) => Number(a.sentence_idx) - Number(b.sentence_idx));
    return out;
  }

  function mergeImportIntoTranscript(transcript, payload) {
    const rows = Array.isArray(transcript) ? transcript.map(r => ({ ...r })) : [];
    (payload.items || []).forEach(item => {
      const idx = Number(item.sentence_idx);
      if (!Number.isFinite(idx) || idx < 0 || idx >= rows.length) return;
      const row = rows[idx];
      if (!row || typeof row !== 'object') return;
      if (hasTranslationValue(item.text_en)) row.text_en = cleanStr(item.text_en);
      if (hasTranslationValue(item.text_uk)) row.text_uk = cleanStr(item.text_uk);
    });
    return rows;
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function downloadText(filename, text) {
    const blob = new Blob([String(text || '')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  window.TranslationMode = {
    cleanStr,
    normalizeCompare,
    buildExportPayload,
    validateExportSwedish,
    validateImportSchema,
    validateImportSwedishMatch,
    analyzeImportTranslations,
    buildImportReport,
    mergeImportIntoDbDoc,
    mergeImportIntoTranscript,
    downloadJson,
    downloadText
  };
})();
