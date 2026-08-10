/**
 * HomeHero — the specimen hub's first viewport.
 *
 * The thesis viewport: a monumental mastery glyph (the current program's
 * letterform, inked to the student's progress) stands beside the plain answer
 * to "where am I / what's next" and the one assertive action (Continue). Tiny
 * mono specimen labels annotate the sheet. Scale contrast carries hierarchy.
 */
import { ArrowRight } from 'lucide-react';
import MasteryGlyph from './MasteryGlyph';
import { SpecLabel } from './Sheet';
import { BTN_PRIMARY, SHEET } from '../../../design/mashq';

// Each program is anchored by a letterform the student comes to recognize.
const PROGRAM_GLYPH = {
  tajweed: 'ت',     // tāʾ — Tajwīd
  essentials: 'ع',  // ʿayn — ʿArabiyyah / ʿIlm
};

export default function HomeHero({
  firstName,
  studentId,
  status = 'active',
  programName,
  currentWeek,
  totalWeeks,
  milestoneName,
  programId,
  fill = 1,
  onContinue,
}) {
  const glyph = PROGRAM_GLYPH[programId] || 'ب';
  const pct = Math.round((fill || 0) * 100);

  return (
    <section className={`${SHEET} overflow-hidden mb-6`}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]">
        {/* Left: the plain answer, at reading scale */}
        <div className="p-6 sm:p-8 lg:pr-6 flex flex-col">
          <SpecLabel>Assalāmu ʿalaykum</SpecLabel>
          <h1 className="mt-2 font-sans font-semibold tracking-[-0.02em] text-[var(--mq-ink)] text-[1.7rem] sm:text-[2.1rem] leading-[1.05]">
            {firstName || 'Student'}
          </h1>
          <p className="mt-1 font-['JetBrains_Mono',monospace] text-xs text-[var(--mq-ink-faint)] tracking-[0.04em]">
            {studentId ? (
              <>ID {studentId} · <span className={status === 'active' ? 'text-[var(--mq-accent)]' : 'text-[var(--mq-ink-soft)]'}>{status === 'active' ? 'ACTIVE' : status.toUpperCase()}</span></>
            ) : (
              'Complete payment to receive your Student ID'
            )}
          </p>

          {programName && (
            <div className="mt-auto pt-7">
              <div className="border-t border-[var(--mq-rule-soft)] pt-4">
                {/* "Now studying" is the current-focus marker — yellow (you are here) */}
                <span className="inline-flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[var(--mq-now)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--mq-now)]" /> Now studying
                </span>
                <p className="mt-1.5 font-sans font-semibold text-[var(--mq-ink)] text-lg leading-tight">{programName}</p>
                <p className="mt-1 text-sm text-[var(--mq-ink-soft)]">
                  {milestoneName}
                  {currentWeek && totalWeeks ? (
                    <> · <span className="font-['JetBrains_Mono',monospace] tabular-nums text-[var(--mq-now)]">wk {currentWeek}/{totalWeeks}</span></>
                  ) : null}
                </p>
                {onContinue && (
                  <button onClick={onContinue} className={`${BTN_PRIMARY} mt-5`}>
                    Continue learning <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: the mastery glyph — the specimen. Inked to progress. */}
        <div className="relative flex items-center justify-center px-8 py-8 lg:py-0 lg:pl-10 lg:pr-12 bg-[var(--mq-paper-sunk)] border-t lg:border-t-0 lg:border-l border-[var(--mq-rule)] min-w-[240px]">
          {/* corner registration ticks — specimen-sheet detail */}
          <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-[var(--mq-rule-strong)]" />
          <span className="pointer-events-none absolute right-3 bottom-3 h-3 w-3 border-r border-b border-[var(--mq-rule-strong)]" />
          <div className="flex flex-col items-center gap-3">
            <MasteryGlyph letter={glyph} fill={fill} />
            <div className="text-center">
              <div className="font-['JetBrains_Mono',monospace] tabular-nums text-[var(--mq-accent)] text-sm font-medium">{pct}%</div>
              <SpecLabel className="mt-0.5 block">mastered</SpecLabel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
