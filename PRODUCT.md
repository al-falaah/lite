# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences dominate design priority; staff tools are first-class but yield when trade-offs arise.

- **Prospective students** evaluating the madrasah on the public site (landing, programs, mission, apply). They are deciding whether to enroll in a paid, multi-year Islamic-education program delivered online.
- **Enrolled students** learning day-to-day in the student portal: reading lessons, taking gamified quizzes and milestone tests, using the interactive Arabic/tajwīd tools, and tracking their own progress toward certification.

Secondary audiences (real, but not the priority when trade-offs arise):
- **Teachers** — deliver lessons, grade recitations/oral tests, manage assigned students (`/teacher`).
- **Staff/admin roles** — `director`, `academic_dean`, `registrar`, plus store/blog admins — run applications, enrollment, payments, curriculum authoring (`/research/admin`), and operations.

## Product Purpose

The FastTrack Madrasah is a web platform that runs an online Islamic school end-to-end: it markets programs to prospective students, handles application → approval → enrollment → payment, and then delivers the actual structured learning (Qurʾān literacy, tajwīd, Arabic language, and Islamic studies) with progress tracking and certification. Success is a student who moves from first visit through enrollment to genuinely learning and completing a graded curriculum.

## Positioning

What a neighboring product could not truthfully copy: **making traditional-madrasah subjects (Qurʾān literacy, tajwīd, Arabic grammar, Islamic studies) genuinely engaging and easy to digest through teaching aids you rarely see in a traditional madrasah** — gamified quizzes, milestone tests, interactive corpus-backed learning tools, and modern teaching instruments (e-glass / lightboard-style presentation). It pairs the authenticity and rigor of a classical curriculum with a modern, digestible, interactive delivery.

## Operating Context

- **Programs** (real, graded curricula): Arabiyyah 101 (Arabic), Islamiyyah 101 (Islamic studies), QARI Fundamentals (Qurʾān recitation), and TMP (Tajwīd) 101/102/201/301 — organized under program tracks EASI/QARI/TMP with milestones and weeks.
- **Student journey:** public multi-step application → admin review/approval → token-based invite signup → enrollment → payment schedule → structured lessons, drills, milestone tests → certification. Automatic student numbers (`AF{YY}{####}`).
- **Payments:** dual options — Stripe card (international students, instant) and manual bank transfer (NZ students, zero-fee, proof-of-payment upload + admin verification). Currency NZD.
- **Operated from New Zealand** (Auckland timezone, `Pacific/Auckland`), serving students worldwide online.
- **Lesson authoring:** lessons are HTML in `lesson_chapters.content`, authored in a Tiptap rich-text editor in `/research/admin` or uploaded as full HTML; source-of-truth Arabic lesson content lives in `public/content/arabiyyah/`.
- **Public learning tools** (`/tools`): tajwīd examples finder, tajwīd drill test, nahw/ṣarf examples, root explorer — backed by Qurʾān corpus data.

## Capabilities and Constraints

- **Stack (existing):** React 18 + Vite, Tailwind, React Router; Supabase (PostgreSQL, Auth, RLS) backend; Stripe payments; Resend transactional email; Tiptap editor; PWA. lucide-react icons, react-helmet-async.
- **Roles:** `student`, `teacher`, `director`, `academic_dean`, `registrar` (+ store/blog admin scopes), enforced with Supabase Row-Level Security and protected routes.
- **Qurʾān corpus data** in Supabase (`quran_tajweed_aya` = vowelled ʿUthmānī + tajwīd markup; Markaz Tafsīr tables for tafsīr / word-grammar / asbāb, CC BY 4.0). Learning content is keyed by (sūrah, āyah).
- **Terminology:** use noun / verb / particle for Arabic word categories (audience has English grammar background), not invented labels. Standard tajwīd terms (idghām, ikhfāʾ, iẓhār, ghunnah, etc.).

## Brand Commitments

- **Name:** The FastTrack Madrasah (repo/package alias `tftmadrasah` / `alfalaah`).
- **Voice:** dignified, precise, and instructional — like a human teacher writing class notes, not marketing hype or AI filler. Lesson notes are *supporting material for a teacher's explanation*, precise and concise (see CLAUDE.md authoring rules). No AI-signal words (unveil, journey, dive into, magic, etc.).
- **Core values (from README):** Authenticity (curriculum grounded in Qurʾān and Sunnah), Accessibility, Transparency, Efficiency, Excellence.
- **Tone must suit an Islamic educational institution:** dignified, modest; no imagery or content inappropriate for the audience.

## Evidence on Hand

- Real, graded curriculum content in the database and `public/content/arabiyyah/` (published lessons + quizzes; e.g. verified tajwīd chapters).
- Verified Qurʾān corpus (6236 āyāt, vowelled + tajwīd-annotated) and Markaz Tafsīr dataset (tafsīr in 6 sources incl. English Mukhtaṣar, word-level grammar, asbāb al-nuzūl) — attributed to "Tafsir Center for Quranic Studies (tafsir.net)".
- Working application, payment (Stripe + bank transfer), and email (Resend) flows.
- **Fees are marked TBC in the README** — do not fabricate specific prices, discounts, testimonials, student counts, or accreditation claims; none are confirmed.

## Product Principles

1. **Authenticity is non-negotiable.** Curriculum is grounded in Qurʾān and Sunnah; every Qurʾānic example is verified against the muṣḥaf, never fabricated. Existing Islamic content and lessons must not be altered by design/UX work.
2. **Make the rigorous digestible.** The differentiator is engagement — gamified quizzes, milestone tests, interactive tools, and modern teaching aids that make classical subjects approachable without diluting them.
3. **Two front doors matter most:** the marketing surface that earns enrollment and the learning surface that delivers it. Design should make both excellent; admin tooling serves them.
4. **Respect the material.** Correct Arabic/RTL rendering, vowelled ʿUthmānī text, proper Islamic terminology, and a modest, dignified tone are part of correctness, not polish.
5. **Protect the student.** Payment flows, role-based access, and student-data protection are load-bearing and must never be weakened for visual or UX gains.

## Accessibility & Inclusion

- **Bilingual / bidirectional:** Arabic (RTL, vowelled ʿUthmānī script) alongside English (LTR) must both render correctly, including mixed-direction content and Arabic typography.
- **Range of technical ability:** README commits to an easy-to-use platform for students of all technical abilities — favor clarity and low cognitive load.
- **Modesty:** visuals and content appropriate for an Islamic educational audience.
