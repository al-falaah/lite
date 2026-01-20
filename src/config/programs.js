/**
 * Centralized Program/Track Configuration
 *
 * This file is the single source of truth for all program-related data.
 * When adding a new program, add it here and it will be available throughout the app.
 *
 * Terminology:
 * - "program" is used in code/database (e.g., program: 'tajweed')
 * - "track" is used in UI display (e.g., "Tajweed Track")
 *
 * Data here matches exactly what's displayed on the Programs page.
 */

// Program IDs - use these constants instead of string literals
export const PROGRAM_IDS = {
  TAJWEED: 'tajweed',
  ESSENTIALS: 'essentials',
};

// Main program configuration - matches Programs page exactly
export const PROGRAMS = {
  [PROGRAM_IDS.TAJWEED]: {
    // Identifiers
    id: 'tajweed',

    // Display Names (from Programs page header)
    name: 'Tajweed Mastery Program',
    shortName: 'TMP',
    arabicName: 'برنامج إتقان التجويد',
    transliteration: 'Barnāmij Itqān at-Tajwīd',

    // Duration (from Programs page comparison table)
    duration: {
      months: 6,
      weeks: 24,
      years: 1,
      display: '6 months',
      displayWeeks: '24 weeks',
    },

    // Pricing (from Programs page comparison table)
    pricing: {
      type: 'one-time',
      oneTime: 120,
      oneTimeCents: 12000, // For Stripe
      currency: 'NZD',
      displayPrice: '$120 NZD',
      displayNote: 'One-time',
    },

    // Focus (from Programs page comparison table)
    focus: 'Tajweed & Quranic Sciences',

    // Description (from Programs page card body)
    description: 'An intensive 24-week sprint to transform basic reading into expert-level precision. Through a structured curriculum, we focus on mastering Tajweed rules through immediate oral application and rigorous precision drills.',

    // Our Edge (from Programs page card body)
    ourEdge: "We go beyond rules by integrating a vital introduction to the Sciences of the Qur'an (ʿUlūm al-Qurʾān), grounding your recitation in authentic scholarly context.",

    // Program Objectives (from Programs page collapsible section)
    objectives: [
      { title: 'Mastery from A to Z', description: 'Complete command over Tajweed rules through effective, focused instruction.' },
      { title: 'Scholarly Foundation', description: 'Attain essential knowledge of ʿUlūm al-Qurʾān.' },
    ],

    // Primary Text (from Programs page collapsible section)
    primaryText: {
      arabic: 'تيسير الرحمن في تجويد القرآن',
      transliteration: "Taysīr ar-Raḥmān fī Tajwīd al-Qur'ān",
      author: "Su'ād 'Abdul-Ḥamīd",
    },

    // Schedule (from Programs page curriculum details)
    schedule: {
      session1: { duration: '1 Hour', description: 'Primary Instruction & Intensive Drill' },
      session2: { duration: '30 mins', description: 'Dedicated Follow-up, Oral Assessment, and Mentoring' },
    },

    // Prerequisites (from Programs page collapsible section)
    prerequisites: {
      age: '14+ years old',
      proficiency: "Must be able to read the Qur'anic script fluently but currently lacks the technical knowledge or practical application of Tajweed rules.",
    },

    // Milestones for Student Portal progress tracking
    milestones: [
      { id: 1, name: 'Foundation', subtitle: 'Laying Your Foundation', weekStart: 1, weekEnd: 4 },
      { id: 2, name: 'Discovery', subtitle: 'The Path of Discovery', weekStart: 5, weekEnd: 8 },
      { id: 3, name: 'Clarity', subtitle: 'Achieving Clarity', weekStart: 9, weekEnd: 12 },
      { id: 4, name: 'Precision', subtitle: 'Developing Precision', weekStart: 13, weekEnd: 16 },
      { id: 5, name: 'Refinement', subtitle: 'The Refinement Stage', weekStart: 17, weekEnd: 20 },
      { id: 6, name: 'Mastery', subtitle: 'Reaching Mastery', weekStart: 21, weekEnd: 24 },
    ],
  },

  [PROGRAM_IDS.ESSENTIALS]: {
    // Identifiers
    id: 'essentials',

    // Display Names (from Programs page header)
    name: 'Essential Arabic & Islamic Studies',
    shortName: 'EAIS',
    arabicName: 'الدراسات الأساسية في اللغة العربية والعلوم الإسلامية',
    transliteration: 'Ad-Dirāsāt al-Asāsiyyah fīl-Lughah al-ʿArabiyyah wal-ʿUlūm al-Islāmiyyah',

    // Duration (from Programs page comparison table)
    duration: {
      months: 24,
      weeks: 104,
      years: 2,
      display: '2 years',
      displayWeeks: '104 weeks',
    },

    // Pricing (from Programs page comparison table)
    pricing: {
      type: 'subscription',
      monthly: 35,
      monthlyCents: 3500, // For Stripe
      annual: 375,
      annualCents: 37500, // For Stripe
      currency: 'NZD',
      displayPriceMonthly: '$35/month',
      displayPriceAnnual: '$375/year',
    },

    // Focus (from Programs page comparison table)
    focus: 'Arabic Language & Islamic Studies',

    // Description (from Programs page card body)
    description: 'A comprehensive 2-year accelerator designed for students ready to bridge the gap between reading script and true comprehension. Our structured curriculum delivers a rigorous foundation in Arabic linguistics—Grammar, Morphology, and Spelling—paired with essential Islamic sciences to build lasting scholarly depth.',

    // Our Edge (from Programs page card body)
    ourEdge: "We move beyond isolated language study by integrating Creed (ʿAqīdah), Jurisprudence (Fiqh), and Ethics (Ādāb). Through expert mentoring and systematic textual study, we equip you with the linguistic and spiritual infrastructure to engage directly with the Qur'an and Sunnah.",

    // Program Objectives (from Programs page collapsible section)
    objectives: [
      { title: 'Linguistic Mastery', description: 'Achieve intermediate Arabic proficiency through structured study of Grammar (An-Naḥw), Morphology (Aṣ-Ṣarf), and Spelling (Al-Imlāʾ).' },
      { title: 'Scholarly Foundation', description: 'Build sound Islamic knowledge in Creed (ʿAqīdah), Jurisprudence (Fiqh), and Ethics (Ādāb).' },
    ],

    // Primary Texts (from Programs page collapsible section)
    primaryTexts: [
      { arabic: 'ألفية ابن مالك', transliteration: 'Alfiyyat Ibn Mālik' },
      { arabic: 'النحو الواضح', transliteration: 'An-Naḥw al-Wāḍiḥ' },
      { arabic: 'المنهاج المختصر', transliteration: 'Al-Minhāj al-Mukhtaṣar' },
      { arabic: 'مجموع عقيدة أهل السنة', transliteration: 'Majmūʿ ʿAqīdat Ahlus Sunnah' },
      { arabic: 'الدرر البهية', transliteration: 'Ad-Durar al-Bahiyyah' },
      { arabic: 'من آداب الإسلام', transliteration: 'Min Ādāb al-Islām' },
    ],

    // Schedule (from Programs page curriculum details)
    schedule: {
      session1: { duration: '2 Hours', description: 'Primary Instruction & Comprehensive Study' },
      session2: { duration: '30 mins', description: 'Dedicated Follow-up, Assessment, and Mentoring' },
    },

    // Prerequisites (from Programs page collapsible section)
    prerequisites: {
      age: '14+ years old',
      proficiency: "Must be able to read the Qur'an or Arabic text with ḥarakāt (vowel markings) fluently.",
    },

    // Milestones for Student Portal progress tracking
    milestones: [
      { id: 1, name: 'Awakening', subtitle: 'The Awakening - Beginning Your Journey', weekStart: 1, weekEnd: 13 },
      { id: 2, name: 'Foundation', subtitle: 'Building Your Foundation', weekStart: 14, weekEnd: 26 },
      { id: 3, name: 'Growth', subtitle: 'Experiencing Growth', weekStart: 27, weekEnd: 39 },
      { id: 4, name: 'Transformation', subtitle: 'The First Transformation', weekStart: 40, weekEnd: 52 },
      { id: 5, name: 'Insight', subtitle: 'Gaining Deep Insight', weekStart: 53, weekEnd: 65 },
      { id: 6, name: 'Mastery', subtitle: 'Developing Mastery', weekStart: 66, weekEnd: 78 },
      { id: 7, name: 'Wisdom', subtitle: 'Cultivating Wisdom', weekStart: 79, weekEnd: 91 },
      { id: 8, name: 'Legacy', subtitle: 'Becoming a Legacy', weekStart: 92, weekEnd: 104 },
    ],
  },
};

