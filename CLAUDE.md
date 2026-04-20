# Project Conventions — alfalaah

## Arabiyyah 101 lesson authoring rules

Source of truth for all lesson content is [public/content/arabiyyah/](public/content/arabiyyah/). Lessons are HTML files rendered in-app via iframe / full_html. When rewriting lessons:

### Voice and tone
- **Write like a human teacher writing notes**, not like AI. No "Imagine you are walking through a desert…", no "Welcome to your very first…", no rhetorical questions, no "Ready?", no "breathtaking", no motivational preamble.
- Notes are **supporting material for a teacher's explanation in class** — they must be precise and concise, not substitute for the teacher.
- State the rule, show the example, move on. No filler, no drama, no "secret unlocks" framing.
- No AI-signal words: *unveil, journey, dive into, unpack, breathtaking, fingerprint, architecture, secret, magic, let's, together, the beautiful surprise, zoom into*.

### Content discipline
- **Do not invent rules or examples from AI training.** Only use rules and examples that exist in the user-supplied handwritten notes / existing lesson files.
- **Preserve the rich examples** from existing lessons — when rewriting, keep the vocabulary tables, Qur'anic examples, and scholar references intact.
- **Every Qur'anic example must be accurate** — verified āyah wording and correct sūrah reference. If unsure, omit rather than guess.
- Terminology for Arabic word categories: use **noun / verb / particle** (the user's audience has English grammar background). Not Namer/Doer/Connector.

### Structure
- Keep the existing HTML styling conventions used across [01_al-kalam_wa_aqsaamuhu.html](public/content/arabiyyah/01_al-kalam_wa_aqsaamuhu.html) and [05_al-ism_naouhu_wa_adaduhu.html](public/content/arabiyyah/05_al-ism_naouhu_wa_adaduhu.html) — green/teal schematic tables, `<div class="tip">` callouts, `dir="rtl"` on Arabic, RTL table ordering (first `<td>` sits on the right).
- RTL tables: the first `<td>` in a row is the rightmost cell when reading. For a Qur'anic āyah tagged word-by-word, put the first word of the āyah as the first `<td>`.
- Use schematic tables (tree-style, with ↓ arrows) for classification hierarchies where they aid comprehension.

### When user asks to split or merge lessons
- Keep all vocabulary tables and examples — redistribute, don't delete.
- Split on a clean conceptual boundary (e.g. definite/indefinite is one lesson; gender/type is another; number is another; case is another).
- Each lesson should have one clear grammatical focus, not three.
