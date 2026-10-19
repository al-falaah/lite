// Decode the HTML character references that some imported corpus text still
// carries literally (e.g. `&quot;طبيعي&quot;`, `&nbsp;`). React renders text
// verbatim, so without this the reader sees the escape codes. Only references
// are decoded — this never interprets markup, so it is safe for any string.
const NAMED = { quot: '"', amp: '&', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

export function decodeEntities(s) {
  if (!s || s.indexOf('&') === -1) return s;
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ref) => {
    if (ref[0] === '#') {
      const cp = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    return NAMED[ref.toLowerCase()] ?? m;
  });
}
