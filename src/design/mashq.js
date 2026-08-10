/**
 * Mashq — the design layer for the redesigned student portal.
 *
 * World: "Lightboard" — the calligrapher's drill sheet (mashq) written in chalk
 * on the madrasah's e-glass teaching board. Learning is the practice of a
 * script; the portal is that board, where a student's progress renders as an
 * Arabic letterform written in glowing chalk, mastered stroke by stroke. Chalk
 * ink on a deep green-black ground, the brand green as the one glowing accent,
 * tiny mono readouts. Hierarchy by scale contrast, not chrome.
 *
 * Scope: the student portal shell and its tabs. Lesson CONTENT and its reader,
 * the Qurʾānic (Amiri Quran) rendering, the data model, and the quiz/test
 * engine are untouched — this layer reframes the shell around them.
 *
 * Palette lives entirely in CSS variables on `.mashq` (index.css) — one source
 * of truth, swap there to re-theme. The accent is the brand green from the
 * logo (#0a9369 / #0e905c), lifted for legibility on the dark board; every
 * text pair meets WCAG AA.
 *
 * Tokens are Tailwind class strings referencing those vars. Import; don't copy.
 */

// ── Ground & ink ───────────────────────────────────────────────
// Chalk ink on a deep green-black board. All colors are CSS vars on .mashq.
export const MASHQ_ROOT = 'mashq'; // class on the portal root; scopes CSS vars

export const PAPER = 'bg-[var(--mq-paper)]';        // board ground
export const PAPER_RAISED = 'bg-[var(--mq-paper-raised)]'; // a lit sheet on the board
export const INK = 'text-[var(--mq-ink)]';        // chalk white
export const INK_SOFT = 'text-[var(--mq-ink-soft)]';   // secondary chalk
export const INK_FAINT = 'text-[var(--mq-ink-faint)]';  // captions / specimen labels

// One glowing accent — the brand green. Used precisely: primary action, the
// live/active mark, the completed stroke. Never scattered.
export const ACCENT = 'var(--mq-accent)';
export const ACCENT_TEXT = 'text-[var(--mq-accent)]';
export const ACCENT_BG = 'bg-[var(--mq-accent)]';

// Rule lines — the specimen sheet's ruled baseline / hairlines.
export const RULE = 'border-[var(--mq-rule)]';     // hairline on paper
export const RULE_STRONG = 'border-[var(--mq-rule-strong)]';

// ── Type ───────────────────────────────────────────────────────
// Amiri carries the hero Arabic letterforms (already loaded; the material of
// the subject). A grotesque workhorse carries Latin UI (legitimate for an
// Operate surface). JetBrains Mono carries genuine specimen readouts only —
// axis values, counts, coordinates — never as decoration.
export const FONT_ARABIC = "font-['Amiri',serif]";
export const FONT_MONO = "font-['JetBrains_Mono',monospace]";

// Specimen label — the tiny tracked mono caption that annotates the sheet.
export const SPEC_LABEL =
  "font-['JetBrains_Mono',monospace] text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[var(--mq-ink-faint)]";
// A specimen readout (a measured value): mono, inked, tabular.
export const SPEC_READOUT =
  "font-['JetBrains_Mono',monospace] tabular-nums text-[var(--mq-ink)]";

// Latin display / headings — scale contrast carries hierarchy.
export const DISPLAY = 'font-sans font-semibold tracking-[-0.02em] text-[var(--mq-ink)]';
export const HEADING = 'font-sans font-semibold text-[var(--mq-ink)]';
export const BODY = 'font-sans text-[var(--mq-ink-soft)]';

// ── The sheet (primary container) ──────────────────────────────
// A specimen sheet: paper raised off the ground, hairline ruled, square-ish
// corners (a sheet of paper, not a rounded app card). No drop-shadow costume;
// depth comes from the ruled edge and a soft paper shadow set in CSS.
export const SHEET =
  'bg-[var(--mq-paper-raised)] border border-[var(--mq-rule)] rounded-[4px] mashq-sheet';
export const SHEET_PAD = 'p-5 sm:p-6';

