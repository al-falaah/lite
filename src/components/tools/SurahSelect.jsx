import { ChevronDown } from 'lucide-react';
import { SURAH_NAMES, AYAH_COUNTS } from '../../utils/quran';

/** <select> of the 114 sūrahs. Props: value (number), onChange(n), label, className. */
export default function SurahSelect({ value, onChange, label = 'Sūrah', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-9 py-2.5 text-base sm:text-sm text-gray-900 shadow-sm hover:border-gray-400 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/25 outline-none"
      >
        {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}. {SURAH_NAMES[n]} ({AYAH_COUNTS[n]})</option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
