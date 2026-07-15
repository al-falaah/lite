import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  BookOpen,
  Lightbulb,
  Undo,
  Redo,
  Superscript as SuperscriptIcon,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Languages,
  Columns,
  Rows,
  Trash2,
  PaintBucket,
} from 'lucide-react';
import {
  TipCallout,
  VerseBlock,
  ArabicProse,
  FootnoteSup,
  DirAttribute,
  StyleAttribute,
  SpanMark,
  SmallMark,
  Figure,
  Figcaption,
  StyledDiv,
  ColorTableCell,
  ColorTableHeader,
} from './tiptapExtensions';

/**
 * WYSIWYG lesson/blog editor (Tiptap v2). Drop-in replacement for
 * RichTextEditor: same { value, onChange, placeholder, useBlogStyle } props,
 * HTML string in / HTML string out — storage format is unchanged.
 *
 * Markdown-style input shortcuts work out of the box ("## " → H2, "> " →
 * quote, "- " → list). The HTML source toggle is the escape hatch for markup
 * the visual editor doesn't model.
 */

// Normalize HTML enough to compare "did Tiptap drop content on load?"
const normalize = (html) =>
  (html || '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();

const BTN =
  'p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors';
const BTN_ACTIVE = 'p-1.5 rounded bg-emerald-100 text-emerald-700 transition-colors';

// Cell fill palette (soft, brand-aligned tints + a clear option).
const CELL_COLORS = [
  { name: 'None', value: null, swatch: '#ffffff' },
  { name: 'Emerald', value: '#d1fae5', swatch: '#d1fae5' },
  { name: 'Amber', value: '#fef3c7', swatch: '#fef3c7' },
  { name: 'Rose', value: '#ffe4e6', swatch: '#ffe4e6' },
  { name: 'Sky', value: '#e0f2fe', swatch: '#e0f2fe' },
  { name: 'Slate', value: '#f1f5f9', swatch: '#f1f5f9' },
];

function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      className={active ? BTN_ACTIVE : BTN}>
      {children}
    </button>
  );
}

