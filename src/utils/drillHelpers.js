/**
 * Gamification helpers for the drill system.
 * XP, levels, combo multipliers, titles.
 */

// ── Level thresholds & titles ────────────────────────────
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000,
];

export const LEVEL_TITLES = [
  { en: 'Tālib',      ar: 'طالب',   meaning: 'Seeker' },
  { en: 'Mutaʿallim', ar: 'متعلم',  meaning: 'Learner' },
  { en: 'Dāris',      ar: 'دارس',   meaning: 'Studier' },
  { en: 'Fāhim',      ar: 'فاهم',   meaning: 'Comprehender' },
  { en: 'Ḥāfiẓ',      ar: 'حافظ',   meaning: 'Preserver' },
  { en: 'Mutqin',     ar: 'متقن',   meaning: 'Proficient' },
  { en: 'Muʿallim',   ar: 'معلم',   meaning: 'Teacher' },
  { en: 'ʿĀlim',      ar: 'عالم',   meaning: 'Scholar' },
  { en: 'Faqīh',      ar: 'فقيه',   meaning: 'Jurist' },
  { en: 'Imām',        ar: 'إمام',   meaning: 'Leader' },
];

/** Get the 1-based level for a given total XP. */
export const getLevel = (xp) => {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
};

/** Get title object for a level. */
export const getLevelTitle = (level) =>
  LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

/** XP needed for next level (null if max). */
export const xpToNextLevel = (xp) => {
  const level = getLevel(xp);
  if (level >= LEVEL_THRESHOLDS.length) return null;
  return LEVEL_THRESHOLDS[level] - xp;
};

/** Progress fraction (0-1) towards next level. */
export const levelProgress = (xp) => {
  const level = getLevel(xp);
  if (level >= LEVEL_THRESHOLDS.length) return 1;
  const prev = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level];
  return (xp - prev) / (next - prev);
};

// ── Combo multiplier ─────────────────────────────────────
export const getComboMultiplier = (combo) => {
  if (combo >= 8) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  return 1;
};

export const getComboLabel = (combo) => {
  if (combo >= 8) return '🔥🔥🔥 UNSTOPPABLE!';
  if (combo >= 5) return '🔥🔥 ON FIRE!';
  if (combo >= 3) return '🔥 NICE STREAK!';
  return '';
};

/** Calculate XP for a single correct answer. */
export const calcXP = (basePoints, combo, usedHint = false) => {
  const multiplier = getComboMultiplier(combo);
  const hintPenalty = usedHint ? 0.5 : 1;
  return Math.round(basePoints * multiplier * hintPenalty);
};

// ── Arabic text highlighting ─────────────────────────────
/**
 * Render Arabic text as an array of React-friendly segments
 * with highlighted / plain spans.
 * @param {string} text
 * @param {Array<{start:number, end:number}>} ranges
 * @returns {Array<{text: string, highlighted: boolean}>}
 */
export const segmentHighlights = (text, ranges = []) => {
  if (!text) return [];
  if (!ranges.length) return [{ text, highlighted: false }];

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const parts = [];
  let cursor = 0;

  sorted.forEach(({ start, end }) => {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), highlighted: false });
    parts.push({ text: text.slice(start, end), highlighted: true });
    cursor = end;
  });

  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlighted: false });
  return parts;
};

// ── Emoji covers ─────────────────────────────────────────
export const DECK_EMOJIS = [
  '📖', '📚', '🔤', '✨', '🕌', '📿', '🌙', '⭐', '🎯', '💡',
  '🧠', '📝', '🔬', '🎓', '💎', '🏆',
];