// ── Controls ───────────────────────────────────────────────────
// Primary action — inked accent, the one assertive surface.
export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[3px] ' +
  'bg-[var(--mq-accent)] text-[var(--mq-on-accent)] text-sm font-semibold tracking-[0.01em] ' +
  'hover:bg-[var(--mq-accent-deep)] active:bg-[var(--mq-accent-deeper)] ' +
  'disabled:bg-[var(--mq-rule)] disabled:text-[var(--mq-ink-faint)] disabled:cursor-not-allowed ' +
  'transition-colors mashq-focus';

// Secondary — ink outline on paper, like a stamped field on the sheet.
export const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[3px] ' +
  'bg-transparent border border-[var(--mq-rule-strong)] text-[var(--mq-ink)] text-sm font-medium ' +
  'hover:bg-[var(--mq-paper-tint)] hover:border-[var(--mq-ink-ghost)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors mashq-focus';

export const BTN_GHOST =
  'inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded ' +
  'text-[var(--mq-ink-soft)] text-xs font-medium tracking-[0.02em] ' +
  'hover:bg-[var(--mq-paper-tint)] hover:text-[var(--mq-ink)] transition-colors mashq-focus';

// ── Navigation (specimen index) ────────────────────────────────
// Desktop tabs read as the ruled index of a specimen sheet: mono specimen
// labels, tracked and uppercase, one voice with the mobile bar. Active = an
// inked label sitting on a teal ruled stroke; inactive = faint ink.
const NAV_BASE =
  "group inline-flex items-center gap-2 px-1 pb-2.5 pt-1 " +
  "font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.14em] " +
  'border-b-2 transition-colors mashq-focus';
export const NAV_ITEM = `${NAV_BASE} border-transparent text-[var(--mq-ink-faint)] hover:text-[var(--mq-ink)]`;
export const NAV_ITEM_ACTIVE = `${NAV_BASE} border-[var(--mq-accent)] text-[var(--mq-ink)]`;

// Mobile bottom-bar item — same mono specimen-label voice.
export const BOTTOM_ITEM =
  'flex flex-col items-center justify-center gap-1 flex-1 min-h-[52px] py-2 ' +
  "text-[10px] font-medium tracking-[0.06em] font-['JetBrains_Mono',monospace] uppercase transition-colors mashq-focus";
export const BOTTOM_ITEM_ACTIVE = `${BOTTOM_ITEM} text-[var(--mq-accent)] font-semibold`;
export const BOTTOM_ITEM_INACTIVE = `${BOTTOM_ITEM} text-[var(--mq-ink-faint)] hover:text-[var(--mq-ink)]`;

// ── Inputs ─────────────────────────────────────────────────────
export const INPUT =
  'w-full text-sm text-[var(--mq-ink)] placeholder-[var(--mq-ink-ghost)] ' +
  'border border-[var(--mq-rule-strong)] rounded-[3px] px-3 py-2.5 bg-[var(--mq-paper-sunk)] ' +
  'focus:border-[var(--mq-accent)] focus:outline-none mashq-focus ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';
export const TEXTAREA = `${INPUT} resize-y`;
export const LABEL = 'block mb-1.5 ' +
  "font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.14em] text-[var(--mq-ink-faint)]";

// ── Modal ──────────────────────────────────────────────────────
// A lit panel raised off the glass; scrim darkens the board behind it.
export const MODAL_SCRIM = 'fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 sm:p-4';
export const MODAL_PANEL =
  'bg-[var(--mq-paper-raised)] mashq-sheet rounded-t-[6px] sm:rounded-[6px] border border-[var(--mq-rule)] ' +
  'w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto';
export const MODAL_HEADER =
  'sticky top-0 bg-[var(--mq-paper-raised)] border-b border-[var(--mq-rule-soft)] px-5 py-4 flex items-baseline justify-between gap-3 z-10';
export const MODAL_FOOTER =
  'sticky bottom-0 px-5 py-3 border-t border-[var(--mq-rule-soft)] bg-[var(--mq-paper-sunk)] flex justify-end gap-2';

// ── Layout ─────────────────────────────────────────────────────
export const CONTAINER = 'max-w-[1180px] mx-auto px-4 sm:px-7';