const TiptapEditor = ({ value, onChange, placeholder, useBlogStyle = false }) => { // eslint-disable-line no-unused-vars
  const [showHtml, setShowHtml] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState(value || '');
  const [lossWarning, setLossWarning] = useState(false);
  const [showBar, setShowBar] = useState(false); // floating toolbar visibility
  const checkedInitialLoad = useRef(false);
  const blurTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      // H4 included: real lessons use <h4> sub-headings; without it StarterKit
      // silently downgrades them on load (verified against DB content).
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: placeholder || 'Write here…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      ColorTableCell,
      ColorTableHeader,
      TipCallout,
      VerseBlock,
      ArabicProse,
      FootnoteSup, // registered instead of plain Superscript — preserves data-footnote
      DirAttribute,
      StyleAttribute,
      SpanMark,
      SmallMark,
      Figure,
      Figcaption,
      StyledDiv,
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    onFocus: () => { clearTimeout(blurTimer.current); setShowBar(true); },
  });

  // Round-trip safety check on first load of non-empty content. Runs AFTER the
  // editor has parsed (guarded by isEmpty), and only warns on genuine loss.
  // A naive length compare false-positives because Tiptap normalizes tables
  // LARGER (adds colgroup/colspan) — so we compare TAG MULTISETS instead:
  // warn only if a tag present in the source is missing from the output.
  useEffect(() => {
    if (!editor || checkedInitialLoad.current) return;
    const incoming = normalize(value);
    if (!incoming) { checkedInitialLoad.current = true; return; }
    // Wait until Tiptap has actually loaded the doc (avoids a mount-race where
    // getHTML() returns an empty doc and the check fires spuriously).
    const parsed = normalize(editor.getHTML());
    if (editor.isEmpty || parsed.length < 20) return; // not parsed yet — retry next tick
    checkedInitialLoad.current = true;

    const tagCounts = (s) => {
      const m = {}; let x;
      const re = /<([a-z][a-z0-9]*)/gi;
      while ((x = re.exec(s))) { const t = x[1].toLowerCase(); m[t] = (m[t] || 0) + 1; }
      return m;
    };
    const ci = tagCounts(incoming);
    const co = tagCounts(parsed);
    // Ignore tags our extensions intentionally rewrite rather than drop:
    //  - col/colgroup/tbody/thead: Tiptap's table model normalizes these
    //    (header cells survive as <th>, which is what the reader styles).
    //  - div: our VerseBlock/ArabicProse render <div class="verse|arabic-prose">
    //    as the semantic <p class="…">, so the div count legitimately falls.
    //  - br: Tiptap may collapse trailing hard breaks.
    const IGNORE = new Set(['col', 'colgroup', 'br', 'tbody', 'thead', 'div']);
    const lost = Object.keys(ci).some(
      (t) => !IGNORE.has(t) && (co[t] || 0) < ci[t] * 0.5
    );
    if (lost) setLossWarning(true);
  }, [editor, value, editor?.isEmpty]);

  // External value sync (e.g. switching which chapter is being edited).
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (normalize(value) !== normalize(editor.getHTML())) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const insertFootnote = () => {
    const note = window.prompt('Footnote text');
    if (!note) return;
    editor.chain().focus().toggleSuperscript().run();
    editor.chain().focus().updateAttributes('superscript', { 'data-footnote': note }).run();
  };

  const enterHtmlView = () => {
    setHtmlDraft(editor.getHTML());
    setShowHtml(true);
  };

  const exitHtmlView = () => {
    editor.commands.setContent(htmlDraft || '', false);
    onChange(htmlDraft || '');
    setShowHtml(false);
  };

  // Hide the floating bar shortly after focus leaves the editor+toolbar.
  const scheduleHide = () => {
    clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setShowBar(false), 150);
  };

  return (
    <div
      className="border border-gray-300 rounded-lg focus-within:border-emerald-600 transition-colors bg-white"
      onBlur={scheduleHide}
      onFocus={() => { clearTimeout(blurTimer.current); setShowBar(true); }}
    >
      {lossWarning && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 rounded-t-lg">
          Some formatting in this content isn't supported by the visual editor — check the
          HTML view before saving.
        </div>
      )}

      {/* Floating toolbar — fixed to the bottom-center of the viewport while
          the editor is focused, so it's always reachable no matter where you
          scroll or edit (Paper/Notion-style). */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-5 z-50 max-w-[calc(100vw-1.5rem)] overflow-x-auto flex items-center gap-0.5 px-2 py-1.5 rounded-xl border border-gray-200 bg-white/95 backdrop-blur shadow-lg ring-1 ring-black/5 transition-all duration-200 ${
          showBar && !showHtml ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton title="Bold" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Code" active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton title="Insert table"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive('table') && (
          <>
            <ToolbarButton title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Columns className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <Columns className="h-4 w-4 opacity-40" />
            </ToolbarButton>
            <ToolbarButton title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <Rows className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
              <Rows className="h-4 w-4 opacity-40" />
            </ToolbarButton>
            {/* Cell fill colours */}
            <span className="inline-flex items-center gap-0.5 px-1">
              <PaintBucket className="h-3.5 w-3.5 text-gray-400" />
              {CELL_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={`Cell fill: ${c.name}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', c.value).run()}
                  className="h-4 w-4 rounded-sm border border-gray-300 hover:ring-2 hover:ring-emerald-400 transition-all"
                  style={{ backgroundColor: c.swatch }}
                >
                  {c.value === null && <span className="block text-[8px] leading-none text-gray-400">✕</span>}
                </button>
              ))}
            </span>
            <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </ToolbarButton>
          </>
        )}
        <ToolbarButton title="Callout box" active={editor.isActive('tipCallout')}
          onClick={() => editor.chain().focus().toggleTipCallout().run()}>
          <Lightbulb className="h-4 w-4" />
        </ToolbarButton>
        {editor.isActive('tipCallout') && (
          <>
            {[
              { v: '', label: 'Note' },
              { v: 'key', label: 'Key' },
              { v: 'warning', label: 'Caution' },
            ].map(({ v, label }) => (
              <button
                key={v || 'note'}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().setTipVariant(v).run()}
                title={`Callout type: ${label}`}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  editor.isActive('tipCallout', { variant: v })
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </>
        )}
        <ToolbarButton title="Qur'anic verse (centered Arabic)" active={editor.isActive('verseBlock')}
          onClick={() => editor.chain().focus().setVerseBlock().run()}>
          <BookOpen className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Arabic prose (RTL block)" active={editor.isActive('arabicProse')}
          onClick={() => editor.chain().focus().setArabicProse().run()}>
          <Languages className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Footnote" active={editor.isActive('superscript')} onClick={insertFootnote}>
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Persistent header strip: HTML-source toggle, always reachable
          (the floating format bar hides in HTML mode / when unfocused). */}
      <div className={`flex items-center justify-end px-2 py-1.5 border-b border-gray-200 bg-gray-50 ${lossWarning ? '' : 'rounded-t-lg'}`}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={showHtml ? exitHtmlView : enterHtmlView}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            showHtml ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          {showHtml ? 'Visual editor' : 'HTML source'}
        </button>
      </div>

      {/* Body */}
      {showHtml ? (
        <textarea
          value={htmlDraft}
          onChange={(e) => { setHtmlDraft(e.target.value); onChange(e.target.value); }}
          className="w-full min-h-[300px] p-4 font-mono text-xs text-gray-800 focus:outline-none resize-y"
          spellCheck={false}
        />
      ) : (
        <EditorContent
          editor={editor}
          className="tiptap-lesson-editor prose max-w-none p-4 min-h-[300px]
            [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px]
            prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2"
        />
      )}

      {/* Editor-only styles for the Arabic vocabulary + placeholder */}
      <style>{`
        .tiptap-lesson-editor .verse {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif;
          font-size: 28px;
          line-height: 2;
          text-align: center;
          direction: rtl;
          padding: 16px 20px;
          margin: 20px 0;
          border-radius: 8px;
          background: rgba(5, 150, 105, 0.05);
        }
        .tiptap-lesson-editor .arabic-prose {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Arabic Typesetting', serif;
          font-size: 1.25rem;
          line-height: 2;
          direction: rtl;
          text-align: right;
        }
        .tiptap-lesson-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          float: left;
          height: 0;
          pointer-events: none;
        }
        /* Typed callouts — mirror the reader so WYSIWYG matches the result */
        .tiptap-lesson-editor .tip {
          --c-accent: #059669; --c-tint: rgba(5,150,105,0.05); --c-label: #047857;
          --c-icon: '💡'; --c-name: 'Note';
          position: relative; margin: 1.25rem 0; padding: 1rem 1.25rem;
          border: 1px solid color-mix(in srgb, var(--c-accent) 14%, transparent);
          border-radius: 12px; background: var(--c-tint);
        }
        .tiptap-lesson-editor .tip.tip-key { --c-accent:#475569; --c-tint:rgba(71,85,105,0.05); --c-label:#334155; --c-icon:'🔑'; --c-name:'Key terms'; }
        .tiptap-lesson-editor .tip.tip-warning { --c-accent:#d97706; --c-tint:rgba(217,119,6,0.06); --c-label:#b45309; --c-icon:'⚠️'; --c-name:'Caution'; }
        .tiptap-lesson-editor .tip::before {
          content: var(--c-icon) '\\00a0\\00a0' var(--c-name);
          display:inline-block; font-size:0.68rem; font-weight:700; letter-spacing:0.05em;
          text-transform:uppercase; color:var(--c-label);
          background: color-mix(in srgb, var(--c-accent) 12%, transparent);
          padding: 0.2rem 0.6rem; border-radius: 999px; margin-bottom:0.7rem;
        }
        .tiptap-lesson-editor .tip > :first-of-type { margin-top: 0; }
        .tiptap-lesson-editor .tip > :last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