// Helper Functions

/**
 * Get a program by its ID
 * @param {string} programId - 'tajweed' or 'essentials'
 * @returns {object|null} Program object or null if not found
 */
export const getProgram = (programId) => {
  return PROGRAMS[programId] || null;
};

/**
 * Get program name for display
 * @param {string} programId - 'tajweed' or 'essentials'
 * @returns {string} Program name
 */
export const getProgramName = (programId) => {
  return PROGRAMS[programId]?.name || programId;
};

/**
 * Get track name for UI display
 * @param {string} programId - 'tajweed' or 'essentials'
 * @returns {string} Track name (uses program name)
 */
export const getTrackName = (programId) => {
  return PROGRAMS[programId]?.name || programId;
};

/**
 * Get program duration display string
 * @param {string} programId - 'tajweed' or 'essentials'
 * @returns {string} Duration string (e.g., "6 months")
 */
export const getProgramDuration = (programId) => {
  return PROGRAMS[programId]?.duration.display || '';
};

/**
 * Get program milestones
 * @param {string} programId - 'tajweed' or 'essentials'
 * @returns {array} Milestones array
 */
export const getProgramMilestones = (programId) => {
  return PROGRAMS[programId]?.milestones || [];
};

/**
 * Get all programs as an array (useful for dropdowns, lists)
 * @returns {array} Array of program objects with id included
 */
export const getAllPrograms = () => {
  return Object.values(PROGRAMS);
};

/**
 * Get program IDs as an array
 * @returns {array} Array of program ID strings
 */
export const getAllProgramIds = () => {
  return Object.keys(PROGRAMS);
};

/**
 * Check if a program ID is valid
 * @param {string} programId
 * @returns {boolean}
 */
export const isValidProgram = (programId) => {
  return programId in PROGRAMS;
};

/**
 * Get pricing display for a program
 * @param {string} programId
 * @param {string} type - 'default' | 'monthly' | 'annual'
 * @returns {string}
 */
export const getProgramPricing = (programId, type = 'default') => {
  const program = PROGRAMS[programId];
  if (!program) return '';

  if (program.pricing.type === 'one-time') {
    return program.pricing.displayPrice;
  }

  switch (type) {
    case 'monthly':
      return program.pricing.displayPriceMonthly;
    case 'annual':
      return program.pricing.displayPriceAnnual;
    default:
      return program.pricing.displayPriceMonthly;
  }
};

// For backwards compatibility with existing constants.js usage
export const PROGRAM_NAMES = {
  [PROGRAM_IDS.TAJWEED]: PROGRAMS[PROGRAM_IDS.TAJWEED].name,
  [PROGRAM_IDS.ESSENTIALS]: PROGRAMS[PROGRAM_IDS.ESSENTIALS].name,
};

export default PROGRAMS;
