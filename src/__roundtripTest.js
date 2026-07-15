// Temporary verification harness — imported dynamically by a Playwright run,
// never referenced by the app. Safe to delete.
import { generateJSON, generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  TipCallout, VerseBlock, ArabicProse, FootnoteSup, DirAttribute,
} from './components/common/tiptapExtensions';

export function runRoundTrip() {
  const extensions = [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Underline,
    Link.configure({ openOnClick: false }),
    Image,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: false }),
    TableRow, TableCell, TableHeader,
    TipCallout, VerseBlock, ArabicProse, FootnoteSup, DirAttribute,
  ];

  const input = `
    <h2>Lesson</h2>
    <p dir="rtl">نص عربي</p>
    <div class="tip"><p>Remember the rule.</p></div>
    <p class="verse">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
    <p class="arabic-prose">الكلام العربي</p>
    <p>See note<sup data-footnote="Sahih Muslim 2699">1</sup> here.</p>
    <table><tbody><tr><th dir="rtl">اسم</th><td>noun</td></tr></tbody></table>
    <blockquote><p>quoted</p></blockquote>
    <p><u>underlined</u> and <a href="https://example.com">a link</a></p>
  `;

  const json = generateJSON(input, extensions);
  const out = generateHTML(json, extensions);

  const checks = {
    'tip class': out.includes('class="tip"'),
    'verse class': out.includes('class="verse"'),
    'arabic-prose class': out.includes('class="arabic-prose"'),
    'data-footnote': out.includes('data-footnote="Sahih Muslim 2699"'),
    'dir on paragraph': /<p[^>]*dir="rtl"/.test(out),
    'dir on table header': /<th[^>]*dir="rtl"/.test(out),
    'table survives': out.includes('<table') && out.includes('<th') && out.includes('<td'),
    'blockquote survives': out.includes('<blockquote'),
    'underline survives': out.includes('<u>'),
    'link survives': out.includes('href="https://example.com"'),
    'arabic text survives': out.includes('بِسْمِ اللَّهِ'),
  };

  return { checks, out };
}
