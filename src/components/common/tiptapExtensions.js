import { Node, Mark, Extension, mergeAttributes } from '@tiptap/core';
import Superscript from '@tiptap/extension-superscript';

/**
 * Custom Tiptap extensions for the site's lesson HTML vocabulary.
 *
 * Tiptap silently strips any HTML it doesn't model, so every custom
 * class/attribute used by existing lessons needs an extension here or a
 * load→save round-trip in the editor would destroy it. Keep these in sync
 * with the reader styles in StudentLessons.jsx (.tip, .verse, .arabic-prose)
 * and the footnote tooltips (sup[data-footnote]).
 */

// <div class="tip">…</div> — typed callout box.
// variant: '' (Note, default) | 'key' (Key terms) | 'warning' (Caution)
// serialized as class="tip" / "tip tip-key" / "tip tip-warning".
export const TipCallout = Node.create({
  name: 'tipCallout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: '',
        parseHTML: (el) => {
          if (el.classList.contains('tip-key')) return 'key';
          if (el.classList.contains('tip-warning')) return 'warning';
          return '';
        },
        // rendered via the class in renderHTML, not as its own attribute
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    // Priority beats the generic styled-div rule below
    return [{ tag: 'div.tip', priority: 100 }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const variant = node.attrs.variant;
    const cls = variant ? `tip tip-${variant}` : 'tip';
    return ['div', mergeAttributes(HTMLAttributes, { class: cls }), 0];
  },
  addCommands() {
    return {
      toggleTipCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
      setTipVariant:
        (variant) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { variant }),
    };
  },
});

// <p class="verse"> — centered Qur'anic verse (also parses legacy <div class="verse">)
export const VerseBlock = Node.create({
  name: 'verseBlock',
  // Must out-prioritize the default Paragraph parse rule, which also matches <p>
  priority: 1000,
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() {
    // Rule-level priority beats the default Paragraph rule for <p> (default 50)
    return [{ tag: 'p.verse', priority: 100 }, { tag: 'div.verse', priority: 100 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { class: 'verse', dir: 'rtl' }), 0];
  },
  addCommands() {
    return {
      setVerseBlock:
        () =>
        ({ commands }) =>
          commands.toggleNode(this.name, 'paragraph'),
    };
  },
});

// <p class="arabic-prose"> — right-aligned RTL Arabic prose
export const ArabicProse = Node.create({
  name: 'arabicProse',
  // Must out-prioritize the default Paragraph parse rule, which also matches <p>
  priority: 1000,
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() {
    // Rule-level priority beats the default Paragraph rule for <p> (default 50)
    return [{ tag: 'p.arabic-prose', priority: 100 }, { tag: 'div.arabic-prose', priority: 100 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { class: 'arabic-prose', dir: 'rtl' }), 0];
  },
  addCommands() {
    return {
      setArabicProse:
        () =>
        ({ commands }) =>
          commands.toggleNode(this.name, 'paragraph'),
    };
  },
});

// Superscript that preserves data-footnote (register INSTEAD of plain Superscript)
export const FootnoteSup = Superscript.extend({
  addAttributes() {
    return {
      'data-footnote': {
        default: null,
        parseHTML: (el) => el.getAttribute('data-footnote'),
        renderHTML: (attrs) =>
          attrs['data-footnote'] ? { 'data-footnote': attrs['data-footnote'] } : {},
      },
    };
  },
});

// Types that carry dir/style in real lesson & blog content (verified by
// scripts/auditRichTextVocabulary.js against the live DB).
const ATTR_TYPES = [
  'paragraph', 'heading', 'blockquote', 'listItem', 'bulletList', 'orderedList',
  'table', 'tableRow', 'tableCell', 'tableHeader', 'horizontalRule', 'image',
  'tipCallout', 'verseBlock', 'arabicProse', 'figure', 'figcaption',
  'spanMark', 'smallMark', 'italic', 'bold', 'link', 'styledDiv',
];

// Preserve dir="rtl" (or any dir) wherever real content uses it
export const DirAttribute = Extension.create({
  name: 'dirAttribute',
  addGlobalAttributes() {
    return [
      {
        types: ATTR_TYPES,
        attributes: {
          dir: {
            default: null,
            parseHTML: (el) => el.getAttribute('dir'),
            renderHTML: (attrs) => (attrs.dir ? { dir: attrs.dir } : {}),
          },
        },
      },
    ];
  },
});

// Preserve inline style attributes — the audit found style="" on td (1874×),
// span (547×), th, small, p, table, em, tr, ul, div, and more. Without this,
// Tiptap silently strips all of it on load.
export const StyleAttribute = Extension.create({
  name: 'styleAttribute',
  addGlobalAttributes() {
    return [
      {
        types: ATTR_TYPES,
        attributes: {
          style: {
            default: null,
            parseHTML: (el) => el.getAttribute('style'),
            renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
          },
        },
      },
    ];
  },
});

// <span> — 1,130 uses in real content, carrying dir/style (Arabic snippets,
// colored text). Tiptap unwraps unknown spans, losing those attributes.
export const SpanMark = Mark.create({
  name: 'spanMark',
  parseHTML() {
    // Only claim spans that actually carry something worth keeping
    return [
      { tag: 'span[style]' },
      { tag: 'span[dir]' },
      { tag: 'span[class]' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
    };
  },
});

// <small> — 207 uses (footnote-ish annotations with dir/style)
export const SmallMark = Mark.create({
  name: 'smallMark',
  parseHTML() {
    return [{ tag: 'small' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['small', HTMLAttributes, 0];
  },
});

// <figure><img/><figcaption> — used in blog posts
export const Figcaption = Node.create({
  name: 'figcaption',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'figcaption' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figcaption', HTMLAttributes, 0];
  },
});

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'block* figcaption?',
  parseHTML() {
    return [{ tag: 'figure' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', HTMLAttributes, 0];
  },
});

// Generic styled <div> container (33 uses beyond .tip/.verse). Lower parse
// priority than TipCallout/VerseBlock so it never swallows those.
export const StyledDiv = Node.create({
  name: 'styledDiv',
  group: 'block',
  content: 'block+',
  parseHTML() {
    return [{ tag: 'div[style]', priority: 60 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute('class'),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
    };
  },
});
