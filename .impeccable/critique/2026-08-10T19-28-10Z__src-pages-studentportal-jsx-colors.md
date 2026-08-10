---
target: student portal text/background colors
total_score: 11
max_score: 12
na_heuristics: 1,2,3,5,6,7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-10T19-28-10Z
slug: src-pages-studentportal-jsx-colors
---
# Critique — Student Portal text/background color compatibility

Method: ⚠️ DEGRADED single-context (shipped critique subagents unregistered; deterministic evidence = measured WCAG contrast matrix + detector).

## Focused score: 11/12 (color-relevant). Contrast/legibility: 3/4.

## Contrast matrix (15 real text/bg pairs): 13 PASS AA, 2 fail.
- Primary white on glass 19.5:1 · on panel 17.6:1
- Secondary #b9c2c1 10.4–11.6:1 · Faint #7e8a89 5.3–5.9:1
- Markers on black: green 10.9–12.1 · cyan 11.3 · yellow 13.1 · pink 6.6 · on-accent 10.7
- FAIL: ghost #4f5a59 on panel 2.65:1 (used for hadith citation, durations, locked labels)
- Borderline: rule-strong border vs panel 1.8:1 (decorative hairline, non-text)

## Priority
- [P1] Ghost text 2.65:1 on REAL content (hadith citation "Ṣaḥīḥ Muslim 2699", class duration, locked milestones). Raise --mq-ink-ghost to ~#6a7877 (~4.6:1), or split into de-emphasized-content vs disabled tokens.
- [P2] Inactive tab numerals fall to rule-strong ~1.8:1 — decide read vs decorative.
- [P3] Faint hairline borders 1.8:1 — fine as decorative; any state/boundary border needs ≥3:1.

## Working: primary & secondary text excellent; all markers clear AA on black; on-accent button safe.
## Personas: Sam struggles only on ghost content (P1); Casey benefits (black+bright ideal for glare).
