// LMS-specific design tokens for the student portal.
// Extends the base design/ui.js with dark-mode-aware variants and new components.
// Imported alongside design/ui.js by StudentPortal.jsx and other LMS-specific pages.

// Re-export safe tokens from design/ui.js that need no changes (no dark mode, no gray/slate issue)
export {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_GHOST,
  BTN_DESTRUCTIVE,
  INPUT,
  INPUT_NUMERIC,
  SELECT,
  TEXTAREA,
  CHIP,
  CHIP_SELECTED,
  CONTAINER,
  CONTAINER_WIDE,
} from './ui';

// === New, LMS-specific dark-mode-aware tokens ===

// Card chrome: full dark-mode support, slate + emerald palette
export const CARD_DARK =
  'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm';

export const CARD_OVERFLOW_DARK = `${CARD_DARK} overflow-hidden`;

export const CARD_HEADER_DARK =
  'px-5 py-4 border-b border-slate-100 dark:border-gray-700';

export const CARD_BODY_DARK = 'px-5 py-4';

export const CARD_FOOTER_DARK =
  'px-5 py-3 border-t border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50';

// Page background
export const PAGE_DARK = 'min-h-screen bg-slate-50 dark:bg-gray-900';

// Typography with dark mode
export const HEADING_DARK = 'text-base font-semibold text-slate-900 dark:text-white';

export const HEADING_LG_DARK =
  'text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white';

export const HEADING_SM_DARK = 'text-sm font-semibold text-slate-900 dark:text-white';

export const LABEL_TINY_DARK =
  'text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide';

export const LABEL_DARK = 'text-xs font-medium text-slate-700 dark:text-gray-300 block mb-1.5';

export const TEXT_BODY_DARK = 'text-sm text-slate-700 dark:text-gray-300';

export const TEXT_MUTED_DARK = 'text-sm text-slate-500 dark:text-gray-400';

// Tab bar variants with dark mode (alternative to design/ui.js TAB_ACTIVE/INACTIVE if full dark tokenization needed)
// Currently design/ui.js tabs are light-only; these are backups if needed
export const TAB_ACTIVE_DARK = `inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500`;

export const TAB_INACTIVE_DARK = `inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600`;

// Context strip: persistent course/program orientation
export const CONTEXT_STRIP =
  'bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-3';

export const CONTEXT_STRIP_LABEL =
  'text-xs font-medium text-slate-600 dark:text-gray-400 uppercase tracking-wide';

export const CONTEXT_STRIP_TEXT =
  'text-sm font-medium text-slate-900 dark:text-white';

export const CONTEXT_PROGRAM_PILL =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600 cursor-pointer transition-colors';

export const CONTEXT_PROGRAM_PILL_ACTIVE =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-colors';

// Status text tokens (text-only, no pill backgrounds — per design doc)
export const STATUS_OK_DARK = 'text-emerald-700 dark:text-emerald-400 font-medium';

export const STATUS_PENDING_DARK = 'text-amber-700 dark:text-amber-400 font-medium';

export const STATUS_BAD_DARK = 'text-red-700 dark:text-red-400 font-medium';

// Table/list styling for schedule and tabular data
export const TABLE_HEADER_CELL =
  'text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wide bg-slate-50 dark:bg-gray-700/50 px-4 py-2 text-left';

export const TABLE_BODY_CELL =
  'px-4 py-3 text-sm text-slate-900 dark:text-gray-300 border-b border-slate-100 dark:border-gray-700';

export const TABLE_ROW = 'hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors';

// Badge/pill styling (for tags, labels — distinct from status-text)
export const BADGE_NEUTRAL =
  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300';

export const BADGE_EMERALD =
  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400';

export const BADGE_AMBER =
  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400';

export const BADGE_RED =
  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400';

// Text-only status pills (for headers, not full-pill backgrounds)
export const STATUS_PILL_OK =
  'inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400';

export const STATUS_PILL_PENDING =
  'inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400';

export const STATUS_PILL_BAD =
  'inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400';

// Compact CTA button for dense list rows (36px tap-target, 8px-grid aligned)
// Note: This is a scoped exception to the 44px tap-target principle in ui.js.
// 36px is the accepted minimum for dense list/table-row contexts (iOS/Material standard).
export const BTN_CTA_COMPACT =
  'inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[36px] ' +
  'bg-amber-600 text-white text-xs font-semibold rounded-md ' +
  'hover:bg-amber-700 active:bg-amber-800 ' +
  'transition-colors';
