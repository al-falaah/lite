/**
 * Generates unlimited tajweed drill cards from public/content/tajweed_drills.json.
 *
 * Card shape matches DrillPlayer's expected `drill_cards` row shape:
 *   { id, arabic_text, highlight_ranges, question, options, correct_index, points, hint, explanation }
 *
 * We never hit the DB for endless decks — cards are synthesized in memory.
 */

let cachedData = null;

/** Load (and cache) the drill dataset. */
export async function loadTajweedDrillData() {
  if (cachedData) return cachedData;
  const res = await fetch('/content/tajweed_drills.json');
  if (!res.ok) throw new Error('Failed to load tajweed drills data');
  cachedData = await res.json();
  return cachedData;
}

/** Pick a random element. */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Fisher-Yates shuffle (in place). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Convert word indices to char start/end ranges for `segmentHighlights`. */
function wordIndicesToCharRanges(ayahText, wordIndices) {
  if (!wordIndices?.length) return [];
  const words = ayahText.split(/(\s+)/); // keep whitespace tokens
  // Build (wordIndex → {start, end}) map by walking tokens
  const wordRanges = [];
  let cursor = 0;
  let wordIdx = 0;
  for (const tok of words) {
    if (tok.trim() === '') { cursor += tok.length; continue; }
    wordRanges.push({ start: cursor, end: cursor + tok.length, idx: wordIdx });
    cursor += tok.length;
    wordIdx++;
  }
  return wordIndices
    .map(i => wordRanges.find(w => w.idx === i))
    .filter(Boolean)
    .map(({ start, end }) => ({ start, end }));
}

/** Pick N rules different from the target (for MC distractors). */
function pickDistractors(allRuleIds, targetId, n, sameCategory = null, rulesById = {}) {
  // Prefer same-category distractors; fall back to any
  let pool = allRuleIds.filter(id => id !== targetId);
  if (sameCategory) {
    const sameCat = pool.filter(id => rulesById[id]?.category === sameCategory);
    if (sameCat.length >= n) pool = sameCat;
  }
  return shuffle([...pool]).slice(0, n);
}

// ─── Question type generators ────────────────────────────────────

/** Type 1: Identify the rule. Show ayah + highlighted ref, ask which rule applies. */
function genIdentifyRule(rule, rulesById, allRuleIds) {
  const ex = pick(rule.examples);
  const distractors = pickDistractors(allRuleIds, rule.id, 3, rule.category, rulesById);
  const optionObjs = shuffle([
    { label: rule.name_en, correct: true },
    ...distractors.map(id => ({ label: rulesById[id].name_en, correct: false })),
  ]);

  return {
    id: `gen-identify-${rule.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: wordIndicesToCharRanges(ex.ayahText, ex.wordIndices),
    question: 'Which tajweed rule applies to the highlighted word?',
    options: optionObjs.map(o => o.label),
    correct_index: optionObjs.findIndex(o => o.correct),
    points: 10,
    explanation: `The rule is ${rule.name_en} (${rule.name_ar}). Source: Qur'an ${ex.sura}:${ex.aya}`,
  };
}

// Rules that commonly recur in an ayah beyond what the scholar flagged
// (e.g. qalqalah letters, ghunnah, natural madd) — avoid the "which word"
// question type for these to prevent ambiguous answers.
const AMBIGUOUS_FOR_WHICH_WORD = new Set([
  'qalqalah', 'ghunnah', 'madd-tabi3i', 'madd-aarid', 'madd-badal',
  'tafkheem-ra', 'tarqeeq-ra', 'tafkheem-lam', 'tarqeeq-lam',
  'lam-shamsiyyah', 'lam-qamariyyah',
]);

