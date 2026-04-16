/**
 * Builds public/content/root_index.json from scripts/data/quran-morphology.txt
 * (Quranic Arabic Corpus morphology v0.4, mustafa0x fork).
 *
 * Output shape:
 * {
 *   roots: {
 *     "كتب": {
 *       occurrences: 319,
 *       lemmas: { "كِتاب": { pos: "N", count: 200, ... }, "كَتَبَ": { pos: "V", vf: "1", count: 50 } },
 *       ayahs: [ { s: 2, a: 2, words: [{ w: "كِتاب", lem: "كِتاب", pos: "N", seg: "1:2" }] } ]
 *     }
 *   },
 *   words: {
 *     "كتاب": ["كتب"],   // normalised word → root(s)
 *   },
 *   meta: { totalRoots, totalWords, generatedAt }
 * }
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT = path.join(__dirname, 'data', 'quran-morphology.txt');
const OUTPUT = path.join(__dirname, '..', 'public', 'content', 'root_index.json');

const DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
function stripDiacritics(s) {
  return s.replace(DIACRITICS_RE, '');
}
function normalise(s) {
  return stripDiacritics(s)
    .replace(/[ٱإأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

const lines = fs.readFileSync(INPUT, 'utf-8').split('\n').filter(Boolean);
console.log(`Parsing ${lines.length} morphological segments...`);

// --- Phase 1: collect per-ayah word segments, grouped by (sura, aya, wordIdx) ---

// Each line is: sura:aya:word:seg \t text \t POS \t features
// A Quranic "word" may have multiple segments (prefix, stem, suffix).
// We want per-word info, so group by (sura, aya, wordIdx).

const wordMap = new Map(); // "sura:aya:word" → { text[], root, lemma, pos, vf, features[] }

for (const line of lines) {
  const [ref, text, pos, feats] = line.split('\t');
  if (!ref || !feats) continue;
  const [s, a, w] = ref.split(':').map(Number);
  const key = `${s}:${a}:${w}`;

  if (!wordMap.has(key)) {
    wordMap.set(key, { s, a, w, textParts: [], root: null, lemma: null, pos: null, vf: null, gender: null, number: null, features: [] });
  }
  const entry = wordMap.get(key);
  entry.textParts.push(text);

  const isStem = pos === 'N' || pos === 'V';
  const featParts = feats.split('|');
  const isSuffix = featParts.includes('SUFF');
  const isPrefix = featParts.includes('PREF');

  for (const fp of featParts) {
    // Only take ROOT/LEM from stem segments (not prefix/suffix particles like نَّ emphatic)
    if (fp.startsWith('ROOT:') && isStem) entry.root = fp.slice(5);
    else if (fp.startsWith('LEM:') && !isSuffix && !isPrefix) entry.lemma = fp.slice(4);
    else if (fp.startsWith('VF:')) entry.vf = fp.slice(3);
    else if (fp === 'M' || fp === 'F') entry.gender = fp;
    else if (fp === 'MS' || fp === 'FS' || fp === 'MD' || fp === 'FD' || fp === 'MP' || fp === 'FP') {
      entry.gender = fp[0];
      entry.number = fp[1];
    }
  }

  // POS: prefer stem POS (N or V) over prefix P
  if (pos === 'N' || pos === 'V') entry.pos = pos;
  else if (!entry.pos) entry.pos = pos;
}

console.log(`  ${wordMap.size} unique words`);

// --- Phase 2: build root index ---

const roots = {};      // root → { occurrences, lemmas: {}, ayahs: Map<"s:a" → { s, a, words: [] }> }
const wordToRoots = {}; // normalised stripped word → Set<root>

for (const [, entry] of wordMap) {
  if (!entry.root) continue;

  const root = entry.root;
  const fullWord = entry.textParts.join('');
  const normWord = normalise(fullWord);
  const lemma = entry.lemma || fullWord;

  // root index
  if (!roots[root]) {
    roots[root] = { occurrences: 0, lemmas: {}, ayahMap: new Map() };
  }
  const r = roots[root];
  r.occurrences++;

  // lemma stats
  const lemKey = lemma;
  if (!r.lemmas[lemKey]) {
    r.lemmas[lemKey] = { pos: entry.pos, vf: entry.vf, gender: entry.gender, number: entry.number, count: 0 };
  }
  r.lemmas[lemKey].count++;

  // ayah grouping (cap examples per root to keep file size down)
  const ayahKey = `${entry.s}:${entry.a}`;
  if (!r.ayahMap.has(ayahKey)) {
    r.ayahMap.set(ayahKey, { s: entry.s, a: entry.a, words: [] });
  }
  r.ayahMap.get(ayahKey).words.push({
    w: fullWord,
    lem: lemma,
    pos: entry.pos,
    vf: entry.vf,
  });

  // word→root reverse lookup
  if (!wordToRoots[normWord]) wordToRoots[normWord] = new Set();
  wordToRoots[normWord].add(root);
}

// --- Phase 3: serialise ---

const MAX_AYAHS_PER_ROOT = 30;

const rootsOut = {};
for (const [root, data] of Object.entries(roots)) {
  const ayahs = [...data.ayahMap.values()].slice(0, MAX_AYAHS_PER_ROOT);
  rootsOut[root] = {
    occurrences: data.occurrences,
    lemmas: data.lemmas,
    ayahs,
  };
}

const wordsOut = {};
for (const [word, rootSet] of Object.entries(wordToRoots)) {
  wordsOut[word] = [...rootSet];
}

const output = {
  roots: rootsOut,
  words: wordsOut,
  meta: {
    totalRoots: Object.keys(rootsOut).length,
    totalWords: Object.keys(wordsOut).length,
    generatedAt: new Date().toISOString(),
    source: 'Quranic Arabic Corpus v0.4 (mustafa0x fork)',
  },
};

fs.writeFileSync(OUTPUT, JSON.stringify(output), 'utf-8');
const sizeMB = (fs.statSync(OUTPUT).size / (1024 * 1024)).toFixed(1);
console.log(`\nWrote ${OUTPUT}`);
console.log(`  ${output.meta.totalRoots} roots, ${output.meta.totalWords} normalised words`);
console.log(`  ${sizeMB} MB`);
