#!/usr/bin/env node
/**
 * Build Nahw/Arabiyyah drill data from scripts/data/eerab_aya.json.
 *
 * Per-word i'rab lines look like:
 *   "الدَّارُ: اسم "كان" مؤخر مرفوع، وعلامة رفعه الضمة الظاهرة."
 *
 * We scan each ayah's content for word:description pairs, tag each pair with
 * matching grammar topics (regex on the description), and group by topic.
 *
 * Output: public/content/nahw_drills.json
 *   { topics: { [topicId]: { id, name_en, name_ar, level, category, examples: [...] } } }
 *
 * Each example: { sura, aya, ayahText, word, wordIndex, description }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC = path.join(__dirname, 'data', 'eerab_aya.json');
const OUT = path.join(__dirname, '..', 'public', 'content', 'nahw_drills.json');
const MAX_PER_TOPIC = 100;

// ─── Topic definitions ─────────────────────────────────────────────
// level: 1 (Foundations) | 2 (Intermediate) | 3 (Advanced)
const TOPICS = [
  // ── Level 1: Foundations — core i'rab states & word classes ──
  { id: 'marfu',          name_en: 'Marfū‘ (Nominative)',    name_ar: 'مرفوع',           level: 1, category: 'Case', pattern: /مرفوع/ },
  { id: 'mansub',         name_en: 'Manṣūb (Accusative)',    name_ar: 'منصوب',           level: 1, category: 'Case', pattern: /منصوب/ },
  { id: 'majrur',         name_en: 'Majrūr (Genitive)',      name_ar: 'مجرور',           level: 1, category: 'Case', pattern: /مجرور|مخفوض/ },
  { id: 'majzum',         name_en: 'Majzūm (Jussive)',       name_ar: 'مجزوم',           level: 1, category: 'Case', pattern: /مجزوم/ },

  { id: 'harf-jarr',      name_en: 'Ḥarf Jarr (Preposition)', name_ar: 'حرف جرّ',         level: 1, category: 'Particles', pattern: /حرف\s*جرّ?/ },
  { id: 'mudaf-ilayh',    name_en: 'Muḍāf Ilayh',            name_ar: 'مضاف إليه',       level: 1, category: 'Iḍāfah', pattern: /مضاف\s*إليه/ },
  { id: 'fi3l-madi',      name_en: 'Fi‘l Māḍī (Past verb)',  name_ar: 'فعل ماضٍ',         level: 1, category: 'Verbs', pattern: /فعل\s*ماض/ },
  { id: 'fi3l-mudari',    name_en: 'Fi‘l Muḍāri‘ (Present)', name_ar: 'فعل مضارع',        level: 1, category: 'Verbs', pattern: /فعل\s*مضارع/ },
  { id: 'fi3l-amr',       name_en: 'Fi‘l Amr (Imperative)',  name_ar: 'فعل أمر',          level: 1, category: 'Verbs', pattern: /فعل\s*أمر/ },
  { id: 'fa3il',          name_en: 'Fā‘il (Subject)',        name_ar: 'فاعل',            level: 1, category: 'Core roles', pattern: /(?:^|\s)فاعل(?:$|\s|\.|،)/ },
  { id: 'maf3ul-bih',     name_en: 'Maf‘ūl bih (Object)',    name_ar: 'مفعول به',         level: 1, category: 'Core roles', pattern: /مفعول\s*به/ },
  { id: 'mubtada',        name_en: 'Mubtada’',               name_ar: 'مبتدأ',           level: 1, category: 'Core roles', pattern: /مبتدأ/ },
  { id: 'khabar',         name_en: 'Khabar',                 name_ar: 'خبر',             level: 1, category: 'Core roles', pattern: /(?:^|\s)خبر(?:$|\s|\.|،|ه|ا)/ },
  { id: 'damir-muttasil', name_en: 'Ḍamīr Muttaṣil',         name_ar: 'ضمير متصل',        level: 1, category: 'Pronouns', pattern: /ضمير\s*(متّصل|متصل)/ },
  { id: 'damir-mustatir', name_en: 'Ḍamīr Mustatir (Hidden)', name_ar: 'ضمير مستتر',     level: 1, category: 'Pronouns', pattern: /ضمير\s*مستتر/ },

  // ── Level 2: Intermediate — modifiers & common constructions ──
  { id: 'na3t',           name_en: 'Na‘t (Adjective)',       name_ar: 'نعت',             level: 2, category: 'Modifiers', pattern: /(?:^|\s)نعت/ },
  { id: 'sifah',          name_en: 'Ṣifah',                  name_ar: 'صفة',             level: 2, category: 'Modifiers', pattern: /(?:^|\s)صفة/ },
  { id: 'hal',            name_en: 'Ḥāl (Circumstance)',     name_ar: 'حال',             level: 2, category: 'Modifiers', pattern: /(?:^|\s)حال(?:\s|$|ة|ًا|\.)/ },
  { id: 'badal',          name_en: 'Badal (Apposition)',     name_ar: 'بدل',             level: 2, category: 'Modifiers', pattern: /(?:^|\s)بدل/ },
  { id: 'ma3tuf',         name_en: 'Ma‘ṭūf (Conjunct)',      name_ar: 'معطوف',           level: 2, category: 'Modifiers', pattern: /معطوف/ },
  { id: 'zarf',           name_en: 'Ẓarf (Adverbial)',       name_ar: 'ظرف',             level: 2, category: 'Modifiers', pattern: /ظرف\s*(مكان|زمان)/ },
  { id: 'tamyiz',         name_en: 'Tamyīz',                 name_ar: 'تمييز',           level: 2, category: 'Modifiers', pattern: /تمييز/ },
  { id: 'maf3ul-mutlaq',  name_en: 'Maf‘ūl Muṭlaq',          name_ar: 'مفعول مطلق',       level: 2, category: 'Objects', pattern: /مفعول\s*مطلق/ },
  { id: 'maf3ul-lah',     name_en: 'Maf‘ūl li-Ajlih',        name_ar: 'مفعول لأجله',      level: 2, category: 'Objects', pattern: /مفعول\s*(لأجله|له)/ },
  { id: 'munada',         name_en: 'Munādā (Vocative)',      name_ar: 'منادى',           level: 2, category: 'Vocative', pattern: /منادى/ },
  { id: 'harf-nasb',      name_en: 'Ḥarf Naṣb',              name_ar: 'حرف نصب',         level: 2, category: 'Particles', pattern: /حرف\s*نصب/ },
  { id: 'harf-jazm',      name_en: 'Ḥarf Jazm',              name_ar: 'حرف جزم',         level: 2, category: 'Particles', pattern: /حرف\s*جزم/ },
  { id: 'harf-sharT',     name_en: 'Ḥarf Sharṭ (Conditional)', name_ar: 'حرف شرط',       level: 2, category: 'Particles', pattern: /حرف\s*شرط/ },
  { id: 'harf-nafy',      name_en: 'Ḥarf Nafy (Negation)',   name_ar: 'حرف نفي',         level: 2, category: 'Particles', pattern: /حرف\s*نفي/ },
  { id: 'harf-istifham',  name_en: 'Ḥarf Istifhām',          name_ar: 'حرف استفهام',      level: 2, category: 'Particles', pattern: /حرف\s*استفهام/ },
  { id: 'harf-3atf',      name_en: 'Ḥarf ‘Aṭf',              name_ar: 'حرف عطف',         level: 2, category: 'Particles', pattern: /حرف\s*عطف/ },

  // ── Level 3: Advanced — nuanced particles, nasikh, and subtle cases ──
  { id: 'kana-akhawatuha', name_en: 'Kāna & its Sisters',    name_ar: 'كان وأخواتها',     level: 3, category: 'Nawāsikh', pattern: /فعل\s*ماض\s*ناقص/ },
  { id: 'inna-akhawatuha', name_en: 'Inna & its Sisters',    name_ar: 'إنّ وأخواتها',     level: 3, category: 'Nawāsikh', pattern: /حرف\s*(مشبّه|مشبه)\s*بالفعل/ },
  { id: 'harf-isti2naf',  name_en: 'Ḥarf Isti’nāf',          name_ar: 'حرف استئناف',      level: 3, category: 'Discourse', pattern: /حرف\s*استئناف/ },
  { id: 'harf-tahqiq',    name_en: 'Ḥarf Taḥqīq',            name_ar: 'حرف تحقيق',        level: 3, category: 'Discourse', pattern: /حرف\s*تحقيق/ },
  { id: 'harf-hasr',      name_en: 'Ḥarf Ḥaṣr (Restriction)', name_ar: 'حرف حصر',         level: 3, category: 'Discourse', pattern: /حرف\s*حصر/ },
  { id: 'harf-nahy',      name_en: 'Ḥarf Nahy (Prohibition)', name_ar: 'حرف نهي',        level: 3, category: 'Discourse', pattern: /حرف\s*نهي/ },
  { id: 'harf-za2id',     name_en: 'Ḥarf Zā’id (Redundant)', name_ar: 'حرف زائد',        level: 3, category: 'Discourse', pattern: /حرف\s*زائد/ },
  { id: 'harf-tawkid',    name_en: 'Ḥarf Tawkīd',            name_ar: 'حرف توكيد',        level: 3, category: 'Discourse', pattern: /حرف\s*توكيد/ },
  { id: 'jam3-mudhakkar', name_en: 'Jam‘ Mudhakkar Sālim',   name_ar: 'جمع مذكر سالم',    level: 3, category: 'Number', pattern: /جمع\s*مذكر\s*سالم/ },
  { id: 'jam3-mu2annath', name_en: 'Jam‘ Mu’annath Sālim',   name_ar: 'جمع مؤنث سالم',    level: 3, category: 'Number', pattern: /جمع\s*مؤنث\s*سالم/ },
  { id: 'muthanna',       name_en: 'Muthannā (Dual)',        name_ar: 'مثنى',            level: 3, category: 'Number', pattern: /مثنى|ألف\s*التثنية/ },
  { id: 'af3al-khamsa',   name_en: 'Al-Af‘āl al-Khamsa',     name_ar: 'الأفعال الخمسة',   level: 3, category: 'Verbs', pattern: /الأفعال\s*الخمسة|ثبوت\s*النون|حذف\s*النون/ },
  { id: 'mabni-majhul',   name_en: 'Mabnī lil-Majhūl (Passive)', name_ar: 'مبني للمجهول', level: 3, category: 'Verbs', pattern: /مبن[يّ]\s*للمجهول/ },
  { id: 'maf3ul-thani',   name_en: 'Maf‘ūl bih Thānī',       name_ar: 'مفعول به ثانٍ',    level: 3, category: 'Objects', pattern: /مفعول\s*به\s*ثان/ },
];

// ─── Text normalization for matching ─────────────────────────────────
const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
function stripDiacritics(s) {
  return (s || '')
    .replace(DIACRITICS, '')
    .replace(/[ٱآإأ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '');
}

function normalizeSpaces(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function findWordIndex(ayahText, targetWord) {
  const words = normalizeSpaces(ayahText).split(/\s+/).filter(Boolean);
  const normTarget = stripDiacritics(targetWord);
  // Try exact (normalized) match first
  for (let i = 0; i < words.length; i++) {
    if (stripDiacritics(words[i]) === normTarget) return i;
  }
  // Then prefix-stripped (ف/و/ب/ل/ال leading letters)
  const stripPrefix = (s) => s.replace(/^(فال|وال|بال|كال|ال|ف|و|ب|ل|ك)/, '');
  for (let i = 0; i < words.length; i++) {
    const a = stripPrefix(stripDiacritics(words[i]));
    const b = stripPrefix(normTarget);
    if (a && b && a === b) return i;
  }
  return -1;
}

// ─── Parse "word: description" lines from content ─────────────────────
// Skip the bracketed ayah header line and grammatical summary lines ("وجملة ...").
function parseLines(content) {
  const pairs = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('{')) continue;           // ayah header
    if (t.startsWith('وجملة') || t.startsWith('جملة')) continue; // sentence-level i'rab
    // Match up to the first Arabic colon (: or ：) — word must not contain space
    const m = t.match(/^([^\s:：]+)\s*[:：]\s*(.+)$/);
    if (!m) continue;
    const word = m[1];
    const desc = m[2];
    if (word.length < 2) continue;
    pairs.push({ word, desc });
  }
  return pairs;
}

// ─── Main build ─────────────────────────────────────────────────────
function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  console.log(`Loaded ${raw.length} ayah entries.`);

  const topicsById = {};
  for (const t of TOPICS) {
    topicsById[t.id] = { ...t, examples: [] };
    delete topicsById[t.id].pattern; // strip regex; keep it on TOPICS for matching
  }

  const seen = new Set(); // dedupe: `${topicId}|${sura}:${aya}|${word}`
  let totalPairs = 0;
  let totalExamples = 0;

  for (const entry of raw) {
    const { sura_number: sura, aya_number: aya, aya_text: ayahText, content } = entry;
    if (!ayahText || !content) continue;
    const pairs = parseLines(content);
    totalPairs += pairs.length;

    for (const { word, desc } of pairs) {
      const wordIndex = findWordIndex(ayahText, word);
      if (wordIndex < 0) continue; // couldn't locate — skip

      for (const topic of TOPICS) {
        if (!topic.pattern.test(desc)) continue;
        // Skip Inna/sisters if description actually says "kāna & sisters" (fi'l madi naaqis)
        if (topic.id === 'inna-akhawatuha' && /فعل\s*ماض\s*ناقص/.test(desc)) continue;
        const key = `${topic.id}|${sura}:${aya}|${wordIndex}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const bucket = topicsById[topic.id].examples;
        if (bucket.length >= MAX_PER_TOPIC) continue;
        bucket.push({
          sura, aya, ayahText, word, wordIndex,
          desc: desc.slice(0, 200),
        });
        totalExamples++;
      }
    }
  }

  console.log(`Parsed ${totalPairs} word:description pairs.`);
  console.log(`Built ${totalExamples} examples across ${Object.keys(topicsById).length} topics.`);

  // Report per-topic counts
  for (const t of TOPICS) {
    const n = topicsById[t.id].examples.length;
    console.log(`  L${t.level} ${t.id.padEnd(20)} → ${n}`);
  }

  // Drop topics with fewer than 4 examples (can't form 4-option MC)
  const filtered = {};
  for (const [id, t] of Object.entries(topicsById)) {
    if (t.examples.length >= 4) filtered[id] = t;
  }

  const out = { topics: filtered };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  const size = fs.statSync(OUT).size;
  console.log(`\nWrote ${OUT} (${(size/1024).toFixed(1)} KB, ${Object.keys(filtered).length} topics)`);
}

main();
