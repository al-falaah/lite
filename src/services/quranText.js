// Verified Arabic text of the Qur'an from our own corpus (quran_tajweed_aya —
// vowelled ʿUthmānī, tafsir.net sourced). Tools take the Arabic from here, not
// from third-party APIs, so every āyah shown is the verified text.
import { supabase } from './supabase';

const cache = new Map(); // sura → Promise<[{ aya, text }]>

/** All āyāt of a sūrah, in order: [{ aya, text }] */
export function getSuraArabic(sura) {
  const s = Number(sura);
  if (!cache.has(s)) {
    const p = supabase
      .from('quran_tajweed_aya')
      .select('aya_number, aya_text')
      .eq('sura_number', s)
      .order('aya_number')
      .then(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((r) => ({ aya: r.aya_number, text: r.aya_text }));
      });
    p.catch(() => cache.delete(s));
    cache.set(s, p);
  }
  return cache.get(s);
}
