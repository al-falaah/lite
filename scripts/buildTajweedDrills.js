#!/usr/bin/env node
/**
 * Parses scripts/data/tajweed_aya_project_content.xlsx into
 * public/content/tajweed_drills.json.
 *
 * Output shape:
 * {
 *   generatedAt: ISO,
 *   source: "Ahmad At-Taweel — Ahkam at-Tajweed fi Kalimat al-Aziz al-Hameed",
 *   author: "Ahmad Mahmoud Shams ad-Din",
 *   rules: {
 *     [ruleId]: {
 *       name_en, name_ar, category,
 *       examples: [{ sura, aya, ayahText, refs: [word...] }]
 *     }
 *   }
 * }
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN_PATH = path.join(__dirname, 'data', 'tajweed_aya_project_content.xlsx');
const OUT_PATH = path.join(__dirname, '..', 'public', 'content', 'tajweed_drills.json');

// Rule dictionary — Arabic phrases found in scholar content → our internal rule id.
// Keep these aligned with topicMap categories so UI can show nice English labels.
// Order matters: longer/more specific phrases first.
const RULES = [
  // Noon sakinah & tanween
  { id: 'izhar-halqi', ar: 'إظهار حلقي', name_en: 'Izhar Halqi', category: 'Noon Sakinah & Tanween' },
  { id: 'idgham-bighunnah', ar: 'إدغام بغنة', name_en: 'Idgham with Ghunnah', category: 'Noon Sakinah & Tanween' },
  { id: 'idgham-bila-ghunnah', ar: 'إدغام بغير غنة', name_en: 'Idgham without Ghunnah', category: 'Noon Sakinah & Tanween' },
  { id: 'ikhfa-haqiqi', ar: 'إخفاء حقيقي', name_en: 'Ikhfa Haqiqi', category: 'Noon Sakinah & Tanween' },
  { id: 'iqlab', ar: 'إقلاب', name_en: 'Iqlab', category: 'Noon Sakinah & Tanween' },
  { id: 'izhar-mutlaq', ar: 'إظهار مطلق', name_en: 'Izhar Mutlaq', category: 'Noon Sakinah & Tanween' },

  // Meem sakinah
  { id: 'ikhfa-shafawi', ar: 'إخفاء شفوي', name_en: 'Ikhfa Shafawi', category: 'Meem Sakinah' },
  { id: 'idgham-mithlayn-sagheer', ar: 'إدغام مثلين صغير', name_en: 'Idgham Mithlayn Sagheer', category: 'Meem Sakinah' },
  { id: 'idgham-mithlayn', ar: 'إدغام مثلين', name_en: 'Idgham Mithlayn', category: 'Meem Sakinah' },
  { id: 'izhar-shafawi', ar: 'إظهار شفوي', name_en: 'Izhar Shafawi', category: 'Meem Sakinah' },

  // Idgham types
  { id: 'idgham-tamaathul-sagheer', ar: 'إدغام تماثل صغير', name_en: 'Idgham Tamaathul Sagheer', category: 'Idgham Types' },
  { id: 'idgham-tamaathul', ar: 'إدغام تماثل', name_en: 'Idgham Tamaathul', category: 'Idgham Types' },
  { id: 'idgham-tajanus', ar: 'إدغام تجانس', name_en: 'Idgham Tajanus', category: 'Idgham Types' },
  { id: 'idgham-taqarub', ar: 'إدغام تقارب', name_en: 'Idgham Taqarub', category: 'Idgham Types' },

  // Madd
  { id: 'madd-muttasil', ar: 'مد متصل', name_en: 'Madd Muttasil', category: 'Madd' },
  { id: 'madd-munfasil', ar: 'مد منفصل', name_en: 'Madd Munfasil', category: 'Madd' },
  { id: 'madd-lazim', ar: 'مد لازم', name_en: 'Madd Lazim', category: 'Madd' },
  { id: 'madd-aarid', ar: 'مد عارض للسكون', name_en: 'Madd Aarid Lis-Sukoon', category: 'Madd' },
  { id: 'madd-aarid', ar: 'عارض للسكون', name_en: 'Madd Aarid Lis-Sukoon', category: 'Madd' },
  { id: 'madd-iwad', ar: 'مد عوض', name_en: 'Madd Iwad', category: 'Madd' },
  { id: 'madd-leen', ar: 'مد لين', name_en: 'Madd Leen', category: 'Madd' },
  { id: 'madd-silah', ar: 'مد صلة', name_en: 'Madd Silah', category: 'Madd' },
  { id: 'madd-badal', ar: 'مد بدل', name_en: 'Madd Badal', category: 'Madd' },
  { id: 'madd-tabi3i', ar: 'مد طبيعي', name_en: 'Madd Tabi\'i (Natural)', category: 'Madd' },
  { id: 'madd-tabi3i', ar: 'مد طبيعى', name_en: 'Madd Tabi\'i (Natural)', category: 'Madd' },

  // Lam & Ra
  { id: 'lam-shamsiyyah', ar: 'لام شمسية', name_en: 'Lam Shamsiyyah', category: 'Lam & Ra' },
  { id: 'lam-qamariyyah', ar: 'لام قمرية', name_en: 'Lam Qamariyyah', category: 'Lam & Ra' },
  { id: 'tafkheem-ra', ar: 'الراء مفخمة', name_en: 'Ra Mufakhamah (Heavy)', category: 'Lam & Ra' },
  { id: 'tarqeeq-ra', ar: 'الراء مرققة', name_en: 'Ra Muraqqaqah (Light)', category: 'Lam & Ra' },
  { id: 'tafkheem-lam', ar: 'اسم الجلالة مفخم', name_en: 'Lafdh al-Jalalah Heavy', category: 'Lam & Ra' },
  { id: 'tarqeeq-lam', ar: 'مرققة', name_en: 'Lam Muraqqaqah (Light)', category: 'Lam & Ra' },

  // Qalqalah
  { id: 'qalqalah', ar: 'قلقلة', name_en: 'Qalqalah', category: 'Letter Qualities' },

  // Ghunnah
  { id: 'ghunnah', ar: 'غنة', name_en: 'Ghunnah', category: 'Letter States' },

  // Imalah, Ishmam, Tas-hil, Saktah
  { id: 'imalah', ar: 'إمالة', name_en: 'Imalah', category: 'Other Phenomena' },
  { id: 'ishmam', ar: 'إشمام', name_en: 'Ishmam', category: 'Other Phenomena' },
  { id: 'tas-hil', ar: 'تسهيل', name_en: 'Tas-hil', category: 'Other Phenomena' },
  { id: 'saktah', ar: 'سكتة', name_en: 'Saktah', category: 'Other Phenomena' },
  { id: 'naql', ar: 'نقل', name_en: 'Naql', category: 'Other Phenomena' },
];

// Negation / disclaimer cues — if the rule appears within this window before/after
// a phrase like "لا" / "ليس" / "غير" / "حتى لا" / "دون", skip it.
const NEG_CUES = /(?:\bلا\s+\S{0,15}$|\bليس\b|\bعدم\b|\bحتى\s+لا\b|\bدون\b|\bبدون\b|\bولا\b|\bغير\b)/;

// Arabic diacritic/Uthmani normalizer — keeps word shape stable for matching.
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/ى\u0670/g, 'ا')
    .replace(/(.)\u0670/g, '$1ا')
    .replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '')
    .replace(/[ٱإأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

// Strip Arabic prefix letters (و ف ب ل ك) so "وفي" matches "في" etc.
function stripPrefix(word) {
  return word.replace(/^[وفبلك]/, '');
}

// Find all ref words within content (text inside {…}).
// For each ref, look in a window after it (and before it, if nothing after)
// for rule keywords. Reject if the rule appears inside a negation clause.
function extractRulesFromRow(content, ayahText) {
  const refs = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    refs.push({ text: m[1].trim(), start: m.index, end: m.index + m[0].length });
  }
  if (refs.length === 0) return [];

  const results = [];
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const next = refs[i + 1];
    const prev = refs[i - 1];

    // Window after this ref: from end-of-ref to start-of-next-ref (or end of content)
    const afterStart = ref.end;
    const afterEnd = next ? next.start : content.length;
    const afterWindow = content.slice(afterStart, afterEnd);

    // Window before this ref: from end of previous ref to start of this ref
    const beforeStart = prev ? prev.end : 0;
    const beforeWindow = content.slice(beforeStart, ref.start);

    // Check each rule — prefer a match in the after-window
    for (const rule of RULES) {
      const searchWindow = afterWindow + ' ' + beforeWindow;
      const idx = searchWindow.indexOf(rule.ar);
      if (idx < 0) continue;
      // Check ~25 chars before the rule match for negation
      const context = searchWindow.slice(Math.max(0, idx - 25), idx);
      if (NEG_CUES.test(context)) continue;
      results.push({ refText: ref.text, ruleId: rule.id });
      break; // one rule per ref — avoid over-tagging
    }
  }
  return results;
}

// Find word indices in the ayah that correspond to the ref text.
// Match each ref word against ayah words — accept exact match, or exact match
// after prefix-stripping one side, but NEVER bidirectional substring fuzzy
// (that over-matches shorter words onto longer ones, e.g. "انه" vs "ان").
function matchRefInAyah(ayahText, refText) {
  const ayahWords = ayahText.split(/\s+/).filter(Boolean);
  const refWords = refText.split(/\s+/).filter(Boolean);
  const normAyah = ayahWords.map(normalizeArabic);
  const normRefWords = refWords.map(normalizeArabic);

  const wordsEqual = (ayahWord, refWord) => {
    if (ayahWord === refWord) return true;
    // Ayah word may have a prefix letter (و ف ب ل ك) absent from the ref
    if (stripPrefix(ayahWord) === refWord) return true;
    if (ayahWord === stripPrefix(refWord)) return true;
    return false;
  };

  const found = [];
  for (let i = 0; i <= normAyah.length - normRefWords.length; i++) {
    let match = true;
    for (let j = 0; j < normRefWords.length; j++) {
      if (!wordsEqual(normAyah[i + j], normRefWords[j])) { match = false; break; }
    }
    if (match) {
      for (let j = 0; j < normRefWords.length; j++) found.push(i + j);
    }
  }
  return found;
}

// ── Main ───────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(IN_PATH)) {
    console.error('Missing xlsx:', IN_PATH);
    process.exit(1);
  }
  const wb = XLSX.readFile(IN_PATH);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  const MAX_PER_RULE = 200;
  const rules = {};
  for (const rule of RULES) {
    if (!rules[rule.id]) {
      rules[rule.id] = { id: rule.id, name_en: rule.name_en, name_ar: rule.ar, category: rule.category, examples: [] };
    }
  }

  let totalExamples = 0;
  for (const row of rows) {
    const sura = row['رقم السورة'];
    const aya = row['رقم الآية'];
    const ayahText = row['الآية'];
    const content = row['المحتوى'];
    if (!sura || !aya || !ayahText || !content) continue;

    const found = extractRulesFromRow(content, ayahText);
    for (const { refText, ruleId } of found) {
      const wordIndices = matchRefInAyah(ayahText, refText);
      if (wordIndices.length === 0) continue; // skip if we can't locate the ref in the ayah
      rules[ruleId].examples.push({
        sura, aya, ayahText, refText, wordIndices,
      });
      totalExamples++;
    }
  }

  // Dedupe per rule + cap + drop empty rules
  for (const id of Object.keys(rules)) {
    const seen = new Set();
    const deduped = rules[id].examples.filter(e => {
      const k = `${e.sura}:${e.aya}:${e.refText}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    // Shuffle deterministically then cap — so we get examples spread across the Quran
    deduped.sort(() => Math.random() - 0.5);
    rules[id].examples = deduped.slice(0, MAX_PER_RULE);
    if (rules[id].examples.length === 0) delete rules[id];
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: 'Ahkam at-Tajweed fi Kalimat al-Aziz al-Hameed — Ahmad At-Taweel',
    author: 'Ahmad Mahmoud Shams ad-Din',
    rules,
  };

  // Report
  console.log(`Parsed ${rows.length} rows → ${totalExamples} rule-ref pairs`);
  for (const id of Object.keys(rules)) {
    console.log(`  ${id.padEnd(28)} ${rules[id].examples.length}`);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  const sizeKB = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(`\nWrote ${OUT_PATH} (${sizeKB} KB)`);
}

main();
