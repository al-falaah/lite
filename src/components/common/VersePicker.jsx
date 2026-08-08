import { useState, useCallback } from 'react';
import { X, BookOpen, Check, AlertTriangle, Search } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { normalizeUthmani, skeletonArabic, stripDiacritics, isFoldStable } from '../../utils/uthmani';

// Surah names for display (matches the /tools ExamplesFinder set).
const SURAH_NAMES = {
  1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Aal-Imran', 4: 'An-Nisa', 5: 'Al-Maidah',
  6: "Al-An'am", 7: "Al-A'raf", 8: 'Al-Anfal', 9: 'At-Tawbah', 10: 'Yunus',
  11: 'Hud', 12: 'Yusuf', 13: "Ar-Ra'd", 14: 'Ibrahim', 15: 'Al-Hijr',
  16: 'An-Nahl', 17: 'Al-Isra', 18: 'Al-Kahf', 19: 'Maryam', 20: 'Ta-Ha',
  21: 'Al-Anbiya', 22: 'Al-Hajj', 23: "Al-Mu'minun", 24: 'An-Nur', 25: 'Al-Furqan',
  26: "Ash-Shu'ara", 27: 'An-Naml', 28: 'Al-Qasas', 29: 'Al-Ankabut', 30: 'Ar-Rum',
  31: 'Luqman', 32: 'As-Sajdah', 33: 'Al-Ahzab', 34: 'Saba', 35: 'Fatir',
  36: 'Ya-Sin', 37: 'As-Saffat', 38: 'Sad', 39: 'Az-Zumar', 40: 'Ghafir',
  41: 'Fussilat', 42: 'Ash-Shura', 43: 'Az-Zukhruf', 44: 'Ad-Dukhan', 45: 'Al-Jathiyah',
  46: 'Al-Ahqaf', 47: 'Muhammad', 48: 'Al-Fath', 49: 'Al-Hujurat', 50: 'Qaf',
  51: 'Adh-Dhariyat', 52: 'At-Tur', 53: 'An-Najm', 54: 'Al-Qamar', 55: 'Ar-Rahman',
  56: "Al-Waqi'ah", 57: 'Al-Hadid', 58: 'Al-Mujadilah', 59: 'Al-Hashr', 60: 'Al-Mumtahanah',
  61: 'As-Saff', 62: "Al-Jumu'ah", 63: 'Al-Munafiqun', 64: 'At-Taghabun', 65: 'At-Talaq',
  66: 'At-Tahrim', 67: 'Al-Mulk', 68: 'Al-Qalam', 69: 'Al-Haqqah', 70: "Al-Ma'arij",
  71: 'Nuh', 72: 'Al-Jinn', 73: 'Al-Muzzammil', 74: 'Al-Muddaththir', 75: 'Al-Qiyamah',
  76: 'Al-Insan', 77: 'Al-Mursalat', 78: 'An-Naba', 79: "An-Nazi'at", 80: "'Abasa",
  81: 'At-Takwir', 82: 'Al-Infitar', 83: 'Al-Mutaffifin', 84: 'Al-Inshiqaq', 85: 'Al-Buruj',
  86: 'At-Tariq', 87: "Al-A'la", 88: 'Al-Ghashiyah', 89: 'Al-Fajr', 90: 'Al-Balad',
  91: 'Ash-Shams', 92: 'Al-Layl', 93: 'Ad-Duha', 94: 'Ash-Sharh', 95: 'At-Tin',
  96: 'Al-Alaq', 97: 'Al-Qadr', 98: 'Al-Bayyinah', 99: 'Az-Zalzalah', 100: 'Al-Adiyat',
  101: "Al-Qari'ah", 102: 'At-Takathur', 103: 'Al-Asr', 104: 'Al-Humazah', 105: 'Al-Fil',
  106: 'Quraysh', 107: "Al-Ma'un", 108: 'Al-Kawthar', 109: 'Al-Kafirun', 110: 'An-Nasr',
  111: 'Al-Masad', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas',
};

const ATTRIBUTION = 'Tafsir Center for Quranic Studies (tafsir.net)';

// Shape a DB row into the display/insert record used across the modal.
// `partial` marks a fragment-within-āyah match: the citation is the āyah, but
// the text inserted is the author's pasted fragment (overrideText), not the
// whole āyah.
function toResult(row, { partial = false, overrideText = null } = {}) {
  return {
    sura: row.sura_number,
    aya: row.aya_number,
    suraName: SURAH_NAMES[row.sura_number] || row.sura_name || `Surah ${row.sura_number}`,
    text: overrideText != null ? overrideText : normalizeUthmani(row.aya_text),
    partial,
  };
}

