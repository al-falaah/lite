// One-off: insert the TMP 102 appendix chapter (chapter_number 5 in milestone 1),
// its lesson_quiz, all 15 quiz_questions, and bump Maraatib to chapter_number 6.
// Run from project root:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node /tmp/insert_appendix_chapter.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const COURSE_ID = 'ed848813-91ff-4cd1-be60-ca8505902f9d'; // TMP 102
const MARAATIB_ID = '64bf3b30-cee8-4468-bef8-f66afa382e55'; // existing chapter_number 5

const LESSON_HTML = fs.readFileSync('scripts/data/appendix_istiadhah_lesson.html', 'utf8');
const QUIZ_QUESTIONS = JSON.parse(fs.readFileSync('scripts/data/appendix_istiadhah_quiz.json', 'utf8'));

const NEW_CHAPTER = {
  course_id: COURSE_ID,
  title: "Appendix: Special Cases of Isti'aadhah and Basmalah",
  slug: 'appendix-special-cases-istiaadhah-basmalah',
  chapter_number: 5,
  content: LESSON_HTML,
  content_type: 'rich_text',
  is_published: true,
  published_at: new Date().toISOString(),
  milestone_index: 1,
  week_number: 4, // after the original Isti'aadhah lesson (week_number 3)
};

const NEW_QUIZ = {
  // chapter_id filled in after chapter insert
  title: "Quiz: Special Cases of Isti'aadhah and Basmalah",
  subtitle: 'Mid-surah rules, breaks in recitation, Sūrat At-Tawbah, and the mīm of الٓمٓ.',
  passing_score: 10,
  shuffle_questions: true,
  shuffle_options: true,
  is_published: true,
  published_at: new Date().toISOString(),
};

async function main() {
  console.log('Step 1: bump Maraatib chapter_number 5 → 6 (temp 99 to avoid unique conflict)');
  const { error: tempErr } = await supabase
    .from('lesson_chapters')
    .update({ chapter_number: 99 })
    .eq('id', MARAATIB_ID);
  if (tempErr) throw new Error(`temp bump: ${tempErr.message}`);

  console.log('Step 2: insert new appendix chapter at chapter_number 5');
  const { data: ch, error: chErr } = await supabase
    .from('lesson_chapters')
    .insert(NEW_CHAPTER)
    .select('id')
    .single();
  if (chErr) {
    console.error('chapter insert failed, rolling back temp move…');
    await supabase.from('lesson_chapters').update({ chapter_number: 5 }).eq('id', MARAATIB_ID);
    throw new Error(`chapter insert: ${chErr.message}`);
  }
  console.log(`  ✓ inserted chapter ${ch.id}`);

  console.log('Step 3: finalize Maraatib chapter_number → 6');
  const { error: finalErr } = await supabase
    .from('lesson_chapters')
    .update({ chapter_number: 6 })
    .eq('id', MARAATIB_ID);
  if (finalErr) throw new Error(`finalize maraatib: ${finalErr.message}`);

  console.log('Step 4: insert lesson_quiz row');
  const { data: qz, error: qzErr } = await supabase
    .from('lesson_quizzes')
    .insert({ ...NEW_QUIZ, chapter_id: ch.id })
    .select('id')
    .single();
  if (qzErr) throw new Error(`quiz insert: ${qzErr.message}`);
  console.log(`  ✓ inserted quiz ${qz.id}`);

  console.log(`Step 5: insert ${QUIZ_QUESTIONS.length} quiz_questions`);
  const rows = QUIZ_QUESTIONS.map(q => ({
    quiz_id: qz.id,
    question_number: q.question_number,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    section_tag: q.section_tag,
  }));
  const { error: qsErr } = await supabase.from('quiz_questions').insert(rows);
  if (qsErr) throw new Error(`quiz_questions insert: ${qsErr.message}`);
  console.log(`  ✓ inserted ${rows.length} questions`);

  console.log('\nDone. New chapter id:', ch.id, '· New quiz id:', qz.id);
}

main().catch(err => { console.error('FAILED:', err); process.exit(1); });
