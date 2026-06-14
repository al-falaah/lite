// One-off: insert TMP 102 chapter 7 — Makhārij al-Ḥurūf — and its quiz.
//
// Usage:
//   node scripts/insertMakhaarijChapter.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const COURSE_ID = 'ed848813-91ff-4cd1-be60-ca8505902f9d'; // TMP 102

const LESSON_HTML = fs.readFileSync('scripts/data/makhaarij_lesson.html', 'utf8');
const QUIZ_QUESTIONS = JSON.parse(fs.readFileSync('scripts/data/makhaarij_quiz.json', 'utf8'));

const NEW_CHAPTER = {
  course_id: COURSE_ID,
  title: 'Makhārij al-Ḥurūf — The Articulation Points',
  slug: 'makhaarij-al-huruuf',
  chapter_number: 7,
  content: LESSON_HTML,
  content_type: 'rich_text',
  is_published: true,
  published_at: new Date().toISOString(),
  milestone_index: 1,
  week_number: 4,
};

const NEW_QUIZ = {
  // chapter_id filled in after chapter insert
  title: 'Quiz: Makhārij al-Ḥurūf',
  subtitle: "The five main articulation points and the seventeen specific makhārij of Arabic letters.",
  passing_score: 10,
  shuffle_questions: true,
  shuffle_options: true,
  is_published: true,
  published_at: new Date().toISOString(),
};

async function main() {
  console.log('Step 1: insert chapter 7 (Makhārij)');
  const { data: ch, error: chErr } = await supabase
    .from('lesson_chapters')
    .insert(NEW_CHAPTER)
    .select('id')
    .single();
  if (chErr) throw new Error(`chapter insert: ${chErr.message}`);
  console.log(`  ✓ inserted chapter ${ch.id}`);

  console.log('Step 2: insert lesson_quiz row');
  const { data: qz, error: qzErr } = await supabase
    .from('lesson_quizzes')
    .insert({ ...NEW_QUIZ, chapter_id: ch.id })
    .select('id')
    .single();
  if (qzErr) throw new Error(`quiz insert: ${qzErr.message}`);
  console.log(`  ✓ inserted quiz ${qz.id}`);

  console.log(`Step 3: insert ${QUIZ_QUESTIONS.length} quiz_questions`);
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