/**
 * Modal that confirms a Qur'anic ayah against the corpus before it is
 * inserted into a lesson — two modes:
 *   - "ref"   exact surah:ayah lookup
 *   - "paste" paste an Arabic string, verify its skeleton matches a real ayah
 *
 * On confirm, calls onInsert({ sura, aya, text }). Verification/text come from
 * quran_tajweed_aya (fully-vowelled Uthmani). Attribution to the Tafsir Center
 * is shown because this tool is backed by their corpus.
 */
export default function VersePicker({ onInsert, onClose }) {
  const [mode, setMode] = useState('ref'); // 'ref' | 'paste'
  const [sura, setSura] = useState('');
  const [aya, setAya] = useState('');
  const [pasted, setPasted] = useState('');
  const [results, setResults] = useState(null); // null = not searched; [] = no match
  const [status, setStatus] = useState(''); // '', 'loading', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [partialInfo, setPartialInfo] = useState(0); // total partial matches when capped, else 0

  const lookupRef = useCallback(async () => {
    const s = parseInt(sura, 10);
    const a = parseInt(aya, 10);
    if (!s || !a || s < 1 || s > 114 || a < 1) {
      setErrorMsg('Enter a valid surah (1–114) and ayah number.');
      setStatus('error');
      setResults(null);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    const { data, error } = await supabase
      .from('quran_tajweed_aya')
      .select('sura_number, sura_name, aya_number, aya_text')
      .eq('sura_number', s)
      .eq('aya_number', a)
      .limit(1);
    if (error) {
      setErrorMsg('Lookup failed. Please try again.');
      setStatus('error');
      return;
    }
    setStatus('');
    setResults((data || []).map(toResult));
  }, [sura, aya]);

  const verifyPaste = useCallback(async () => {
    const target = skeletonArabic(pasted);
    if (!target) {
      setErrorMsg('Paste some Arabic text to verify.');
      setStatus('error');
      setResults(null);
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    setPartialInfo(0);

    // Narrow candidates against the imlāʾī spine (quran_ayah_ref), NOT the
    // vowelled aya_text: an ilike with bare (undiacritized) letters can't match
    // diacritized aya_text, but matches ayah_imlai fine. Confirm precisely by
    // skeleton equality, then pull the vowelled display text from
    // quran_tajweed_aya.
    //
    // Choose an ilike probe from the pasted text. Two requirements:
    //  - FOLD-STABLE: a probe must match the raw imlāʾī verbatim. A folded
    //    skeleton word like "اقرا" won't ilike-match stored "اقرأ", so probe
    //    with the diacritic-stripped (unfolded) word instead, and prefer words
    //    with no foldable letters (hamza/alif variants) so the match is exact.
    //  - RARE: prefer the longest such word — a common short word like "الله"
    //    matches >1000 āyāt and risks truncation before the target is reached
    //    (mitigated by pagination below, but a rarer probe is cheaper).
    const rawWords = stripDiacritics(pasted).split(' ').filter((w) => w.length >= 2);
    const stable = rawWords.filter(isFoldStable);
    const pool = stable.length ? stable : rawWords;
    const probe = pool.length
      ? pool.reduce((a, w) => (w.length > a.length ? w : a))
      : stripDiacritics(pasted);

    const refRows = [];
    for (let from = 0; from < 6000; from += 1000) {
      const { data, error } = await supabase
        .from('quran_ayah_ref')
        .select('sura_number, aya_number, ayah_imlai')
        .ilike('ayah_imlai', `%${probe}%`)
        .range(from, from + 999);
      if (error) {
        setErrorMsg('Verification failed. Please try again.');
        setStatus('error');
        return;
      }
      refRows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    // Full-āyah matches (exact skeleton) — insert the whole vowelled āyah.
    const exactKeys = refRows
      .filter((r) => skeletonArabic(r.ayah_imlai) === target)
      .map((r) => ({ s: r.sura_number, a: r.aya_number }));

    // Partial matches — the pasted skeleton is a contiguous fragment INSIDE a
    // real āyah. Only offered when there's no exact match, so a whole āyah is
    // never demoted to a partial. The author picks the citation; we insert the
    // pasted fragment (as typed), not the whole āyah.
    const partialKeys =
      exactKeys.length > 0
        ? []
        : refRows
            .filter((r) => skeletonArabic(r.ayah_imlai).includes(target))
            .map((r) => ({ s: r.sura_number, a: r.aya_number }));

    const isPartial = exactKeys.length === 0 && partialKeys.length > 0;
    // Cap partial candidates — a common phrase can appear in dozens of āyāt;
    // showing them all is unusable. If capped, the author should paste more of
    // the āyah to disambiguate.
    const PARTIAL_CAP = 12;
    const partialTruncated = isPartial && partialKeys.length > PARTIAL_CAP;
    const keys = exactKeys.length > 0 ? exactKeys : partialKeys.slice(0, PARTIAL_CAP);

    if (keys.length === 0) {
      setStatus('');
      setResults([]);
      return;
    }
    setPartialInfo(partialTruncated ? partialKeys.length : 0);

    // Fetch the vowelled display text for the candidate references.
    const orFilter = keys
      .map((k) => `and(sura_number.eq.${k.s},aya_number.eq.${k.a})`)
      .join(',');
    const { data: ayaRows, error: ayaErr } = await supabase
      .from('quran_tajweed_aya')
      .select('sura_number, sura_name, aya_number, aya_text')
      .or(orFilter);
    if (ayaErr) {
      setErrorMsg('Verification failed. Please try again.');
      setStatus('error');
      return;
    }
    // For partials, insert the pasted fragment (normalized) rather than the
    // whole āyah; the āyah text is still shown so the author can see context.
    const fragment = normalizeUthmani(pasted.trim());
    const matches = (ayaRows || [])
      .map((row) =>
        isPartial
          ? { ...toResult(row, { partial: true, overrideText: fragment }), ayahText: normalizeUthmani(row.aya_text) }
          : toResult(row)
      )
      .sort((x, y) => x.sura - y.sura || x.aya - y.aya);
    setStatus('');
    setResults(matches);
  }, [pasted]);

  const confirm = (r) => {
    onInsert({ sura: r.sura, aya: r.aya, text: r.text, source: ATTRIBUTION, partial: r.partial });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-gray-900">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">Insert verified āyah</span>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 px-4 pt-3">
          {[
            ['ref', 'By reference'],
            ['paste', 'Verify pasted text'],
          ].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setResults(null); setStatus(''); setErrorMsg(''); setPartialInfo(0); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="px-4 py-3">
          {mode === 'ref' ? (
            <div className="flex items-end gap-2">
              <label className="flex-1 text-xs font-medium text-gray-500">
                Surah
                <input
                  type="number" min="1" max="114" value={sura}
                  onChange={(e) => setSura(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupRef()}
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  placeholder="112"
                />
              </label>
              <label className="flex-1 text-xs font-medium text-gray-500">
                Ayah
                <input
                  type="number" min="1" value={aya}
                  onChange={(e) => setAya(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupRef()}
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none"
                  placeholder="1"
                />
              </label>
              <button
                type="button" onClick={lookupRef} disabled={status === 'loading'}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Search className="h-3.5 w-3.5" /> Look up
              </button>
            </div>
          ) : (
            <div>
              <textarea
                dir="rtl" value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
                rows={2}
                placeholder="الصق الآية هنا…"
                style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
              />
              <button
                type="button" onClick={verifyPaste} disabled={status === 'loading'}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Verify
              </button>
            </div>
          )}

          {status === 'error' && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" /> {errorMsg}
            </p>
          )}
        </div>

        {/* Results */}
        {results !== null && status !== 'loading' && (
          <div className="max-h-72 overflow-y-auto border-t border-gray-100 px-4 py-3">
            {results.length === 0 ? (
              <div className="rounded-md bg-amber-50 px-3 py-3 text-sm text-amber-800">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-4 w-4" /> Not found in the muṣḥaf.
                </div>
                <p className="mt-1 text-amber-700">
                  {mode === 'paste'
                    ? 'This text does not match any āyah. Check the wording — it may contain an error.'
                    : 'No āyah at that reference.'}
                </p>
              </div>
            ) : (
              <>
                {results[0]?.partial && (
                  <p className="mb-2 rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
                    Partial āyah — this phrase appears inside{' '}
                    {partialInfo > 0 ? `${partialInfo} āyāt (showing ${results.length})` : `${results.length} āyah${results.length > 1 ? 's' : ''}`}.
                    Pick the one you're quoting; the fragment will be inserted with that citation.
                    {partialInfo > 0 && ' Paste more of the āyah to narrow it down.'}
                  </p>
                )}
                <ul className="space-y-2">
                  {results.map((r) => (
                    <li key={`${r.sura}:${r.aya}`} className="rounded-lg border border-gray-200 p-3">
                      <p
                        dir="rtl" className="text-xl leading-loose text-gray-900"
                        style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
                      >
                        {r.text}
                      </p>
                      {r.partial && r.ayahText && (
                        <p
                          dir="rtl" className="mt-1 text-sm leading-loose text-gray-400"
                          style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
                        >
                          {r.ayahText}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 text-xs ${r.partial ? 'text-sky-700' : 'text-emerald-700'}`}>
                          <Check className="h-3.5 w-3.5" /> {r.suraName} {r.sura}:{r.aya}
                          {r.partial && <span className="text-gray-400">· partial</span>}
                        </span>
                        <button
                          type="button" onClick={() => confirm(r)}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          Insert
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Attribution */}
        <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400">
          Source: {ATTRIBUTION}
        </div>
      </div>
    </div>
  );
}
