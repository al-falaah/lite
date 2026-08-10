/**
 * Sheet + specimen primitives for the Mashq world.
 *
 * A Sheet is a leaf of paper raised off the ground with a ruled hairline edge
 * and a soft paper shadow (no rounded-app-card chrome). SpecLabel is the tiny
 * tracked-mono caption that annotates the sheet; SpecRow lays a label against a
 * measured readout the way a specimen sheet tabulates values.
 */
import { SHEET, SHEET_PAD, SPEC_LABEL } from '../../../design/mashq';

export function Sheet({ children, className = '', pad = true }) {
  return <section className={`${SHEET} ${pad ? SHEET_PAD : ''} ${className}`}>{children}</section>;
}

export function SpecLabel({ children, className = '' }) {
  return <span className={`${SPEC_LABEL} ${className}`}>{children}</span>;
}

/** A ruled row: mono label on the left, measured readout on the right. */
export function SpecRow({ label, children, className = '' }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 border-b border-[var(--mq-rule-soft)] last:border-b-0 ${className}`}>
      <SpecLabel>{label}</SpecLabel>
      <span className="font-['JetBrains_Mono',monospace] tabular-nums text-sm text-[var(--mq-ink)]">{children}</span>
    </div>
  );
}

/**
 * Strokes — a mastery meter drawn as a row of drilled calligraphy strokes
 * (the mashq repetition). `value`/`total` set how many are inked.
 */
export function Strokes({ value = 0, total = 12, height = 20, className = '' }) {
  const done = total > 0 ? Math.round((value / total) * total) : 0;
  const marks = Array.from({ length: total });
  return (
    <div className={`mashq-strokes ${className}`} style={{ height }} aria-hidden="true">
      {marks.map((_, i) => {
        // strokes vary slightly in height like hand-drilled marks
        const h = height * (0.55 + ((i * 37) % 45) / 100);
        return (
          <span
            key={i}
            className={`mashq-stroke ${i < done ? 'is-done' : ''}`}
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}
