// One-off: insert TMP 201 chapter 3 (M2 / week 7) — Ṣifāt al-Ḥurūf (Part 2):
// strength, weakness, attribute extraction, and closing mulāḥaẓāt — with its quiz.
//
// Usage:
//   node scripts/insertSifaatStrengthChapter.js

import fs from 'fs';
import { adminClient } from './_lib/supabase.js';

const supabase = adminClient();

const COURSE_ID = '859bbc8d-643f-4e90-a94b-621fb6015aba'; // TMP 201

const LESSON_HTML = fs.readFileSync('scripts/data/sifaat_strength_lesson.html', 'utf8');
const QUIZ_QUESTIONS = JSON.parse(fs.readFileSync('scripts/data/sifaat_strength_quiz.json', 'utf8'));

const NEW_CHAPTER = {
  course_id: COURSE_ID,
  title: 'Ṣifāt al-Ḥurūf (Part 2) — Strength, Weakness, and Extraction',
  slug: 'sifaat-al-huruuf-strength',
  chapter_number: 3,
  content: LESSON_HTML,
  content_type: 'rich_text',
  is_published: true,
  published_at: new Date().toISOString(),
  milestone_index: 2,
  week_number: 7,
};

const NEW_QUIZ = {
  title: 'Quiz: Ṣifāt — Strength, Weakness, and Extraction',
  subtitle: "Strong vs weak attributes, the five tiers of letters, the 6-step extraction method, and the closing mulāḥaẓāt.",
  passing_score: 12,
  shuffle_questions: true,
  shuffle_options: true,
  is_published: true,
  published_at: new Date().toISOString(),
};

async function main() {
  console.log('Step 1: insert chapter 3 (Strength/Weakness) into TMP 201');
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
