/**
 * MasteryGlyph — the signature of the Mashq world.
 *
 * A large Amiri Arabic letterform inked on the specimen sheet. It renders in
 * two layers: a faint ghost (the unmastered remainder) and an inked layer
 * clipped from the bottom by `fill` (0..1) — so progress reads as a letter
 * mastered stroke by stroke, filling upward like ink taking to paper.
 *
 * The letter is chosen per program so each track has its own glyph
 * (its initial), turning "where am I" into a recognizable mark.
 */
export default function MasteryGlyph({ letter = 'ب', fill = 1, size = 'text-[7rem] sm:text-[10rem]', className = '' }) {
  const clamped = Math.max(0, Math.min(1, fill));
  return (
    <div
      className={`mashq-glyph select-none ${size} ${className}`}
      style={{ '--fill': clamped }}
      aria-hidden="true"
    >
      <span className="mashq-glyph-ghost block">{letter}</span>
      <span className="mashq-glyph-ink">{letter}</span>
    </div>
  );
}
