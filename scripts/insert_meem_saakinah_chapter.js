import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminClient } from './_lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_301_COURSE_ID = '47e88596-5625-4f5a-a670-62a2901587ce';

async function main() {
  const supabase = adminClient();

  const html = fs.readFileSync(
    path.join(__dirname, 'data', 'meem_saakinah_lesson.html'),
    'utf-8'
  );

  const { data: existing, error: existingErr } = await supabase
    .from('lesson_chapters')
    .select('id, chapter_number, title')
    .eq('course_id', TMP_301_COURSE_ID)
    .order('chapter_number', { ascending: true });

  if (existingErr) {
    console.error('Failed to read existing chapters:', existingErr);
    process.exit(1);
  }
  console.log('Existing chapters in TMP 301:');
  existing.forEach((c) =>
    console.log(`  #${c.chapter_number} — ${c.title} (${c.id})`)
  );

  const nextNumber =
    existing.length === 0
      ? 1
      : Math.max(...existing.map((c) => c.chapter_number)) + 1;

  const chapterRow = {
    course_id: TMP_301_COURSE_ID,
    chapter_number: nextNumber,
    milestone_index: 1,
    week_number: 2,
    title: 'Tajweed Rules of Mīm Sākinah',
    slug: 'tajweed-rules-of-meem-saakinah',
    content: html,
    content_type: 'rich_text',
    is_published: false,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('lesson_chapters')
    .insert(chapterRow)
    .select('id, chapter_number, title, is_published')
    .single();

  if (insertErr) {
    console.error('Insert failed:', insertErr);
    process.exit(1);
  }

  console.log('\nInserted:');
  console.log(`  id: ${inserted.id}`);
  console.log(`  chapter_number: ${inserted.chapter_number}`);
  console.log(`  title: ${inserted.title}`);
  console.log(`  published: ${inserted.is_published}`);
}

main();
