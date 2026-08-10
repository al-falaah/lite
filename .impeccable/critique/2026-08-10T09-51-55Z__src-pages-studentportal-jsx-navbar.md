---
target: student portal navbar
total_score: 27
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
timestamp: 2026-08-10T09-51-55Z
slug: src-pages-studentportal-jsx-navbar
---
# Critique — Student Portal Navbar (Operate)

Method: ⚠️ DEGRADED single-context (harness gates general subagents; detector ran clean).

## Design Health Score: 27/36 (Good, 75%)
Heuristics n/a: 9 (nav surfaces no error states).
Weak: Flexibility (2, no shortcuts), Help (2, no nav help entry), Aesthetic (3, twin utility buttons).
Strong: Match real-world (4), Recognition (4, all tabs labelled).

## Design Specificity: authored, not category-interchangeable.
Mono-caps mobile tab labels, warm-paper/backdrop-blur bar, deep-teal active accent, ruled hairline foot = Mashq specimen world. Detector clean [].

## Priority Issues
- [P2] Settings+Logout twin outline buttons read as stock chrome → collapse into one account menu.
- [P2] Desktop (sentence sans) vs mobile (mono-caps) tab type grammar diverges → unify.
- [P1 for Sam] Tabs lack aria-current on active state → screen readers can't tell active tab.
- [P3] No help affordance in nav (WhatsApp FAB unlabelled/separate).
- [P3] Program identity absent from bar on single-enrollment.

## What's Working
Mono-caps mobile tabs (ownable); clear active state; restraint (no gradients/costume shadows).

## Personas
Alex: no keyboard tab nav / palette. Sam: focus rings good but aria-current missing. Casey: thumb-reachable, state persists, targets ≥52px — strong.
