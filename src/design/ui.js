/**
 * Design system primitives — slate + emerald.
 *
 * Used across the redesigned teacher and student portals so every page
 * draws from the same token set. Import the class strings, don't copy
 * them. If we tighten the design later, every page updates from here.
 *
 * Principles (read this before adding a new primitive):
 * - One brand colour: emerald, used assertively and only on:
 *     - primary actions (Submit, Save, Continue)
 *     - the active progress fill / live total
 *     - selected-state of grade chips and similar
 * - Slate everywhere else. No 'gray' utilities — use slate variants.
 * - Status colours (emerald-700 success, amber-700 pending, red-700 issue)
 *   are used in TEXT only, never as decorative pill backgrounds.
 * - No gradients. No decorative icons next to every label.
 * - Cards have real chrome: border + shadow-sm + rounded-xl. Cards lift
 *   off bg-slate-50 page background.
 * - Mobile-first: tap targets ≥ 44px, sticky top header, optional sticky
 *   bottom tab bar, two-column layouts collapse to stacked at lg:.
 */

// ── Page surfaces ──────────────────────────────────────────────
export const PAGE = 'min-h-screen bg-slate-50';

// ── Card chrome ────────────────────────────────────────────────
export const CARD = 'bg-white border border-slate-200 rounded-xl shadow-sm';
// Card with no internal padding — the consumer adds px-5 py-4 sections.
export const CARD_OVERFLOW = `${CARD} overflow-hidden`;
// Standard card header strip (heading + optional action on the right).
export const CARD_HEADER = 'px-5 py-4 border-b border-slate-100';
// Card body section.
export const CARD_BODY = 'px-5 py-4';
// Card footer strip (subtle slate-50 background to delineate actions).
export const CARD_FOOTER = 'px-5 py-3 border-t border-slate-100 bg-slate-50';

// ── Buttons ────────────────────────────────────────────────────
export const BTN_PRIMARY =
  'inline-flex items-center justify-center px-4 py-2 ' +
  'bg-emerald-600 text-white text-sm font-medium rounded-md ' +
  'hover:bg-emerald-700 active:bg-emerald-800 ' +
  'disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed ' +
  'transition-colors';

export const BTN_SECONDARY =
  'inline-flex items-center justify-center px-3 py-2 ' +
  'bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md ' +
  'hover:bg-slate-50 hover:border-slate-400 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-colors';

// Plain text button used inline (e.g. "Mark complete" / "Remove").
export const BTN_GHOST =
  'inline-flex items-center justify-center px-2 py-1 ' +
  'text-slate-600 text-xs font-medium rounded ' +
  'hover:bg-slate-100 hover:text-slate-900 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-colors';

// Destructive variant — used sparingly, for things like "Delete".
export const BTN_DESTRUCTIVE =
  'inline-flex items-center justify-center px-3 py-2 ' +
  'bg-white border border-red-200 text-red-700 text-sm font-medium rounded-md ' +
  'hover:bg-red-50 hover:border-red-300 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-colors';

// ── Inputs ─────────────────────────────────────────────────────
export const INPUT =
  'w-full text-sm text-slate-900 placeholder-slate-400 ' +
  'border border-slate-300 rounded-md px-3 py-2 bg-white ' +
  'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

// Compact numeric input — for inline score / max / weight fields.
export const INPUT_NUMERIC =
  'text-sm tabular-nums text-slate-900 ' +
  'border border-slate-300 rounded-md px-2 py-1.5 bg-white ' +
  'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

// Native select element — same look as INPUT, with a chevron-friendly
// right padding.
export const SELECT =
  'w-full text-sm text-slate-900 ' +
  'border border-slate-300 rounded-md pl-3 pr-8 py-2 bg-white ' +
  'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

export const TEXTAREA = `${INPUT} resize-y`;

// ── Selectable chips (e.g. grade picker) ───────────────────────
// Default state.
export const CHIP =
  'inline-flex items-center justify-center text-sm px-3 py-1.5 rounded-md ' +
  'bg-white border border-slate-300 text-slate-700 font-medium ' +
  'hover:bg-slate-50 hover:border-slate-400 ' +
  'transition-colors';

// Selected state — branded emerald, not greyscale.
export const CHIP_SELECTED =
  'inline-flex items-center justify-center text-sm px-3 py-1.5 rounded-md ' +
  'bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium';

// ── Typography ─────────────────────────────────────────────────
export const HEADING = 'text-base font-semibold text-slate-900';
export const HEADING_LG = 'text-xl sm:text-2xl font-semibold text-slate-900';
export const HEADING_SM = 'text-sm font-semibold text-slate-900';
// Tiny uppercase label used inside cards (e.g. "EMAIL", "GRADE").
export const LABEL_TINY = 'text-xs font-medium text-slate-500 uppercase tracking-wide';
// Standard form-field label (sentence case).
export const LABEL = 'text-xs font-medium text-slate-700 block mb-1.5';
export const TEXT_BODY = 'text-sm text-slate-700';
export const TEXT_MUTED = 'text-sm text-slate-500';

// ── Status text (in-text only, never as pill backgrounds) ──────
export const STATUS_OK = 'text-emerald-700 font-medium';
export const STATUS_PENDING = 'text-amber-700 font-medium';
export const STATUS_BAD = 'text-red-700 font-medium';

// ── Layout helpers ─────────────────────────────────────────────
// Standard content-width wrapper used inside the page body.
export const CONTAINER = 'max-w-5xl mx-auto px-4 sm:px-6';
// Wider container for dashboards.
export const CONTAINER_WIDE = 'max-w-7xl mx-auto px-4 sm:px-6';

// ── Tab bar (horizontal, used on desktop) ──────────────────────
export const TAB_ACTIVE = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-emerald-600 text-emerald-700';
export const TAB_INACTIVE = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors';

// ── Mobile bottom-tab item ─────────────────────────────────────
export const BOTTOM_TAB = 'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px] py-2 text-[10px] font-medium transition-colors';
export const BOTTOM_TAB_ACTIVE = `${BOTTOM_TAB} text-emerald-700`;
export const BOTTOM_TAB_INACTIVE = `${BOTTOM_TAB} text-slate-500 hover:text-slate-900`;
