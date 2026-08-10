---
name: The FastTrack Madrasah — Student Portal
description: Mashq (Lightboard) — chalk on the madrasah's e-glass board, where a student's mastery glows in stroke by stroke.
colors:
  paper: "#000000"
  paper-raised: "#0e1112"
  paper-sunk: "#060708"
  paper-tint: "#161a1c"
  ink: "#f4f7f6"
  ink-soft: "#b9c2c1"
  ink-faint: "#7e8a89"
  ink-ghost: "#4f5a59"
  accent: "#24e08a"
  accent-deep: "#16c476"
  on-accent: "#04160f"
  rule: "#26302f"
  rule-soft: "#1a2221"
  rule-strong: "#34423f"
  status-pending: "#ffd23f"
  status-bad: "#ff5d9e"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.7rem, 4vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  glyph:
    fontFamily: "Amiri, serif"
    fontSize: "clamp(7rem, 14vw, 10rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "normal"
  heading:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 600
    fontSize: "1.125rem"
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 400
    fontSize: "0.875rem"
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontWeight: 500
    fontSize: "0.6875rem"
    lineHeight: 1.2
    letterSpacing: "0.16em"
  readout:
    fontFamily: "'JetBrains Mono', monospace"
    fontWeight: 400
    fontSize: "0.75rem"
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  sheet:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  nav-item-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-faint}"
---

# Design System: The FastTrack Madrasah — Student Portal

## Overview

**Creative North Star: "The Lightboard"**

The student portal is the madrasah's **illuminated glass lightboard** — the teaching surface instructors write on in glowing marker — turned into an interface. The board is **true black glass**; everything on it is written in **bright fluorescent markers that glow**. Learning is the practice of a script: a student's progress renders as an Arabic letterform that **glows in from a faint ghost to a bright marker stroke** as it is mastered, and the whole portal is the black board it is written on. White is the primary marker (headings, body); the colored markers — green, cyan, yellow, pink — each distinguish a different kind of thing, exactly as a teacher colour-codes on the glass. Hierarchy is scale contrast — a monumental glowing glyph against small tracked labels — never chrome.

This world refuses three defaults: the generic LMS card-dashboard, the gold-on-green geometric-tile cliché that "Islamic app" collapses into, **and** the warm-cream-paper look that is the reflexive AI rendition of a "manuscript" brief. The lightboard is the product's own teaching instrument; the pure-black glass makes the fluorescent markers sing and lets the brand mark sit at home. Energy comes from the glowing markers, not from color noise on a light ground.

