import { CARD_DARK } from '../../design/lms';

/**
 * Shared data-state primitives for the portals.
 *
 * Spinner      — canonical loading spinner (was copy-pasted across portals).
 * CardSkeleton — card-shaped pulse placeholder; use instead of returning null
 *                while a card's fetch is in flight (avoids pop-in layout shift).
 * EmptyState   — icon + title + description + optional CTA, for "no data yet".
 *                Not for errors: failures should render distinct copy + retry.
 */

const SPINNER_SIZES = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
};

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`${SPINNER_SIZES[size] || SPINNER_SIZES.md} animate-spin rounded-full border-2 border-emerald-600 border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className={`${CARD_DARK} p-4 sm:p-5 space-y-3`} aria-hidden="true">
      <div className="h-4 w-32 bg-slate-100 dark:bg-gray-700 rounded animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 dark:bg-gray-700 rounded animate-pulse" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && <Icon className="h-8 w-8 text-slate-300 dark:text-gray-600 mx-auto mb-3" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
      {description && (
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
