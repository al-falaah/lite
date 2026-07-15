import { Node, Extension, mergeAttributes } from '@tiptap/core';
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

// <div class="tip">…</div> — callout box
export const TipCallout = Node.create({
  name: 'tipCallout',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div.tip' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'tip' }), 0];
  },
  addCommands() {
    return {
      toggleTipCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
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

// Preserve dir="rtl" (or any dir) on common block elements
export const DirAttribute = Extension.create({
  name: 'dirAttribute',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'tableCell', 'tableHeader', 'listItem'],
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
