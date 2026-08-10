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

// === Mashq world tokens (student portal) ===
// These *_DARK names are retained for import compatibility, but now carry the
// Mashq paper-and-ink world: a specimen sheet on warm paper, one deep accent.
// The portal committed to a single luminous light treatment, so dark-mode
// variants are intentionally gone here.

// A specimen sheet: paper raised off the ground, ruled hairline edge, soft
// paper shadow (via .mashq-sheet), square-ish corners (paper, not app card).
export const CARD_DARK =
  'bg-[var(--mq-paper-raised)] border border-[var(--mq-rule)] rounded-[4px] mashq-sheet';

export const CARD_OVERFLOW_DARK = `${CARD_DARK} overflow-hidden`;

export const CARD_HEADER_DARK =
  'px-5 py-4 border-b border-[var(--mq-rule-soft)]';

export const CARD_BODY_DARK = 'px-5 py-4';

export const CARD_FOOTER_DARK =
  'px-5 py-3 border-t border-[var(--mq-rule-soft)] bg-[var(--mq-paper-sunk)]';

// Page background (unused by the portal root now, kept for compatibility)
export const PAGE_DARK = 'min-h-screen bg-[var(--mq-paper)]';

// Typography — ink on paper; secondary ink is tinted, never gray.
export const HEADING_DARK = 'text-base font-semibold text-[var(--mq-ink)]';

export const HEADING_LG_DARK =
  'text-lg sm:text-xl font-semibold text-[var(--mq-ink)] tracking-[-0.01em]';

export const HEADING_SM_DARK = 'text-sm font-semibold text-[var(--mq-ink)]';

export const LABEL_TINY_DARK =
  "text-[11px] font-medium text-[var(--mq-ink-faint)] uppercase tracking-[0.16em] font-['JetBrains_Mono',monospace]";

export const LABEL_DARK = 'text-xs font-medium text-[var(--mq-ink-soft)] block mb-1.5';

export const TEXT_BODY_DARK = 'text-sm text-[var(--mq-ink-soft)]';

export const TEXT_MUTED_DARK = 'text-sm text-[var(--mq-ink-faint)]';

// Tab bar variants with dark mode (alternative to design/ui.js TAB_ACTIVE/INACTIVE if full dark tokenization needed)
// Currently design/ui.js tabs are light-only; these are backups if needed
export const TAB_ACTIVE_DARK = `inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500`;

export const TAB_INACTIVE_DARK = `inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600`;

// Context strip: persistent course/program orientation
export const CONTEXT_STRIP =
  'bg-[var(--mq-paper-tint)]/60 border-b border-[var(--mq-rule)] px-4 sm:px-6 py-3';

export const CONTEXT_STRIP_LABEL =
  "text-[11px] font-medium text-[var(--mq-ink-faint)] uppercase tracking-[0.16em] font-['JetBrains_Mono',monospace]";

export const CONTEXT_STRIP_TEXT =
  'text-sm font-semibold text-[var(--mq-ink)]';

export const CONTEXT_PROGRAM_PILL =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[var(--mq-rule-strong)] text-sm font-medium text-[var(--mq-ink-soft)] hover:bg-[var(--mq-paper-tint)] hover:text-[var(--mq-ink)] cursor-pointer transition-colors';

export const CONTEXT_PROGRAM_PILL_ACTIVE =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[var(--mq-accent)] text-sm font-medium text-[var(--mq-on-accent)] cursor-pointer';

// Status text tokens (text-only, no pill backgrounds — per design doc)
export const STATUS_OK_DARK = 'text-[var(--mq-accent)] font-medium';

export const STATUS_PENDING_DARK = 'text-[var(--mq-warn)] font-medium';

export const STATUS_BAD_DARK = 'text-[var(--mq-bad)] font-medium';

// Table/list styling for schedule and tabular data
export const TABLE_HEADER_CELL =
  "text-[11px] font-semibold text-[var(--mq-ink-faint)] uppercase tracking-[0.12em] font-['JetBrains_Mono',monospace] bg-[var(--mq-paper-sunk)] px-4 py-2 text-left";

export const TABLE_BODY_CELL =
  'px-4 py-3 text-sm text-[var(--mq-ink)] border-b border-[var(--mq-rule-soft)]';

export const TABLE_ROW = 'hover:bg-[var(--mq-paper-tint)] transition-colors';

// Badge/pill styling (for tags, labels — distinct from status-text)
export const BADGE_NEUTRAL =
  'inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-medium bg-[var(--mq-paper-tint)] text-[var(--mq-ink-soft)]';

export const BADGE_EMERALD =
  'inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-medium bg-[var(--mq-accent)]/10 text-[var(--mq-accent)]';

export const BADGE_AMBER =
  'inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-medium bg-[var(--mq-warn)]/12 text-[var(--mq-warn)]';

export const BADGE_RED =
  'inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-medium bg-[var(--mq-bad)]/12 text-[var(--mq-bad)]';

// Text-only status pills (for headers, not full-pill backgrounds)
export const STATUS_PILL_OK =
  'inline-flex items-center gap-1 text-xs font-medium text-[var(--mq-accent)]';

export const STATUS_PILL_PENDING =
  'inline-flex items-center gap-1 text-xs font-medium text-[var(--mq-warn)]';

export const STATUS_PILL_BAD =
  'inline-flex items-center gap-1 text-xs font-medium text-[var(--mq-bad)]';

// Compact CTA button for dense list rows (36px tap-target, 8px-grid aligned).
// The one warm call-to-pay accent stays distinct from the primary accent.
export const BTN_CTA_COMPACT =
  'inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[36px] ' +
  'bg-[var(--mq-accent)] text-[var(--mq-on-accent)] text-xs font-semibold rounded-[3px] ' +
  'hover:bg-[var(--mq-accent-deep)] active:bg-[var(--mq-accent-deeper)] ' +
  'transition-colors';