/** Type 2: Which word. Show ayah + rule name, ask which word has the rule. */
function genWhichWord(rule, rulesById, allRuleIds) {
  if (AMBIGUOUS_FOR_WHICH_WORD.has(rule.id)) return null;
  const ex = pick(rule.examples);
  const ayahWords = ex.ayahText.split(/\s+/).filter(Boolean);
  if (ayahWords.length < 4 || !ex.wordIndices?.length) return null;

  // Find ALL indices where this rule applies in this ayah — same rule may
  // recur multiple times, and we must not offer any such word as a distractor.
  const sameRuleIndices = new Set();
  for (const other of rule.examples) {
    if (other.sura === ex.sura && other.aya === ex.aya) {
      other.wordIndices.forEach(i => sameRuleIndices.add(i));
    }
  }

  const correctIdx = ex.wordIndices[0];
  const correctWord = ayahWords[correctIdx];
  const otherIndices = ayahWords.map((_, i) => i).filter(i => !sameRuleIndices.has(i));
  if (otherIndices.length < 3) return null;
  const distractorIdx = shuffle([...otherIndices]).slice(0, 3);
  const optionObjs = shuffle([
    { label: correctWord, correct: true },
    ...distractorIdx.map(i => ({ label: ayahWords[i], correct: false })),
  ]);

  return {
    id: `gen-word-${rule.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: [], // no highlight — that's the question
    question: `In this ayah, which word has ${rule.name_en} (${rule.name_ar})?`,
    options: optionObjs.map(o => o.label),
    correct_index: optionObjs.findIndex(o => o.correct),
    points: 15,
    explanation: `The word is ${correctWord}. Source: Qur'an ${ex.sura}:${ex.aya}`,
  };
}

/** Type 3: True/False. "Does rule X apply to this word?" */
function genTrueFalse(rule, rulesById, allRuleIds) {
  const ex = pick(rule.examples);
  const ranges = wordIndicesToCharRanges(ex.ayahText, ex.wordIndices);
  // 50/50: true case = real rule; false case = unrelated rule
  const isTrue = Math.random() < 0.5;
  let askedRule = rule;
  if (!isTrue) {
    const distractorId = pick(pickDistractors(allRuleIds, rule.id, 1, rule.category, rulesById));
    askedRule = rulesById[distractorId];
  }

  return {
    id: `gen-tf-${rule.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: ranges,
    question: `True or false: ${askedRule.name_en} applies to the highlighted word.`,
    options: ['True', 'False'],
    correct_index: isTrue ? 0 : 1,
    points: 8,
    explanation: isTrue
      ? `Correct — ${rule.name_en} applies here. (Qur'an ${ex.sura}:${ex.aya})`
      : `The actual rule is ${rule.name_en}, not ${askedRule.name_en}. (Qur'an ${ex.sura}:${ex.aya})`,
  };
}

/** Type 4: Category identify. Show highlighted ref, ask for broader category. */
function genCategory(rule, rulesById, allRuleIds) {
  const ex = pick(rule.examples);
  const allCategories = [...new Set(Object.values(rulesById).map(r => r.category))];
  const distractorCats = shuffle(allCategories.filter(c => c !== rule.category)).slice(0, 3);
  const optionObjs = shuffle([
    { label: rule.category, correct: true },
    ...distractorCats.map(c => ({ label: c, correct: false })),
  ]);

  return {
    id: `gen-cat-${rule.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: wordIndicesToCharRanges(ex.ayahText, ex.wordIndices),
    question: 'Which category of tajweed rules applies here?',
    options: optionObjs.map(o => o.label),
    correct_index: optionObjs.findIndex(o => o.correct),
    points: 12,
    explanation: `The rule is ${rule.name_en}, which belongs to ${rule.category}. (Qur'an ${ex.sura}:${ex.aya})`,
  };
}

const GENERATORS = [genIdentifyRule, genWhichWord, genTrueFalse];

/**
 * Generate a session of N mixed-type drill cards.
 * @param {Object} data — loaded drill data
 * @param {number} count — number of cards (10/20/50)
 * @param {string|null} ruleFilter — optional rule id to focus on
 */
export function generateSession(data, count = 10, ruleFilter = null) {
  const rulesById = data.rules;
  const allRuleIds = Object.keys(rulesById).filter(id => rulesById[id].examples.length > 0);
  const eligibleIds = ruleFilter ? [ruleFilter] : allRuleIds;

  const cards = [];
  let attempts = 0;
  while (cards.length < count && attempts < count * 4) {
    attempts++;
    const ruleId = pick(eligibleIds);
    const rule = rulesById[ruleId];
    if (!rule || rule.examples.length === 0) continue;
    const gen = pick(GENERATORS);
    const card = gen(rule, rulesById, allRuleIds);
    if (card) cards.push(card);
  }
  return cards;
}
