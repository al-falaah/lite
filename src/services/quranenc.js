// QuranEnc.com client — Qur'an translations (76), translator footnotes, and
// spoken-meaning audio. Free, keyless, CORS-open. QuranEnc's terms: show the
// content unmodified and credit the publisher, source (QuranEnc.com) and
// version — use `credit(t)` wherever a translation is displayed.

const BASE = 'https://quranenc.com/api/v1';

// Translations that have per-āyah spoken audio (from QuranEnc's API page).
export const AUDIO_TRANSLATIONS = [
  'english_rwwad', 'french_rashid', 'portuguese_nasr', 'dutch_center', 'azeri_musayev',
  'tagalog_rwwad', 'chinese_suliman', 'vietnamese_rwwad', 'persian_ih', 'assamese_rafeeq',
  'tamil_omar_brief', 'sinhalese_mahir', 'somali_yacob',
];

// Scripts written right-to-left among QuranEnc's translation languages.
// (Verified: QuranEnc's Kurdish is Sorani/Arabic script; N'Ko is RTL.) For
// translation TEXT prefer dir="auto", which follows the text itself.
const RTL_LANGS = new Set(['ar', 'fa', 'ur', 'ps', 'ug', 'ku', 'nqo', 'dv', 'he', 'sd', 'prs']);
export const isRtlLang = (iso) => RTL_LANGS.has(String(iso || '').toLowerCase());

let listCache = null;
const suraCache = new Map(); // `${key}:${sura}` → rows

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`QuranEnc ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** All translations: [{ key, language_iso_code, version, title, description }] */
export async function listTranslations() {
  if (!listCache) {
    listCache = getJson(`${BASE}/translations/list`)
      .then((j) => (j.translations || j || []).map((t) => ({ ...t, title: t.title?.trim() })))
      .catch((e) => { listCache = null; throw e; });
  }
  return listCache;
}

/** One sūrah in one translation: [{ sura, aya, arabic_text, translation, footnotes }] */
export async function getSura(key, sura) {
  const ck = `${key}:${sura}`;
  if (!suraCache.has(ck)) {
    const p = getJson(`${BASE}/translation/sura/${key}/${sura}`)
      .then((j) => (j.result || []).map((r) => ({ ...r, sura: Number(r.sura), aya: Number(r.aya) })))
      .catch((e) => { suraCache.delete(ck); throw e; });
    suraCache.set(ck, p);
  }
  return suraCache.get(ck);
}

/** One āyah in one translation. Served from the sūrah cache when warm. */
export async function getAya(key, sura, aya) {
  const ck = `${key}:${sura}`;
  if (suraCache.has(ck)) {
    const rows = await suraCache.get(ck);
    const hit = rows.find((r) => r.aya === Number(aya));
    if (hit) return hit;
  }
  const j = await getJson(`${BASE}/translation/aya/${key}/${sura}/${aya}`);
  return { ...j.result, sura: Number(j.result?.sura), aya: Number(j.result?.aya) };
}

const pad3 = (n) => String(n).padStart(3, '0');

/** Spoken-meaning audio for an āyah (only for AUDIO_TRANSLATIONS). */
export const meaningAudioUrl = (key, sura, aya) =>
  `https://d.quranenc.com/data/audio/${key}/${pad3(sura)}${pad3(aya)}.mp3`;

/** Credit line required by QuranEnc's terms. */
export const credit = (t) =>
  t ? `${t.title}${t.version ? ` (v${t.version})` : ''} — QuranEnc.com` : 'QuranEnc.com';

// Arabic recitation (EveryAyah.com — free per-āyah recitations, CORS-open).
export const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'Mishary Alafasy' },
  { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'Abdul Basit (Murattal)' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Muhammad Al-Minshawi (Murattal)' },
];
export const recitationUrl = (reciterId, sura, aya) =>
  `https://everyayah.com/data/${reciterId}/${pad3(sura)}${pad3(aya)}.mp3`;
