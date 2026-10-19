import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { listTranslations } from '../../services/quranenc';

// English name for an ISO language code (e.g. "yo" → "Yoruba").
const langName = (() => {
  let dn = null;
  try { dn = new Intl.DisplayNames(['en'], { type: 'language' }); } catch { /* old browser */ }
  return (iso) => {
    try { return (dn && dn.of(iso)) || iso; } catch { return iso; }
  };
})();

/**
 * A <select> of QuranEnc translations grouped by language.
 * Props: value (translation key), onChange(key, translation), only (optional
 * array of allowed keys), label (aria-label), className.
 */
export default function TranslationSelect({ value, onChange, only, label = 'Translation', className = '' }) {
  const [all, setAll] = useState([]);
  useEffect(() => { listTranslations().then(setAll).catch(() => setAll([])); }, []);

  const groups = useMemo(() => {
    const list = only ? all.filter((t) => only.includes(t.key)) : all;
    const by = {};
    for (const t of list) (by[t.language_iso_code] ||= []).push(t);
    return Object.entries(by)
      .map(([iso, ts]) => ({ iso, name: langName(iso), ts }))
      .sort((a, b) => (a.iso === 'en' ? -1 : b.iso === 'en' ? 1 : a.name.localeCompare(b.name)));
  }, [all, only]);

  return (
    <div className={`relative ${className}`}>
      <Languages className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value, all.find((t) => t.key === e.target.value))}
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-9 py-2.5 text-base sm:text-sm text-gray-900 shadow-sm hover:border-gray-400 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none"
      >
        {!all.length && <option value={value}>Loading translations…</option>}
        {groups.map((g) => (
          <optgroup key={g.iso} label={g.name}>
            {g.ts.map((t) => (
              <option key={t.key} value={t.key}>{t.title.replace(/^.*?Translation\s*-\s*/i, '')}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
