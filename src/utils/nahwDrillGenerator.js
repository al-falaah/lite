/**
 * Generates unlimited Nahw & Arabiyyah drill cards from
 * public/content/nahw_drills.json.
 *
 * Card shape matches DrillPlayer's expected `drill_cards` row shape.
 */

let cachedData = null;

export async function loadNahwDrillData() {
  if (cachedData) return cachedData;
  const res = await fetch('/content/nahw_drills.json');
  if (!res.ok) throw new Error('Failed to load nahw drills data');
  cachedData = await res.json();
  return cachedData;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Convert word index to a single highlight range by splitting ayah on whitespace. */
function wordIndexToCharRange(ayahText, wordIndex) {
  if (wordIndex == null || wordIndex < 0) return [];
  const words = ayahText.split(/(\s+)/);
  let cursor = 0;
  let idx = 0;
  for (const tok of words) {
    if (tok.trim() === '') { cursor += tok.length; continue; }
    if (idx === wordIndex) return [{ start: cursor, end: cursor + tok.length }];
    cursor += tok.length;
    idx++;
  }
  return [];
}

function pickDistractorTopics(allTopicIds, targetId, n, sameLevel, topicsById) {
  let pool = allTopicIds.filter(id => id !== targetId);
  if (sameLevel) {
    const sameLvl = pool.filter(id => topicsById[id]?.level === sameLevel);
    if (sameLvl.length >= n) pool = sameLvl;
  }
  return shuffle([...pool]).slice(0, n);
}

// ─── Question types ──────────────────────────────────────────────────

/** Type 1: Identify the grammatical role/topic of highlighted word. */
function genIdentifyTopic(topic, topicsById, allTopicIds) {
  const ex = pick(topic.examples);
  const distractors = pickDistractorTopics(allTopicIds, topic.id, 3, topic.level, topicsById);
  const optionObjs = shuffle([
    { label: topic.name_en, correct: true },
    ...distractors.map(id => ({ label: topicsById[id].name_en, correct: false })),
  ]);

  return {
    id: `gen-nahw-id-${topic.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: wordIndexToCharRange(ex.ayahText, ex.wordIndex),
    question: 'What is the grammatical role of the highlighted word?',
    options: optionObjs.map(o => o.label),
    correct_index: optionObjs.findIndex(o => o.correct),
    points: 10,
    explanation: `The word is ${topic.name_en} (${topic.name_ar}). Qur'an ${ex.sura}:${ex.aya}`,
  };
}

// Topics that commonly recur in many words of an ayah — avoid "which word"
// to prevent multiple-correct-answer ambiguity.
const AMBIGUOUS_FOR_WHICH_WORD = new Set([
  'marfu', 'mansub', 'majrur', 'damir-muttasil', 'mudaf-ilayh',
  'harf-jarr', 'harf-3atf', 'fi3l-madi', 'fi3l-mudari',
]);

/** Type 2: Which word has this role? */
function genWhichWord(topic, topicsById, allTopicIds) {
  if (AMBIGUOUS_FOR_WHICH_WORD.has(topic.id)) return null;
  const ex = pick(topic.examples);
  const words = ex.ayahText.split(/\s+/).filter(Boolean);
  if (words.length < 4 || ex.wordIndex == null) return null;

  // Find all examples in this topic's bucket matching the same ayah —
  // those words must not be offered as distractors.
  const sameTopicIndices = new Set();
  for (const other of topic.examples) {
    if (other.sura === ex.sura && other.aya === ex.aya) sameTopicIndices.add(other.wordIndex);
  }

  const correctIdx = ex.wordIndex;
  const correctWord = words[correctIdx];
  if (!correctWord) return null;
  const otherIdxs = words.map((_, i) => i).filter(i => !sameTopicIndices.has(i));
  if (otherIdxs.length < 3) return null;
  const distractorIdxs = shuffle([...otherIdxs]).slice(0, 3);
  const optionObjs = shuffle([
    { label: correctWord, correct: true },
    ...distractorIdxs.map(i => ({ label: words[i], correct: false })),
  ]);

  return {
    id: `gen-nahw-word-${topic.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: [],
    question: `Which word in this ayah is ${topic.name_en} (${topic.name_ar})?`,
    options: optionObjs.map(o => o.label),
    correct_index: optionObjs.findIndex(o => o.correct),
    points: 15,
    explanation: `The word is ${correctWord}. Qur'an ${ex.sura}:${ex.aya}`,
  };
}

/** Type 3: True/False. */
function genTrueFalse(topic, topicsById, allTopicIds) {
  const ex = pick(topic.examples);
  const ranges = wordIndexToCharRange(ex.ayahText, ex.wordIndex);
  const isTrue = Math.random() < 0.5;
  let askedTopic = topic;
  if (!isTrue) {
    const distractorId = pick(pickDistractorTopics(allTopicIds, topic.id, 1, topic.level, topicsById));
    askedTopic = topicsById[distractorId];
  }

  return {
    id: `gen-nahw-tf-${topic.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: ranges,
    question: `True or false: the highlighted word is ${askedTopic.name_en} (${askedTopic.name_ar}).`,
    options: ['True', 'False'],
    correct_index: isTrue ? 0 : 1,
    points: 8,
    explanation: isTrue
      ? `Correct — it is ${topic.name_en}. (Qur'an ${ex.sura}:${ex.aya})`
      : `The correct role is ${topic.name_en}, not ${askedTopic.name_en}. (Qur'an ${ex.sura}:${ex.aya})`,
  };
}

/** Type 4: Category identification (Case / Verbs / Particles / etc.). */
function genCategory(topic, topicsById, allTopicIds) {
  const ex = pick(topic.examples);
  const allCats = [...new Set(Object.values(topicsById).map(t => t.category))];
  const distractorCats = shuffle(allCats.filter(c => c !== topic.category)).slice(0, 3);
  if (distractorCats.length < 3) return null;
  const optionObjs = shuffle([
    { label: topic.category, correct: true },
    ...distractorCats.map(c => ({ label: c, correct: false })),
  ]);

  return {
    id: `gen-nahw-cat-${topic.id}-${ex.sura}-${ex.aya}-${Math.random()}`,
    arabic_text: ex.ayahText,
    highlight_ranges: wordIndexToCharRange(ex.ayahText, ex.wordIndex),
    question: 'Which broad grammar category does the highlighted word fall under?',
    options: optionObjs.map(o => o.label),
    correct_index: optionObjs.findIndex(o => o.correct),
    points: 12,
    explanation: `${topic.name_en} belongs to ${topic.category}. (Qur'an ${ex.sura}:${ex.aya})`,
  };
}

const GENERATORS = [genIdentifyTopic, genWhichWord, genTrueFalse];

/**
 * Generate a session of N mixed-type drill cards.
 * @param {Object} data — loaded nahw drill data
 * @param {number} count
 * @param {number|null} levelFilter — 1|2|3 or null for mixed
 */
export function generateSession(data, count = 10, levelFilter = null) {
  const topicsById = data.topics;
  const allTopicIds = Object.keys(topicsById);
  const eligibleIds = levelFilter
    ? allTopicIds.filter(id => topicsById[id].level === levelFilter && topicsById[id].examples.length >= 4)
    : allTopicIds.filter(id => topicsById[id].examples.length >= 4);

  if (eligibleIds.length === 0) return [];

  const cards = [];
  let attempts = 0;
  while (cards.length < count && attempts < count * 5) {
    attempts++;
    const topicId = pick(eligibleIds);
    const topic = topicsById[topicId];
    if (!topic || topic.examples.length === 0) continue;
    const gen = pick(GENERATORS);
    const card = gen(topic, topicsById, allTopicIds);
    if (card) cards.push(card);
  }
  return cards;
}