**Key Characteristics:**
- **True black glass** (#000000) as the ground; everything is a glowing marker on it.
- A **marker set** — white (primary), green (brand/primary action), cyan, yellow, pink — each colour used to distinguish a kind of thing, with a soft glow.
- A monumental Amiri Arabic glyph as the hero, written in a glowing marker to real progress.
- Lit *panels* with faint hairline edges floating on the glass — not rounded app cards.
- Monospace specimen labels and readouts (IDs, weeks, counts, percentages) for measured values only.
- Every marker meets WCAG AA on the black glass (white 18:1, green 11:1, cyan 10.6:1, yellow 13.6:1, pink 6.8:1).

## Colors

True black glass written on with bright fluorescent markers. The palette lives once as CSS variables on `.mashq` (see `src/index.css`) — the single source of truth; re-theme by swapping those.

### Primary
- **Green Marker** (#24e08a): The brand marker — the logo's green (#0a9369 / #0e905c) lit for the glass. The primary action (Continue, Join class), the active/live mark, completed strokes, active navigation, and the glowing hero glyph. Deepens to #16c476 on hover; on a green fill, text is **On-Green** (#04160f).

### Secondary markers (used to distinguish things, not decorate)
- **Cyan Marker** (#35d0e6): a second program/subject's colour and secondary live states — the way a teacher uses a second marker.
- **Yellow Marker** (#ffd23f): pending / awaiting states, highlights.
- **Pink Marker** (#ff5d9e): alerts, destructive actions (Log out), errors.
  Programs are colour-coded by marker (Essentials green, Tajwīd cyan, then yellow/pink) — the per-subject glow is set via a `--mark` custom property on the strokes.

### Neutral
- **Glass** (#000000): the ground. A faint cool top-left sheen (overhead light on glass) + edge vignette give depth; no scan-lines.
- **Panel** (#0e1112): a lit panel on the glass (the primary container).
- **Sunk** (#060708) / **Panel Tint** (#161a1c): recessed areas, table headers, hover fills, the glyph stage.
- **White** (#f4f7f6): the primary marker — headings and body.
- **White Soft** (#b9c2c1) / **White Faint** (#7e8a89) / **White Ghost** (#4f5a59): secondary text, labels, placeholders.
- **Rule** (#26302f) / **Rule Soft** (#1a2221) / **Rule Strong** (#34423f): hairline edges and dividers, three weights.

### Named Rules
**The Marker Rule.** Every colour on the glass is a marker with a soft glow, and each marker means something: green = brand/primary, cyan = a second subject/live, yellow = pending, pink = alert/destructive. White is the default marker. Colour is never decorative — it distinguishes.
**The Black-Glass Rule.** The ground is true black (#000000); panels are barely-lifted near-black. Never a tinted or grey ground — the black is what makes the markers glow.
**The Single-Source Rule.** All colours live as CSS variables on `.mashq`; components reference `var(--mq-*)` (and `--mark` for per-subject colour), never a raw hex.
**The Status-in-Text Rule.** Status markers (yellow, pink) live in text and ≤12%-alpha tints only — never as filled pill backgrounds.

## Typography

**Display / Body Font:** system grotesque stack (`system-ui, -apple-system, Segoe UI, Roboto, sans-serif`) — a workhorse Latin voice appropriate for an Operate surface, carrying UI at scale.
**Hero Glyph Font:** Amiri (classical naskh) — the Arabic letterform *material* of the product, used at monumental display size.
**Label / Readout Font:** JetBrains Mono — the specimen hand, for measured values only.
**Qurʾānic text:** Amiri Quran, untouched by this system (governed by lesson-content rules, not the portal shell).

**Character:** A monumental Arabic naskh glyph against tiny tracked-monospace annotations, with a quiet grotesque doing the reading work between them. The specimen-sheet tension — enormous letterform, small precise labels — is the type personality.

### Hierarchy
- **Glyph** (Amiri 400, clamp(7rem, 14vw, 10rem), line-height 0.9): The hero mastery letterform only. Two layers — faint ghost + inked fill clipped to progress.
- **Display** (600, clamp(1.7rem–2.1rem), -0.02em): The student's name on the hub; page titles.
- **Heading** (600, ~1.125rem, -0.01em): Sheet and section headings.
- **Body** (400, 0.875rem, line-height 1.55): Descriptions and prose; secondary in Ink Soft.
- **Label** (JetBrains Mono 500, 0.6875rem, letter-spacing 0.16em, UPPERCASE): Specimen captions ("NOW STUDYING", "MASTERY · BY PROGRAM", milestone/section headers, nav on mobile).
- **Readout** (JetBrains Mono 400, tabular-nums): Measured values — student ID, week counts (`wk 28/104`), percentages, drill counts.

### Named Rules
**The Measured-Value Rule.** Monospace is reserved for genuine measurement — IDs, counts, weeks, percentages, coordinates. It is never a costume for "technical" prose.
**The Scale-Contrast Rule.** Hierarchy comes from size and weight steps (the glyph is ~5× the display, the display ~2× the body), not from added chrome, boxes, or color.

## Layout

A single centered column, max-width 1180px, gutters 16px (mobile) / 28px (desktop). Content is composed as a vertical stack of paper sheets separated by generous space (24px between sheets). Inside a sheet, related items are tight and groups are separated by ruled hairlines rather than nested cards.

The hub's hero is a two-column split on desktop (the plain answer + Continue on the left, the mastery glyph on a sunk-paper stage on the right) that stacks to one column on mobile, the glyph centered below the greeting. Dense sequences (the leaderboard's drills, the classes schedule) are grouped under mono specimen-label headers ("MILESTONE 1 · 11 drills") and rendered as ruled list entries, giving a long run rhythm and a scannable structure instead of a uniform stack.

Navigation is a sticky translucent-paper top bar (backdrop-blur) with a ruled foot; a specimen section-index tab strip below it on desktop; and a fixed bottom tab bar on mobile with monospace-caps labels. Spacing rhythm: more space above a heading than below it; one rhythm throughout.

## Elevation & Depth

Depth is **light on a board**: lit sheets sit above the dark ground via a soft shadow cast into the board plus a faint top edge-light (glass catching light), with their ruled hairline edge. The one deliberate glow in the system is chalk: the mastered glyph and completed strokes carry a soft green bloom. There are no hard offset shadows.

### Shadow / Glow Vocabulary
- **Sheet lift** (`box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset, 0 14px 30px -18px rgba(0,0,0,0.6)`): The only elevation. Every lit sheet carries it; nothing else does.
- **Chalk glow** (`text-shadow: 0 0 18px rgba(22,184,119,0.45)` on the glyph ink; `box-shadow: 0 0 6px rgba(22,184,119,0.5)` on done strokes): reserved for mastery — the glowing letterform and filled stroke marks only.

### Named Rules
**The Lit-Sheet Rule.** Containers are lit sheets on the board: raised dark-green surface, hairline ruled edge, ~4px corners, the single soft cast shadow. No rounded-app-card chrome, no gradient surfaces, no glassmorphism.
**The Glow-For-Mastery Rule.** The green bloom is earned only by progress — the mastered glyph and completed strokes. It is never applied to ordinary chrome, buttons, or borders.

## Shapes

Near-square corners throughout: 2px (chips/marks), 3px (buttons, tabs, menu items), 4px (sheets). The form language is the ruled sheet — hairline borders and dividers in three paper-toned weights do the structural work. Recurring specimen motifs: **registration ticks** (small corner L-marks framing the glyph stage) and **drilled strokes** (a row of short vertical marks that ink in with mastery). The Arabic letterform itself is the dominant silhouette.

## Components

### Buttons
- **Shape:** near-square (3px radius).
- **Primary:** Madrasah Teal (#0f5c4d) fill, paper text (#f4efe4), padding 10px 20px. The one assertive surface — Continue, Join class, Verify.
- **Hover / Focus:** deepens to #0c4a3e; focus shows a 2px teal outline offset 2px (`.mashq-focus`).
- **Secondary:** transparent on paper with a Rule-Strong (#c3b69c) hairline border, ink text; hover fills Paper-Tint. Reads like a stamped field on the sheet.
- **Ghost:** ink-soft text, hover Paper-Tint; for inline actions.

### Cards / Containers (Sheets)
- **Corner Style:** 4px.
- **Background:** Raised Paper (#faf6ec) on the Warm Paper ground.
- **Shadow Strategy:** the single "Sheet lift" (see Elevation).
- **Border:** 1px Rule (#d8cdb8) hairline.
- **Internal Padding:** 20px (mobile) / 24px (desktop).

### Inputs / Fields
- **Style:** paper surface, Rule-Strong hairline, 3px radius.
- **Focus:** 2px teal outline (`.mashq-focus`), not a glow.

### Navigation
- **Top bar:** translucent Warm Paper (#f4efe4 at 85%) with backdrop-blur and a Rule foot; brand favicon + wordmark on the left, a single account menu on the right.
- **Desktop tabs:** icon + label, ink-faint at rest; active is ink with a 2px teal underline stroke and `aria-current="page"`.
- **Mobile bottom bar:** fixed, translucent-paper, monospace-caps labels; active in teal with `aria-current="page"`; tap targets ≥52px.
- **Account menu:** an initials-avatar chip (teal, 2px) + chevron opens a paper-sheet dropdown (name + mono ID header, Settings / Help / Log out); closes on outside-click and Escape.

### Mastery Glyph (signature)
A large Amiri letterform (the current program's initial — `ت` Tajwīd, `ع` ʿArabiyyah) rendered in two layers: a faint ghost (chalk at ~10%) and a glowing brand-green fill clipped from the bottom by a `--fill` custom property (0–1), so mastery reads as chalk written and lit on the board. The fill animates with an exponential ease-out (`clip-path 900ms cubic-bezier(0.16,1,0.3,1)`), and snaps under `prefers-reduced-motion`. Paired with a percentage readout and a "mastered" label, framed by corner registration ticks.

### Strokes meter (signature)
A mastery bar drawn as a row of short vertical "drilled" strokes of slightly varied height; completed strokes are teal, remaining are Rule-Strong. Used for per-program mastery on the hub — the mashq repetition made into a progress reading.

## Do's and Don'ts

### Do:
- **Do** keep ink-on-warm-paper: page ground #f4efe4, ink #211d17, secondary from the paper hue (#5c5347 / #8a7f6d).
- **Do** use Brand Green (#24e08a) only for the primary action, the active/live state, and mastery — the One Voice Rule.
- **Do** render containers as lit sheets on the board (4px, hairline border, the single soft paper shadow), and separate groups inside them with hairlines, not nested cards.
- **Do** reserve JetBrains Mono for measured values and specimen labels; set them UPPERCASE with 0.16em tracking.
- **Do** let the Arabic letterform carry hero scale; hierarchy is scale contrast.
- **Do** give dense lists (drills, schedules) a mono section header and ruled entries so a long run has rhythm and scannability.

### Don't:
- **Don't** introduce `slate`/`gray` neutrals, pure white, or pure black — every neutral is a board-green or chalk tone.
- **Don't** use a second saturated color, gradients, glass/blur-as-decoration, colored glows, or hard offset shadows.
- **Don't** build same-size app cards (or nested cards) as the page structure; use sheets and ruled sections.
- **Don't** use monospace as a costume for prose, or set status colors as filled pill backgrounds.
- **Don't** alter Qurʾānic/lesson content or its Amiri Quran rendering — this system governs the portal shell only.
- **Don't** reintroduce a paper/light theme toggle here; the world is committed to the dark lightboard.
